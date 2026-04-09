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
    // 1. Verificar autenticación via JWT claims
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      throw new Error("Usuario no autenticado");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);

    if (claimsError || !claimsData?.claims?.sub) {
      throw new Error("Usuario no autenticado");
    }

    const userId = claimsData.claims.sub;

    // 2. Parsear request body
    const { amount = 1, description = "Suscripción Premium HomeFinder", locationOrigin } = await req.json();

    if (!locationOrigin) {
      throw new Error("locationOrigin es requerido para redirecciones");
    }

    const mpAccessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!mpAccessToken) {
      throw new Error("MERCADOPAGO_ACCESS_TOKEN no configurado en entorno");
    }

    // 3. Crear preferencia via API REST directa (sin SDK)
    console.log(`Creando preferencia para usuario ${userId} por ${amount} UYU`);

    const baseUrl = Deno.env.get("MP_WEBHOOK_BASE_URL") || Deno.env.get("SUPABASE_URL");
    const notificationURL = `${baseUrl}/functions/v1/mp-webhook`;

    const preferenceBody = {
      items: [
        {
          id: "premium_upgrade",
          title: description,
          quantity: 1,
          unit_price: Number(amount),
        },
      ],
      back_urls: {
        success: `${locationOrigin}/payments/success`,
        failure: `${locationOrigin}/payments/failure`,
        pending: `${locationOrigin}/payments/pending`,
      },
      auto_return: "approved",
      external_reference: userId,
      notification_url: notificationURL,
    };

    const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${mpAccessToken}`,
      },
      body: JSON.stringify(preferenceBody),
    });

    if (!mpRes.ok) {
      const errorBody = await mpRes.text();
      console.error("MercadoPago API error:", mpRes.status, errorBody);
      throw new Error(`MercadoPago error ${mpRes.status}: ${errorBody}`);
    }

    const result = await mpRes.json();
    console.log("Preferencia creada con éxito:", result.id);

    return new Response(
      JSON.stringify({ init_point: result.init_point, id: result.id }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error al crear preferencia:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
