import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { MercadoPagoConfig, Preference } from "npm:mercadopago";
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
    const { amount = 1, currency = "UYU", description = "Suscripción Premium HomeFinder", locationOrigin } = await req.json();

    if (!locationOrigin) {
      throw new Error("locationOrigin es requerido para redirecciones");
    }

    const mpAccessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!mpAccessToken) {
      throw new Error("MERCADOPAGO_ACCESS_TOKEN no configurado en entorno");
    }

    // 3. Inicializar MercadoPago
    const client = new MercadoPagoConfig({ accessToken: mpAccessToken });
    const preference = new Preference(client);

    // 4. Armar la preferencia
    console.log(`Creando preferencia para usuario ${userId} por ${amount} ${currency}`);

    const baseUrl = Deno.env.get("MP_WEBHOOK_BASE_URL") || Deno.env.get("SUPABASE_URL");
    const notificationURL = `${baseUrl}/functions/v1/mp-webhook`;

    const result = await preference.create({
      body: {
        items: [
          {
            id: "premium_upgrade",
            title: description,
            quantity: 1,
            unit_price: Number(amount),
            currency_id: currency,
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
      },
    });

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