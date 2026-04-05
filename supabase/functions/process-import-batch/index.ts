import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BATCH_SIZE = 5;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const sbAdmin = createClient(supabaseUrl, serviceKey);

  try {
    const authHeader = req.headers.get("Authorization");
    const body = await req.clone().json();
    const { task_id, org_id, user_id: bodyUserId } = body;

    let userId = bodyUserId;

    if (authHeader?.startsWith("Bearer ") && !bodyUserId) {
      const sbUser = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const token = authHeader.replace("Bearer ", "").trim();
      const { data: userData, error: userErr } = await sbUser.auth.getUser(token);
      if (userErr || !userData?.user) {
        return new Response(JSON.stringify({ error: "No autorizado" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      userId = userData.user.id;
    }

    if (!task_id || !org_id || !userId) {
      return new Response(JSON.stringify({ error: "task_id, org_id y user_id son requeridos" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: queuedLinks, error: fetchErr } = await sbAdmin
      .from("discovered_links")
      .select("id, url, title, thumbnail_url")
      .eq("task_id", task_id)
      .eq("status", "queued")
      .limit(BATCH_SIZE);

    if (fetchErr) {
      console.error("Error obteniendo links:", fetchErr);
      return new Response(JSON.stringify({ error: "Error obteniendo links" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!queuedLinks || queuedLinks.length === 0) {
      await sbAdmin
        .from("agency_discovery_tasks")
        .update({ status: "completed", updated_at: new Date().toISOString() })
        .eq("id", task_id);

      return new Response(
        JSON.stringify({ message: "No hay más links pendientes", completed: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const linkIds = queuedLinks.map((l: any) => l.id);
    await sbAdmin
      .from("discovered_links")
      .update({ status: "processing" })
      .in("id", linkIds);

    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY") || Deno.env.get("FIRECRAWL_API_KEY_1");

    const results = await Promise.allSettled(
      queuedLinks.map(async (link: any) => {
        try {
          if (!firecrawlKey) {
            throw new Error("No hay API key de scraping configurada");
          }

          const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${firecrawlKey}`,
            },
            body: JSON.stringify({
              url: link.url,
              formats: ["extract"],
              extract: {
                schema: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    price: { type: "number" },
                    currency: { type: "string" },
                    address: { type: "string" },
                    neighborhood: { type: "string" },
                    city: { type: "string" },
                    department: { type: "string" },
                    rooms: { type: "number" },
                    m2: { type: "number" },
                    description: { type: "string" },
                    images: { type: "array", items: { type: "string" } },
                    expenses: { type: "number" },
                    listing_type: { type: "string", enum: ["rent", "sale"] },
                  },
                },
              },
              timeout: 30000,
            }),
          });

          if (!scrapeRes.ok) {
            const errText = await scrapeRes.text();
            throw new Error(`Firecrawl error: ${scrapeRes.status} - ${errText}`);
          }

          const scrapeData = await scrapeRes.json();
          const extracted = scrapeData?.data?.extract || {};
          const metadata = scrapeData?.data?.metadata || {};

          return {
            linkId: link.id,
            success: true,
            extracted_listing_type: extracted.listing_type === "sale" ? "sale" : "rent",
            property: {
              title: extracted.title || metadata?.title || link.title || "Sin título",
              source_url: link.url,
              price_amount: Number(extracted.price) || 0,
              currency: (extracted.currency || "USD").toUpperCase().includes("UY") ? "UYU" : "USD",
              address: extracted.address || "",
              neighborhood: extracted.neighborhood || "",
              city: extracted.city || "",
              department: extracted.department || "",
              rooms: Number(extracted.rooms) || 1,
              m2_total: Number(extracted.m2) || 0,
              details: extracted.description || "",
              images: extracted.images || [],
              price_expenses: Number(extracted.expenses) || 0,
              total_cost: (Number(extracted.price) || 0) + (Number(extracted.expenses) || 0),
            },
          };
        } catch (err) {
          return {
            linkId: link.id,
            success: false,
            error: err instanceof Error ? err.message : "Error desconocido",
          };
        }
      })
    );

    const successes: any[] = [];
    const failures: any[] = [];

    for (const r of results) {
      if (r.status === "fulfilled") {
        if (r.value.success) {
          successes.push(r.value);
        } else {
          failures.push(r.value);
        }
      } else {
        failures.push({ linkId: "unknown", error: r.reason?.message || "Error" });
      }
    }

    let completedCount = 0;
    let failedCount = failures.length;

    if (successes.length > 0) {
      const propertiesToInsert = successes.map((s) => ({
        ...s.property,
        created_by: userId,
      }));

      const { data: insertedProps, error: propErr } = await sbAdmin
        .from("properties")
        .insert(propertiesToInsert)
        .select("id, source_url");

      if (propErr) {
        console.error("Error bulk insert properties:", propErr);
        const failedIds = successes.map((s) => s.linkId);
        await sbAdmin
          .from("discovered_links")
          .update({ status: "failed", error_message: "Error insertando propiedad: " + propErr.message })
          .in("id", failedIds);
        failedCount += successes.length;
      } else if (insertedProps) {
        const publications = insertedProps.map((p: any) => ({
          property_id: p.id,
          org_id,
          published_by: userId,
          listing_type: successes.find(
            (s) => s.property.source_url === p.source_url
          )?.extracted_listing_type || "rent",
        }));

        const { error: pubErr } = await sbAdmin
          .from("agent_publications")
          .insert(publications);

        if (pubErr) {
          console.error("Error creando publicaciones:", pubErr);
        }

        for (const prop of insertedProps) {
          const matchingSuccess = successes.find(
            (s) => s.property.source_url === (prop as any).source_url
          );
          if (matchingSuccess) {
            await sbAdmin
              .from("discovered_links")
              .update({ status: "completed", property_id: (prop as any).id })
              .eq("id", matchingSuccess.linkId);
          }
        }
        completedCount = insertedProps.length;
      }
    }

    if (failures.length > 0) {
      for (const f of failures) {
        if (f.linkId && f.linkId !== "unknown") {
          await sbAdmin
            .from("discovered_links")
            .update({ status: "failed", error_message: f.error || "Error desconocido" })
            .eq("id", f.linkId);
        }
      }
    }

    // MANEJO DE CONTADORES SEGURO (Try/Catch para que no crashee si no existe el RPC)
    try {
      await sbAdmin.rpc("update_discovery_task_counters", { _task_id: task_id });
    } catch (e) {
      console.warn("RPC update_discovery_task_counters no encontrado, usando fallback manual.");
    }

    const { data: counters } = await sbAdmin
      .from("discovered_links")
      .select("status")
      .eq("task_id", task_id);

    if (counters) {
      const completed = counters.filter((c: any) => c.status === "completed").length;
      const failed = counters.filter((c: any) => c.status === "failed").length;
      await sbAdmin
        .from("agency_discovery_tasks")
        .update({
          completed_links: completed,
          failed_links: failed,
          updated_at: new Date().toISOString(),
        })
        .eq("id", task_id);
    }

    const { count: remaining } = await sbAdmin
      .from("discovered_links")
      .select("id", { count: "exact", head: true })
      .eq("task_id", task_id)
      .eq("status", "queued");

    if (remaining && remaining > 0) {
      const selfUrl = `${supabaseUrl}/functions/v1/process-import-batch`;
      fetch(selfUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({ task_id, org_id, user_id: userId }),
      }).catch((err) => console.error("Error auto-invocación:", err));
    } else {
      await sbAdmin
        .from("agency_discovery_tasks")
        .update({ status: "completed", updated_at: new Date().toISOString() })
        .eq("id", task_id);
    }

    return new Response(
      JSON.stringify({
        processed: queuedLinks.length,
        completed: completedCount,
        failed: failedCount,
        remaining: remaining || 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error general process-import-batch:", err);
    return new Response(
      JSON.stringify({ error: "Error interno del servidor", details: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
