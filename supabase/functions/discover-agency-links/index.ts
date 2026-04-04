import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Autenticación
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Cliente con permisos del usuario (RLS)
    const sbUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Validar identidad
    const token = authHeader.replace("Bearer ", "").trim();
    const { data: userData, error: userErr } = await sbUser.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    // Parsear body
    const body = await req.json();
    const { domain_url, org_id, task_id } = body;

    if (!domain_url || !org_id) {
      return new Response(JSON.stringify({ error: "domain_url y org_id son requeridos" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Cliente service role para inserciones masivas
    const sbAdmin = createClient(supabaseUrl, serviceKey);

    // Crear o reusar task
    let taskId = task_id;
    if (!taskId) {
      const { data: task, error: taskErr } = await sbUser
        .from("agency_discovery_tasks")
        .insert({ org_id, domain_url, created_by: userId, status: "processing" })
        .select("id")
        .single();

      if (taskErr) {
        return new Response(JSON.stringify({ error: "Error creando tarea: " + taskErr.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      taskId = task.id;
    }

    // Intentar scraping con Firecrawl (crawl del dominio)
    let links: Array<{ url: string; title: string; thumbnail_url: string }> = [];

    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY") || Deno.env.get("FIRECRAWL_API_KEY_1");

    if (firecrawlKey) {
      try {
        // Usar Firecrawl map endpoint para descubrir URLs del sitio
        const mapRes = await fetch("https://api.firecrawl.dev/v1/map", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${firecrawlKey}`,
          },
          body: JSON.stringify({
            url: domain_url,
            limit: 100,
          }),
        });

        if (mapRes.ok) {
          const mapData = await mapRes.json();
          const discoveredUrls: string[] = mapData?.links || mapData?.urls || [];

          // Filtrar URLs que parecen ser listados de propiedades
          const propertyPatterns = [
            /propiedad/i, /inmueble/i, /listing/i, /property/i,
            /venta/i, /alquiler/i, /rent/i, /sale/i,
            /apartamento/i, /casa/i, /local/i, /terreno/i,
            /ficha/i, /detalle/i, /detail/i,
          ];

          const filteredUrls = discoveredUrls.filter((url: string) => {
            // Excluir páginas genéricas
            const excludePatterns = [
              /contact/i, /about/i, /nosotros/i, /blog/i,
              /privacy/i, /terms/i, /legal/i, /login/i, /register/i,
              /favicon/i, /\.css$/i, /\.js$/i, /\.png$/i, /\.jpg$/i,
            ];
            if (excludePatterns.some((p) => p.test(url))) return false;

            // Si el dominio tiene muchas URLs, preferir las que parezcan propiedades
            if (discoveredUrls.length > 20) {
              return propertyPatterns.some((p) => p.test(url));
            }
            return true;
          });

          // Para cada URL, intentar obtener metadata OpenGraph (batch de 5)
          const batchSize = 5;
          for (let i = 0; i < filteredUrls.length; i += batchSize) {
            const batch = filteredUrls.slice(i, i + batchSize);
            const results = await Promise.allSettled(
              batch.map(async (url: string) => {
                try {
                  const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${firecrawlKey}`,
                    },
                    body: JSON.stringify({
                      url,
                      formats: ["extract"],
                      extract: {
                        schema: {
                          type: "object",
                          properties: {
                            title: { type: "string" },
                            og_image: { type: "string" },
                          },
                        },
                      },
                      timeout: 15000,
                    }),
                  });

                  if (scrapeRes.ok) {
                    const scrapeData = await scrapeRes.json();
                    const extracted = scrapeData?.data?.extract || {};
                    const metadata = scrapeData?.data?.metadata || {};
                    return {
                      url,
                      title: extracted.title || metadata?.title || metadata?.ogTitle || url.split("/").pop() || "",
                      thumbnail_url: extracted.og_image || metadata?.ogImage || "",
                    };
                  }
                  // Si falla, igual incluir con datos mínimos
                  return { url, title: url.split("/").pop() || "", thumbnail_url: "" };
                } catch {
                  return { url, title: url.split("/").pop() || "", thumbnail_url: "" };
                }
              })
            );

            for (const r of results) {
              if (r.status === "fulfilled") links.push(r.value);
            }
          }
        } else {
          const errText = await mapRes.text();
          console.error("Firecrawl map error:", errText);
        }
      } catch (err) {
        console.error("Error en Firecrawl discovery:", err);
      }
    }

    // Si no hay links, devolver vacío
    if (links.length === 0) {
      await sbAdmin
        .from("agency_discovery_tasks")
        .update({ status: "completed", total_links: 0 })
        .eq("id", taskId);

      return new Response(
        JSON.stringify({ task_id: taskId, links: [], message: "No se encontraron links de propiedades" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verificar duplicados contra properties existentes de la org
    const { data: existingProps } = await sbAdmin
      .from("agent_publications")
      .select("property_id, properties!inner(source_url)")
      .eq("org_id", org_id) as any;

    const existingUrls = new Set(
      (existingProps || [])
        .map((p: any) => p.properties?.source_url)
        .filter(Boolean)
        .map((u: string) => u.toLowerCase().replace(/\/$/, ""))
    );

    // Marcar duplicados
    const linksWithDupeInfo = links.map((l) => ({
      ...l,
      is_duplicate: existingUrls.has(l.url.toLowerCase().replace(/\/$/, "")),
    }));

    // Bulk insert de links descubiertos (solo los no duplicados)
    const linksToInsert = linksWithDupeInfo
      .filter((l) => !l.is_duplicate)
      .map((l) => ({
        task_id: taskId,
        url: l.url,
        title: l.title,
        thumbnail_url: l.thumbnail_url,
        status: "pending",
      }));

    if (linksToInsert.length > 0) {
      const { error: insertErr } = await sbAdmin
        .from("discovered_links")
        .upsert(linksToInsert, { onConflict: "task_id,url", ignoreDuplicates: true });

      if (insertErr) console.error("Error insertando links:", insertErr);
    }

    // Actualizar tarea con total
    await sbAdmin
      .from("agency_discovery_tasks")
      .update({ status: "completed", total_links: linksToInsert.length })
      .eq("id", taskId);

    return new Response(
      JSON.stringify({
        task_id: taskId,
        total: links.length,
        new_links: linksToInsert.length,
        duplicates: linksWithDupeInfo.filter((l) => l.is_duplicate).length,
        links: linksWithDupeInfo,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error general:", err);
    return new Response(
      JSON.stringify({ error: "Error interno del servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
