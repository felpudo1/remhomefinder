import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BATCH_SIZE = 5;

// Helper: Extraer imágenes de markdown y html (Copiado de scrape-property)
function extractImages(markdown: string, html: string, allLinks: string[]): string[] {
  const imageExtensions = /\.(jpg|jpeg|png|webp|avif)(\?|$)/i;
  const excludeExtensions = /\.(svg|gif|ico)(\?|$)/i;
  const imageSet = new Set<string>();

  allLinks.filter((l) => imageExtensions.test(l)).forEach((l) => imageSet.add(l));

  let match;
  const mdRx = /!\[.*?\]\((https?:\/\/[^\s)]+)\)/g;
  while ((match = mdRx.exec(markdown)) !== null) imageSet.add(match[1]);

  const imgRx = /(?:src|data-src|data-lazy-src)=["'](https?:\/\/[^"']+)/gi;
  while ((match = imgRx.exec(html)) !== null) imageSet.add(match[1]);

  const ogRx = /(?:property|name)=["']og:image["']\s+content=["'](https?:\/\/[^"']+)/gi;
  while ((match = ogRx.exec(html)) !== null) imageSet.add(match[1]);

  return Array.from(imageSet)
    .filter((url) => {
      if (excludeExtensions.test(url) || !imageExtensions.test(url)) return false;
      return !/(icon|logo|avatar|favicon|sprite|badge|button|arrow|chevron|pixel|tracking|analytics|agency|assets\/vectorial)/i.test(url)
        && !/(16x|32x|48x|64x|1x1|2x2|1\.gif|blank\.)/i.test(url);
    })
    .slice(0, 15);
}

// Helper: Extraer datos estructurados con Gemini AI usando el prompt de importación
async function extractWithAI(markdown: string, supabaseUrl: string, serviceKey: string) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

  const sb = createClient(supabaseUrl, serviceKey);

  // Intentar obtener el prompt especializado de importación masiva
  const { data: settings } = await sb
    .from("app_settings")
    .select("value")
    .eq("key", "scraper_prompt_import")
    .maybeSingle();

  const systemPrompt = settings?.value || "Sos un experto en extracción de avisos inmobiliarios masivos.";

  const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Extraé los datos de este aviso inmobiliario:\n\n${markdown.slice(0, 8000)}` },
      ],
      tools: [{
        type: "function",
        function: {
          name: "extract_property_data",
          description: "Extract structured property data from a listing",
          parameters: {
            type: "object",
            properties: {
              title: { type: "string" },
              listingType: { type: "string", enum: ["sale", "rent"] },
              priceRent: { type: "number" },
              priceExpenses: { type: "number" },
              currency: { type: "string" },
              department: { type: "string" },
              neighborhood: { type: "string" },
              city: { type: "string" },
              sqMeters: { type: "number" },
              rooms: { type: "number" },
              aiSummary: { type: "string" },
              isUnavailable: { type: "boolean", description: "True si el aviso dice que ya fue vendido, reservado, señalado o no está disponible" },
              ref: { type: "string" },
              details: { type: "string" },
              contactName: { type: "string" },
              contactPhone: { type: "string" },
            },
            required: ["title", "listingType", "currency", "priceRent"],
            additionalProperties: false,
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "extract_property_data" } },
    }),
  });

  if (!aiResponse.ok) {
    const errText = await aiResponse.text();
    throw new Error(`AI Gateway error: ${aiResponse.status} - ${errText}`);
  }

  const aiData = await aiResponse.json();
  const toolCall = aiData?.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall?.function?.arguments) throw new Error("La IA no pudo extraer los datos");
  
  return JSON.parse(toolCall.function.arguments);
}

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

    // OBTENER FILTROS DINÁMICOS DESDE APP_SETTINGS
    const { data: settingsData } = await sbAdmin
      .from("app_settings")
      .select("value")
      .eq("key", "scraper_unavailable_tokens")
      .single();
    
    const userTokens = settingsData?.value 
      ? settingsData.value.split(",").map((t: string) => t.trim().toLowerCase()).filter(Boolean)
      : ["ya fue señalada", "ups!", "propiedad ya fue", "no disponible", "señalada", "reservada"];

    console.log(`Usando ${userTokens.length} tokens de descarte:`, userTokens);

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

          // PASO 1: SCRAPE "PREMIUM"
          const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${firecrawlKey}`,
            },
            body: JSON.stringify({
              url: link.url,
              formats: ["markdown", "html"],
              onlyMainContent: false,
              waitFor: 2000,
              timeout: 30000,
            }),
          });

          if (!scrapeRes.ok) {
            const errText = await scrapeRes.text();
            throw new Error(`Firecrawl error: ${scrapeRes.status} - ${errText}`);
          }

          const scrapeData = await scrapeRes.json();
          
          // Buscar contenido en todas las ubicaciones posibles
          const markdown = scrapeData?.data?.markdown || scrapeData?.markdown || "";
          const html = scrapeData?.data?.html || scrapeData?.html || "";
          const allLinksFound = scrapeData?.data?.links || scrapeData?.links || [];
          const combinedText = (markdown + " " + html).toLowerCase();

          if (!markdown && !html) {
            console.error(`Scrape failed for ${link.url}: No content found`, scrapeData);
            throw new Error("No se pudo extraer contenido de la página (Markdown/HTML vacío)");
          }

          // HACHAZO PREVIO DINÁMICO: Si detectamos palabras de no disponibilidad
          if (userTokens.some((token: string) => combinedText.includes(token))) {
            console.log(`Propiedad descartada por Filtro Dinámico: ${link.url}`);
            return {
              linkId: link.id,
              success: false,
              isUnavailable: true,
              error: "Vendido/Reservado (Filtro)",
            };
          }

          // PASO 2: EXTRACCIÓN CON GEMINI IA (Usando nuestro prompt especializado)
          const extracted = await extractWithAI(markdown || html, supabaseUrl, serviceKey);

          // Si la IA detecta que ya no está disponible (backup por si el hachazo falló)
          if (extracted.isUnavailable === true) {
            console.log(`Propiedad descartada por IA: ${link.url}`);
            return {
              linkId: link.id,
              success: false,
              isUnavailable: true,
              error: "No disponible (detección IA)",
            };
          }

          // PASO 3: EXTRACCIÓN DE IMÁGENES PROFUNDA
          const imageUrls = extractImages(markdown, html, allLinksFound);
          console.log(`Found ${imageUrls.length} images for ${link.url}`);

          return {
            linkId: link.id,
            success: true,
            extracted_listing_type: extracted.listingType || "rent",
            property: {
              title: extracted.title || link.title || "Sin título",
              source_url: link.url,
              price_amount: Number(extracted.priceRent) || 0,
              currency: (extracted.currency || "USD").toUpperCase().includes("UY") ? "UYU" : "USD",
              address: extracted.address || "",
              neighborhood: extracted.neighborhood || "",
              city: extracted.city || "",
              department: extracted.department || "",
              rooms: Number(extracted.rooms) || 1,
              m2_total: Number(extracted.sqMeters) || 0,
              details: extracted.details || "",
              images: imageUrls, // Usamos todas las fotos encontradas
              price_expenses: Number(extracted.priceExpenses) || 0,
              total_cost: (Number(extracted.priceRent) || 0) + (Number(extracted.priceExpenses) || 0),
            },
          };
        } catch (err) {
          console.error(`Error procesando link ${link.url}:`, err);
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

    // MANEJO DE CONTADORES SEGURO
    try {
      await sbAdmin.rpc("update_discovery_task_counters", { _task_id: task_id });
    } catch (e) {
      console.warn("RPC update_discovery_task_counters falló.");
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
