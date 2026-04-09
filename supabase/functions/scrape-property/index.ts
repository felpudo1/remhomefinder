import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Extrae el user_id (claim "sub") del JWT enviado en Authorization.
 * Si no existe o falla el parseo, retorna null.
 */
function getUserIdFromAuthHeader(req: Request): string | null {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.replace("Bearer ", "").trim();
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const payload = JSON.parse(atob(parts[1]));
    return typeof payload?.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

/**
 * Registra consumo de scraping para auditoría admin.
 * Se guarda incluso si no se publica luego la propiedad.
 */
async function logScrapeUsage(params: {
  req: Request;
  role: string;
  scraper: "firecrawl" | "zenrows" | "vision";
  channel: "url" | "image";
  success: boolean;
  tokenCharged: boolean;
  sourceUrl?: string | null;
  errorMessage?: string | null;
}) {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, serviceKey);
    const userId = getUserIdFromAuthHeader(params.req);

    await sb.from("scrape_usage_log").insert({
      user_id: userId,
      role: params.role === "agent" ? "agent" : "user",
      scraper: params.scraper,
      channel: params.channel,
      success: params.success,
      token_charged: params.tokenCharged,
      source_url: params.sourceUrl || null,
      error_message: params.errorMessage || null,
    });
  } catch (logError) {
    console.error("scrape usage log error:", logError);
  }
}

// ── Scraping helpers ── (v3 - fallback API key on insufficient credits)

/**
 * Intenta scrapear con una API key de Firecrawl.
 * Retorna el resultado o lanza error.
 */
async function _firecrawlRequest(apiKey: string, formattedUrl: string) {
  const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ url: formattedUrl, formats: ["markdown", "html"], onlyMainContent: true, waitFor: 2000 }),
  });

  const d = await res.json();
  if (!res.ok) {
    const errMsg = d?.error || "No se pudo acceder a la página";
    throw new Error(`Firecrawl: ${errMsg}`);
  }

  const markdown = d?.data?.markdown || d?.markdown || "";
  const html = d?.data?.html || d?.html || "";
  const allLinks: string[] = d?.data?.links || d?.links || [];
  return { markdown, html, imageUrls: extractImages(markdown, html, allLinks) };
}

async function scrapeWithFirecrawl(formattedUrl: string) {
  // Recopilar todas las keys disponibles en orden de prioridad
  const keyNames = ["FIRECRAWL_API_KEY", "FIRECRAWL_API_KEY_1", "FIRECRAWL_API_KEY_2"];
  const keys: string[] = [];
  for (const name of keyNames) {
    const val = Deno.env.get(name);
    if (val) keys.push(val);
  }
  // Deduplicar (por si el conector y el secreto manual tienen el mismo valor)
  const uniqueKeys = [...new Set(keys)];

  if (uniqueKeys.length === 0) {
    const envObj = Deno.env.toObject();
    console.error("FIRECRAWL_API_KEY not found. Available env keys containing 'FIRE':", 
      Object.keys(envObj).filter(k => k.includes("FIRE")));
    throw new Error("FIRECRAWL_API_KEY not configured");
  }

  // Intentar con cada key; si falla por créditos insuficientes, probar la siguiente
  for (let i = 0; i < uniqueKeys.length; i++) {
    try {
      return await _firecrawlRequest(uniqueKeys[i], formattedUrl);
    } catch (err: any) {
      const isCreditsError = err?.message?.toLowerCase().includes("insufficient credits");
      const isLastKey = i === uniqueKeys.length - 1;
      if (isCreditsError && !isLastKey) {
        const keyLabel = keyNames[i] || `key #${i + 1}`;
        const nextKeyLabel = keyNames[i + 1] || `key #${i + 2}`;
        console.warn(`⚠️ FALLBACK: ${keyLabel} sin créditos, cambiando a ${nextKeyLabel}...`);

        // Registrar alerta en BD para visibilidad admin
        try {
          const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
          const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
          const sb = createClient(supabaseUrl, serviceKey);
          await sb.from("system_alerts").insert({
            alert_type: "firecrawl_fallback",
            message: `API key primaria (${keyLabel}) sin créditos. Se activó respaldo ${nextKeyLabel}.`,
            metadata: {
              failed_key: keyLabel,
              fallback_key: nextKeyLabel,
              url: formattedUrl,
              timestamp: new Date().toISOString(),
            },
          });
        } catch (alertErr) {
          console.error("Error registrando alerta de fallback:", alertErr);
        }

        continue;
      }
      throw err; // Re-lanzar si no es error de créditos o es la última key
    }
  }

  // Nunca debería llegar acá, pero por seguridad
  throw new Error("Firecrawl: todas las API keys fallaron");
}

