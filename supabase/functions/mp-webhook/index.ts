import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { MercadoPagoConfig, Payment } from "npm:mercadopago";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("type") || url.searchParams.get("topic");

    let paymentId: string | null = null;

    if (req.headers.get("content-type")?.includes("application/json")) {
      const body = await req.json();
      console.log("Notificación JSON recibida:", body);
      
      if (body.type === "payment" && body.data?.id) {
        paymentId = body.data.id;
      } else if (body.action?.includes("payment") && body.data?.id) {
        paymentId = body.data.id;
      }
    } else {
      // Fallback para IPN antiguo (Query Params)
      if (action === "payment") {
        paymentId = url.searchParams.get("data.id");
      }
    }

    if (!paymentId) {
      console.log("Ignorando webhook (no es un evento de pago procesable)");
      return new Response("OK", { status: 200 });
    }

    const mpAccessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!mpAccessToken) {
        throw new Error("MERCADOPAGO_ACCESS_TOKEN no configurado");
    }

    const client = new MercadoPagoConfig({ accessToken: mpAccessToken });
    const paymentApi = new Payment(client);
    
    console.log(`Cosultando API de MP por ID de pago: ${paymentId}`);
    const paymentInfo = await paymentApi.get({ id: paymentId });
    
    console.log(`Estado del pago ${paymentId}: ${paymentInfo.status}`);

    if (paymentInfo.status === "approved") {
      const userId = paymentInfo.external_reference;
      
      if (!userId) {
         console.warn("Pago aprobado pero no tiene external_reference configurado.");
         return new Response("OK", { status: 200 });
      }

      console.log(`[EXITO] Ascendiendo a premium al usuario: ${userId}`);

      // IMPORTANTE: usar SUPABASE_SERVICE_ROLE_KEY para saltar RLS
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      const { error } = await supabaseAdmin
        .from("profiles")
        .update({ plan_type: "premium" })
        .eq("user_id", userId);

      if (error) {
        console.error("Error DB al actualizar perfil:", error);
        throw error; // Lanzamos el error para que MP reintente luego
      }

      console.log("¡Usuario es ahora Premium!");
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Error crítico procesando webhook:", error);
    // Devuelve 500 para indicarle a MP que reintente la notificación más tarde
    return new Response("Internal Server Error", { status: 500 });
  }
});
