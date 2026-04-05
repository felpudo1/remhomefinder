import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Verificar autenticación
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      throw new Error("Usuario no autenticado");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error("Usuario no autenticado");
    }

    const userId = user.id;
    const userEmail = user.email || "";

    // 2. Parsear body
    const {
      amount = 15,
      currency = "UYU",
      interval = "monthly",
      description = "Suscripción Agente Premium",
      locationOrigin,
    } = await req.json();

    if (!locationOrigin) {
      throw new Error("locationOrigin es requerido para redirecciones");
    }

    const mpAccessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!mpAccessToken) {
      throw new Error("MERCADOPAGO_ACCESS_TOKEN no configurado en entorno");
    }

    // 3. Crear suscripción via Preapproval API (sin plan asociado)
    const frequency = interval === "yearly" ? 12 : 1;
    const frequencyType = "months";

    const preapprovalBody = {
      reason: description,
      auto_recurring: {
        frequency,
        frequency_type: frequencyType,
        transaction_amount: Number(amount),
        currency_id: currency,
      },
      back_url: `${locationOrigin}/payments/success?type=subscription`,
      payer_email: userEmail,
      external_reference: userId,
      status: "pending",
    };

    console.log(`Creando preapproval para agente ${userId} (${interval}) por ${amount} ${currency}`);

    const mpResponse = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${mpAccessToken}`,
      },
      body: JSON.stringify(preapprovalBody),
    });

    const mpData = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error("Error MP preapproval:", JSON.stringify(mpData));
      throw new Error(mpData.message || "Error al crear suscripción en MercadoPago");
    }

    console.log("Preapproval creado:", mpData.id);

    // 4. Guardar suscripción en BD con service role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { error: dbError } = await supabaseAdmin
      .from("subscriptions")
      .upsert({
        user_id: userId,
        mp_preapproval_id: mpData.id,
        status: "pending",
        plan_interval: interval,
      }, { onConflict: "user_id" });

    if (dbError) {
      console.error("Error al guardar suscripción en BD:", dbError);
      // No throw — la suscripción en MP ya se creó, no bloquear al usuario
    }

    return new Response(
      JSON.stringify({ init_point: mpData.init_point, id: mpData.id }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error al crear suscripción:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