async function scrapeWithZenRows(formattedUrl: string) {
  const ZENROWS_API_KEY = Deno.env.get("ZENROWS_API_KEY");
  if (!ZENROWS_API_KEY) throw new Error("ZENROWS_API_KEY not configured");

  const params = new URLSearchParams({ url: formattedUrl, apikey: ZENROWS_API_KEY, js_render: "true", premium_proxy: "true" });
  const res = await fetch(`https://api.zenrows.com/v1/?${params.toString()}`);

  if (!res.ok) {
    const errText = await res.text();
    let detail = "";
    try { detail = JSON.parse(errText).title || JSON.parse(errText).detail || errText; } catch { detail = errText; }
    if (res.status === 400) throw new Error(`ZenRows: Este sitio no es compatible para scraping. (${detail})`);
    throw new Error(`ZenRows: No se pudo acceder a la página (${res.status}) - ${detail}`);
  }

  const html = await res.text();
  const cleanHtml = html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return { markdown: cleanHtml, html, imageUrls: extractImages("", html, []) };
}

function extractImages(markdown: string, html: string, allLinks: string[]): string[] {
  const imageExtensions = /\.(jpg|jpeg|png|webp|avif)(\?|$)/i;
  const excludeExtensions = /\.(svg|gif|ico)(\?|$)/i;
  const imageSet = new Set<string>();

  // 1. De los links detectados por Firecrawl
  allLinks.filter((l) => imageExtensions.test(l)).forEach((l) => imageSet.add(l));

  let match;
  // 2. Del markdown (links de imagen estándar)
  const mdRx = /!\[.*?\]\((https?:\/\/[^\s)]+)\)/g;
  while ((match = mdRx.exec(markdown)) !== null) imageSet.add(match[1]);

  // 3. Del HTML (búsqueda agresiva de atributos de imagen y lazy-loading)
  const imgRx = /(?:src|data-src|data-lazy-src|data-original|data-source|data-lazy|data-flickity-lazyload-src|data-zoom-image|data-main-image)=["'](https?:\/\/[^"']+)/gi;
  while ((match = imgRx.exec(html)) !== null) imageSet.add(match[1]);

  // 4. De etiquetas OpenGraph
  const ogRx = /(?:property|name)=["']og:image["']\s+content=["'](https?:\/\/[^"']+)/gi;
  while ((match = ogRx.exec(html)) !== null) imageSet.add(match[1]);

  return Array.from(imageSet)
    .filter((url) => {
      if (excludeExtensions.test(url) || !imageExtensions.test(url)) return false;
      // Quitamos 'agency' de la lista negra porque muchas inmobiliarias tienen fotos en subdominios agency.*
      return !/(icon|logo|avatar|favicon|sprite|badge|button|arrow|chevron|pixel|tracking|analytics|assets\/vectorial)/i.test(url)
        && !/(16x|32x|48x|64x|1x1|2x2|1\.gif|blank\.)/i.test(url);
    })
    .slice(0, 15); // Límite de 15 fotos por base de datos
}

// ── AI extraction ──

/**
 * Obtiene el prompt desde app_settings según el rol (user o agent).
 * Si no existe en la BD, retorna null y se usa el FALLBACK_PROMPT.
 */
async function getPromptFromDb(role: string): Promise<string | null> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const sb = createClient(supabaseUrl, serviceKey);

  const key = role === "agent" ? "scraper_prompt_agent" : "scraper_prompt_user";
  const { data } = await sb.from("app_settings").select("value").eq("key", key).maybeSingle();
  return data?.value || null;
}

const FALLBACK_PROMPT = `Sos un asistente que extrae datos de avisos inmobiliarios de Uruguay.
Analizá el contenido del aviso y extraé los datos de la propiedad.
- Para listingType: determiná si el aviso es de VENTA ("sale") o ALQUILER ("rent"). Buscá palabras clave como "venta", "vendo", "se vende", "USD venta" para sale, o "alquiler", "alquilo", "se alquila", "/mes" para rent. Esto es CRÍTICO, no asumas alquiler por defecto.
- Para moneda: usá "UYU" para pesos uruguayos, "USD" para dólares.
- Para el barrio: extraé el barrio o zona mencionada.
- Para el resumen: hacé un resumen breve de 1-2 oraciones destacando lo más importante del aviso.
- Si un dato no está disponible, dejalo vacío o en 0.`;

/**
 * Extrae datos estructurados del markdown usando IA.
 * El prompt se carga dinámicamente desde Supabase según el rol.
 */
async function extractWithAI(markdown: string, role: string): Promise<Record<string, any>> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

  // Cargar prompt desde BD, usar fallback si no existe
  const dbPrompt = await getPromptFromDb(role);
  const systemPrompt = dbPrompt || FALLBACK_PROMPT;

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
          description: "Extract structured property data from a real estate listing",
           parameters: {
            type: "object",
            properties: {
              title: { type: "string", description: "Título descriptivo de la propiedad" },
              listingType: { type: "string", enum: ["sale", "rent"], description: "Tipo de operación: 'sale' para venta, 'rent' para alquiler" },
              priceRent: { type: "number", description: "Precio de alquiler mensual (o precio total de venta si listingType es sale)" },
              priceExpenses: { type: "number", description: "Gastos comunes/expensas mensuales (0 si es venta)" },
              currency: { type: "string", description: "Moneda: USD, UYU o ARS" },
              department: { type: "string", description: "Departamento o provincia (ej: Montevideo, Canelones, Maldonado, Buenos Aires)" },
              neighborhood: { type: "string", description: "Barrio o zona" },
              city: { type: "string", description: "Ciudad (ej: Montevideo, Punta del Este, Buenos Aires)" },
              sqMeters: { type: "number", description: "Superficie en metros cuadrados" },
              rooms: { type: "number", description: "Cantidad de ambientes" },
              aiSummary: { type: "string", description: "Resumen breve del aviso" },
              ref: { type: "string", description: "Código de referencia del aviso si existe (ej: REF-123). Vacío si no se detecta." },
              details: { type: "string", description: "Detalles adicionales: características, amenities, descripción extendida. Vacío si no se detecta." },
              contactName: { type: "string", description: "Nombre de la persona o inmobiliaria de contacto. Vacío si no se detecta." },
              contactPhone: { type: "string", description: "Teléfono de contacto del aviso. Vacío si no se detecta." },
            },
            required: ["title", "listingType", "department", "city", "neighborhood", "aiSummary"],
            additionalProperties: false,
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "extract_property_data" } },
    }),
  });

  if (!aiResponse.ok) {
    const status = aiResponse.status;
    if (status === 429) throw new Error("Demasiadas solicitudes. Intentá de nuevo en unos segundos.");
    if (status === 402) throw new Error("Créditos de IA agotados.");
    throw new Error("Error al procesar con IA");
  }

  const aiData = await aiResponse.json();
  const toolCall = aiData?.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall?.function?.arguments) throw new Error("La IA no pudo extraer los datos del aviso");
  return JSON.parse(toolCall.function.arguments);
}

