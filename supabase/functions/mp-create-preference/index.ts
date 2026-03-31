import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { MercadoPagoConfig, Preference } from "npm:mercadopago";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Manejo de preflight request de CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Verificar autenticación del usuario
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error("Usuario no autenticado");
    }

    // 2. Parsear request body
    const { amount = 1, currency = "USD", description = "Suscripción Premium HomeFinder", locationOrigin } = await req.json();

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
    console.log(`Creando preferencia para usuario ${user.id} por ${amount} ${currency}`);
    
    // Para entornos locales (ngrok) o producción (Supabase URL)
    // Cuando probamos local, MP necesita una IP pública para el webhook
    // SUPABASE_URL suele apuntar a producción si configuramos el env o al ngrok.
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
        external_reference: user.id, // Súper importante: ID del usuario
        notification_url: notificationURL, 
      },
    });

    console.log("Preferencia creada con éxito:", result.id);

    // 5. Devolver la URL de checkout
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
