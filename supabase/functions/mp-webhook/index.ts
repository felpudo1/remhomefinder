import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { MercadoPagoConfig, Payment } from "npm:mercadopago";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("type") || url.searchParams.get("topic");

    let paymentId: string | null = null;
    let isSubscriptionEvent = false;
    let preapprovalId: string | null = null;

    if (req.headers.get("content-type")?.includes("application/json")) {
      const body = await req.json();
      console.log("Notificación JSON recibida:", JSON.stringify(body));

      if (body.type === "payment" && body.data?.id) {
        paymentId = body.data.id;
      } else if (body.action?.includes("payment") && body.data?.id) {
        paymentId = body.data.id;
      } else if (body.type === "subscription_preapproval" && body.data?.id) {
        isSubscriptionEvent = true;
        preapprovalId = body.data.id;
      }
    } else {
      if (action === "payment") {
        paymentId = url.searchParams.get("data.id");
      }
    }

    const mpAccessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!mpAccessToken) {
      throw new Error("MERCADOPAGO_ACCESS_TOKEN no configurado");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // ═══════════ SUBSCRIPTION EVENT ═══════════
    if (isSubscriptionEvent && preapprovalId) {
      console.log(`Procesando evento de suscripción: ${preapprovalId}`);

      const mpResponse = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
        headers: { "Authorization": `Bearer ${mpAccessToken}` },
      });

      if (!mpResponse.ok) {
        console.error("Error al consultar preapproval:", mpResponse.status);
        return new Response("OK", { status: 200 });
      }

      const preapproval = await mpResponse.json();
      console.log(`Preapproval ${preapprovalId} status: ${preapproval.status}`);

      const userId = preapproval.external_reference;
      if (!userId) {
        console.warn("Preapproval sin external_reference");
        return new Response("OK", { status: 200 });
      }

      // Map MP status to our status
      let dbStatus = "pending";
      if (preapproval.status === "authorized") dbStatus = "authorized";
      else if (preapproval.status === "paused") dbStatus = "paused";
      else if (preapproval.status === "cancelled") dbStatus = "cancelled";

      // Calculate current_period_end based on next_payment_date or auto_recurring
      let periodEnd: string | null = null;
      if (preapproval.next_payment_date) {
        periodEnd = preapproval.next_payment_date;
      } else if (dbStatus === "authorized" && preapproval.auto_recurring) {
        const freq = preapproval.auto_recurring.frequency || 1;
        const now = new Date();
        now.setMonth(now.getMonth() + freq);
        periodEnd = now.toISOString();
      }

      // Upsert subscription
      const { error: subError } = await supabaseAdmin
        .from("subscriptions")
        .upsert({
          user_id: userId,
          mp_preapproval_id: preapprovalId,
          status: dbStatus,
          current_period_end: periodEnd,
        }, { onConflict: "mp_preapproval_id" });

      if (subError) {
        console.error("Error al actualizar suscripción:", subError);
      }

      // Update org plan_type based on subscription status
      if (dbStatus === "authorized") {
        console.log(`[EXITO] Ascendiendo org del agente ${userId} a premium`);

        // Update the agent's organization plan_type
        const { data: orgData } = await supabaseAdmin
          .from("organizations")
          .select("id")
          .eq("created_by", userId)
          .eq("type", "agency_team")
          .maybeSingle();

        if (orgData) {
          await supabaseAdmin
            .from("organizations")
            .update({ plan_type: "premium" })
            .eq("id", orgData.id);
        }

        // Also update profile plan_type
        await supabaseAdmin
          .from("profiles")
          .update({ plan_type: "premium" })
          .eq("user_id", userId);

        console.log("Agente es ahora Premium!");
      } else if (dbStatus === "cancelled" || dbStatus === "paused") {
        // Grace period: check if current_period_end is still in the future
        if (periodEnd && new Date(periodEnd) > new Date()) {
          console.log(`Gracia activa hasta ${periodEnd} para ${userId}`);
          // Don't downgrade yet — leave premium until period ends
        } else {
          console.log(`Sin período de gracia — downgrade para ${userId}`);
          const { data: orgData } = await supabaseAdmin
            .from("organizations")
            .select("id")
            .eq("created_by", userId)
            .eq("type", "agency_team")
            .maybeSingle();

          if (orgData) {
            await supabaseAdmin
              .from("organizations")
              .update({ plan_type: "free" })
              .eq("id", orgData.id);
          }

          await supabaseAdmin
            .from("profiles")
            .update({ plan_type: "free" })
            .eq("user_id", userId);
        }
      }

      return new Response("OK", { status: 200 });
    }

    // ═══════════ ONE-TIME PAYMENT EVENT ═══════════
    if (!paymentId) {
      console.log("Ignorando webhook (no es un evento procesable)");
      return new Response("OK", { status: 200 });
    }

    const client = new MercadoPagoConfig({ accessToken: mpAccessToken });
    const paymentApi = new Payment(client);

    console.log(`Consultando API de MP por ID de pago: ${paymentId}`);
    const paymentInfo = await paymentApi.get({ id: paymentId });

    console.log(`Estado del pago ${paymentId}: ${paymentInfo.status}`);

    if (paymentInfo.status === "approved") {
      const userId = paymentInfo.external_reference;

      if (!userId) {
        console.warn("Pago aprobado pero no tiene external_reference configurado.");
        return new Response("OK", { status: 200 });
      }

      console.log(`[EXITO] Ascendiendo a premium al usuario: ${userId}`);

      const { error } = await supabaseAdmin
        .from("profiles")
        .update({ plan_type: "premium" })
        .eq("user_id", userId);

      if (error) {
        console.error("Error DB al actualizar perfil:", error);
        throw error;
      }

      console.log("¡Usuario es ahora Premium!");
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Error crítico procesando webhook:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
});