/**
 * Extrae datos de una propiedad a partir de screenshots (base64 data URLs).
 * Usa Gemini Vision via la gateway de Lovable.
 * @param images - Array de data URLs en base64 (ej: "data:image/jpeg;base64,...")
 */
async function extractWithVision(images: string[]): Promise<Record<string, any>> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

  // Construir el contenido multimodal: imagen(es) + texto de instrucción
  const imageContent = images.slice(0, 3).map((dataUrl) => ({
    type: "image_url",
    image_url: { url: dataUrl },
  }));

  const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{
        role: "user",
        content: [
          ...imageContent,
          {
            type: "text",
            text: `Analizá esta(s) imagen(es) de un aviso inmobiliario de Uruguay o Argentina y extraé los datos de la propiedad.
- Para listingType: determiná si es VENTA ("sale") o ALQUILER ("rent").
- Para moneda: usá "UYU" para pesos uruguayos, "ARS" para pesos argentinos, "USD" para dólares.
- Para el barrio: extraé el barrio o zona mencionada.
- Para el resumen: hacé un resumen breve de 1-2 oraciones.
- Si un dato no está visible, dejalo vacío o en 0.`,
          },
        ],
      }],
      tools: [{
        type: "function",
        function: {
          name: "extract_property_data",
          description: "Extract structured property data from a real estate listing screenshot",
          parameters: {
            type: "object",
            properties: {
              title: { type: "string", description: "Título descriptivo de la propiedad" },
              listingType: { type: "string", enum: ["sale", "rent"], description: "Tipo de operación" },
              priceRent: { type: "number", description: "Precio de alquiler o de venta" },
              priceExpenses: { type: "number", description: "Gastos comunes (0 si no aplica)" },
              currency: { type: "string", description: "Moneda: USD, UYU o ARS" },
              department: { type: "string", description: "Departamento o provincia (ej: Montevideo, Canelones, Maldonado)" },
              neighborhood: { type: "string", description: "Barrio o zona" },
              city: { type: "string", description: "Ciudad (ej: Montevideo, Punta del Este, Buenos Aires)" },
              sqMeters: { type: "number", description: "Superficie en metros cuadrados" },
              rooms: { type: "number", description: "Cantidad de ambientes" },
              aiSummary: { type: "string", description: "Resumen breve del aviso" },
              ref: { type: "string", description: "Código de referencia del aviso si existe. Vacío si no se detecta." },
              details: { type: "string", description: "Detalles adicionales: características, amenities, descripción extendida. Vacío si no se detecta." },
              contactName: { type: "string", description: "Nombre de la persona o inmobiliaria de contacto. Vacío si no se detecta." },
              contactPhone: { type: "string", description: "Teléfono de contacto del aviso. Vacío si no se detecta." },
            },
            required: ["title", "listingType", "department", "city", "neighborhood", "aiSummary"],
            additionalProperties: false,
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "extract_property_data" } },
    }),
  });

  if (!aiResponse.ok) {
    const status = aiResponse.status;
    if (status === 429) throw new Error("Demasiadas solicitudes. Intentá de nuevo en unos segundos.");
    if (status === 402) throw new Error("Créditos de IA agotados.");
    throw new Error("Error al procesar las imágenes con IA");
  }

  const aiData = await aiResponse.json();
  const toolCall = aiData?.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall?.function?.arguments) throw new Error("La IA no pudo extraer los datos de las imágenes");
  return JSON.parse(toolCall.function.arguments);
}

// ── Auth helper (Punto 5: validación JWT antes de gastar créditos) ──

async function validateAuth(req: Request): Promise<{ userId: string } | Response> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ success: false, error: "No autenticado" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const sb = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data?.user) {
    return new Response(JSON.stringify({ success: false, error: "Token inválido o expirado" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  return { userId: data.user.id };
}

// ── Main handler ──

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Punto 5: Validar autenticación ANTES de consumir recursos
    const authResult = await validateAuth(req);
    if (authResult instanceof Response) return authResult;

    // Desestructurar body: puede venir url (scraping) o images (visión)
    const { url, images, scraper = "firecrawl", role = "user" } = await req.json();

    // ── PATH DE VISIÓN: si vienen imágenes, analizarlas directamente con IA ──
    if (images && Array.isArray(images) && images.length > 0) {
      console.log(`Vision path: analizando ${images.length} imagen(es) con Gemini Vision`);
      const extracted = await extractWithVision(images);
      await logScrapeUsage({
        req,
        role,
        scraper: "vision",
        channel: "image",
        success: true,
        tokenCharged: true,
      });
      return new Response(JSON.stringify({
        success: true,
        data: {
          title: extracted.title || "",
          listingType: extracted.listingType || "rent",
          priceRent: extracted.priceRent || 0,
          priceExpenses: extracted.priceExpenses || 0,
          currency: extracted.currency || "UYU",
          department: extracted.department || "",
          neighborhood: extracted.neighborhood || "",
          city: extracted.city || "",
          sqMeters: extracted.sqMeters || 0,
          rooms: extracted.rooms || 1,
          aiSummary: extracted.aiSummary || "",
        ref: extracted.ref || "",
        details: extracted.details || "",
        contactName: extracted.contactName || "",
        contactPhone: extracted.contactPhone || "",
        images: [], // no se pueden copiar fotos desde screenshots
      },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── PATH DE URL: scraping + IA (comportamiento original) ──
    if (!url) {
      return new Response(JSON.stringify({ success: false, error: "Se requiere url o images" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) formattedUrl = `https://${formattedUrl}`;

    console.log(`Scraping URL with ${scraper} (role: ${role}):`, formattedUrl);

    const unsupportedDomains = ["facebook.com", "fb.com", "instagram.com", "tiktok.com"];
    if (unsupportedDomains.some(d => formattedUrl.toLowerCase().includes(d))) {
      await logScrapeUsage({
        req,
        role,
        scraper: scraper === "zenrows" ? "zenrows" : "firecrawl",
        channel: "url",
        success: false,
        tokenCharged: false,
        sourceUrl: formattedUrl,
        errorMessage: "MARKETPLACE_MANUAL",
      });
      return new Response(JSON.stringify({
        success: false, error: "MARKETPLACE_MANUAL",
        message: "MarketP, IG y otras RR.SS no permiten extraer sus datos por seguridad. Lamentamos que tenga que completar la publicación manualmente.",
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Step 1: Scrape
    let result;
    if (scraper === "zenrows") {
      try {
        result = await scrapeWithZenRows(formattedUrl);
      } catch (e) {
        console.warn(`ZenRows failed, falling back to Firecrawl: ${e instanceof Error ? e.message : e}`);
        result = await scrapeWithFirecrawl(formattedUrl);
      }
    } else {
      result = await scrapeWithFirecrawl(formattedUrl);
    }
    console.log(`Found ${result.imageUrls.length} property images`);

    if (!result.markdown) {
      return new Response(JSON.stringify({ success: false, error: "No se encontró contenido en la página" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Step 2: Extraer datos con IA usando el prompt específico al rol
    const extracted = await extractWithAI(result.markdown, role);
    await logScrapeUsage({
      req,
      role,
      scraper: scraper === "zenrows" ? "zenrows" : "firecrawl",
      channel: "url",
      success: true,
      tokenCharged: true,
      sourceUrl: formattedUrl,
    });

    return new Response(JSON.stringify({
      success: true,
      data: {
        title: extracted.title || "",
        listingType: extracted.listingType || "rent",
        priceRent: extracted.priceRent || 0,
        priceExpenses: extracted.priceExpenses || 0,
        currency: extracted.currency || "ARS",
        department: extracted.department || "",
        neighborhood: extracted.neighborhood || "",
        city: extracted.city || "",
        sqMeters: extracted.sqMeters || 0,
        rooms: extracted.rooms || 1,
        aiSummary: extracted.aiSummary || "",
        ref: extracted.ref || "",
        details: extracted.details || "",
        contactName: extracted.contactName || "",
        contactPhone: extracted.contactPhone || "",
        images: result.imageUrls,
      },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("scrape-property error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    try {
      const { url, images, scraper = "firecrawl", role = "user" } = await req.clone().json();
      await logScrapeUsage({
        req,
        role,
        scraper: images && Array.isArray(images) && images.length > 0
          ? "vision"
          : scraper === "zenrows" ? "zenrows" : "firecrawl",
        channel: images && Array.isArray(images) && images.length > 0 ? "image" : "url",
        success: false,
        tokenCharged: true,
        sourceUrl: typeof url === "string" ? url : null,
        errorMessage: message,
      });
    } catch {
      // Si no podemos leer body, igual devolvemos el error original.
    }
    const status = message.includes("429") ? 429 : message.includes("402") ? 402 : 500;
    return new Response(JSON.stringify({ success: false, error: message }), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
