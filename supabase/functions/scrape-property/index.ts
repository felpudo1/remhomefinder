import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/** Scrape using Firecrawl — returns { markdown, html, imageUrls } */
async function scrapeWithFirecrawl(formattedUrl: string): Promise<{ markdown: string; html: string; imageUrls: string[] }> {
  const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY") || Deno.env.get("FIRECRAWL_API_KEY_1");
  if (!FIRECRAWL_API_KEY) throw new Error("FIRECRAWL_API_KEY not configured");

  const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: formattedUrl,
      formats: ["markdown", "html"],
      onlyMainContent: true,
      waitFor: 2000,
    }),
  });

  const scrapeData = await scrapeResponse.json();
  if (!scrapeResponse.ok) {
    throw new Error(`Firecrawl: ${scrapeData?.error || "No se pudo acceder a la página"}`);
  }

  const markdown = scrapeData?.data?.markdown || scrapeData?.markdown || "";
  const html = scrapeData?.data?.html || scrapeData?.html || "";
  const allLinks: string[] = scrapeData?.data?.links || scrapeData?.links || [];

  const imageUrls = extractImages(markdown, html, allLinks);
  return { markdown, html, imageUrls };
}

/** Scrape using ZenRows — returns { markdown, html, imageUrls } */
async function scrapeWithZenRows(formattedUrl: string): Promise<{ markdown: string; html: string; imageUrls: string[] }> {
  const ZENROWS_API_KEY = Deno.env.get("ZENROWS_API_KEY");
  if (!ZENROWS_API_KEY) throw new Error("ZENROWS_API_KEY not configured");

  const params = new URLSearchParams({
    url: formattedUrl,
    apikey: ZENROWS_API_KEY,
    js_render: "true",
    premium_proxy: "true",
  });

  const scrapeResponse = await fetch(`https://api.zenrows.com/v1/?${params.toString()}`);

  if (!scrapeResponse.ok) {
    const errText = await scrapeResponse.text();
    console.error("ZenRows error:", scrapeResponse.status, errText);
    let detail = "";
    try {
      const errJson = JSON.parse(errText);
      detail = errJson.title || errJson.detail || errText;
    } catch {
      detail = errText;
    }
    if (scrapeResponse.status === 400) {
      throw new Error(`ZenRows: Este sitio no es compatible para scraping. Probá con el otro botón (Firecrawl) o ingresá los datos manualmente. (${detail})`);
    }
    throw new Error(`ZenRows: No se pudo acceder a la página (${scrapeResponse.status}) - ${detail}`);
  }

  const html = await scrapeResponse.text();

  // Convert HTML to a simple markdown-like text for AI processing
  // Remove scripts, styles, and extract text content
  const cleanHtml = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const imageUrls = extractImages("", html, []);
  return { markdown: cleanHtml, html, imageUrls };
}

/** Extract image URLs from multiple sources */
function extractImages(markdown: string, html: string, allLinks: string[]): string[] {
  const imageExtensions = /\.(jpg|jpeg|png|webp|avif)(\?|$)/i;
  const excludeExtensions = /\.(svg|gif|ico)(\?|$)/i;
  const imageSet = new Set<string>();

  // Source 1: links array
  allLinks
    .filter((link: string) => imageExtensions.test(link))
    .forEach((link: string) => imageSet.add(link));

  // Source 2: markdown ![alt](url) patterns
  const mdImageRegex = /!\[.*?\]\((https?:\/\/[^\s)]+)\)/g;
  let match;
  while ((match = mdImageRegex.exec(markdown)) !== null) {
    imageSet.add(match[1]);
  }

  // Source 3: HTML <img src="..."> and data-src patterns
  const imgSrcRegex = /(?:src|data-src|data-lazy-src)=["'](https?:\/\/[^"']+)/gi;
  while ((match = imgSrcRegex.exec(html)) !== null) {
    imageSet.add(match[1]);
  }

  // Source 4: og:image and meta image tags
  const ogImageRegex = /(?:property|name)=["']og:image["']\s+content=["'](https?:\/\/[^"']+)/gi;
  while ((match = ogImageRegex.exec(html)) !== null) {
    imageSet.add(match[1]);
  }

  // Filter out icons, logos, tiny images
  return Array.from(imageSet)
    .filter((url) => {
      if (excludeExtensions.test(url)) return false;
      if (!imageExtensions.test(url)) return false;
      const isIcon = /(icon|logo|avatar|favicon|sprite|badge|button|arrow|chevron|pixel|tracking|analytics|agency|assets\/vectorial)/i.test(url);
      const isTiny = /(16x|32x|48x|64x|1x1|2x2|1\.gif|blank\.)/i.test(url);
      return !isIcon && !isTiny;
    })
    .slice(0, 15);
}

/** Extract structured data using AI */
async function extractWithAI(markdown: string): Promise<Record<string, any>> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

  const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        {
          role: "system",
          content: `Sos un asistente que extrae datos de avisos inmobiliarios de Uruguay y Argentina. 
Analizá el contenido del aviso y extraé los datos de la propiedad.
- Para moneda: usá "UYU" para pesos uruguayos, "ARS" para pesos argentinos, "USD" para dólares. Detectá la moneda según el sitio y el país (ej: mercadolibre.com.uy → UYU, infocasas.com.uy → UYU).
- Para el barrio: extraé el barrio o zona mencionada.
- Para el resumen: hacé un resumen breve de 1-2 oraciones destacando lo más importante del aviso.
- Si un dato no está disponible, dejalo vacío o en 0.`,
        },
        {
          role: "user",
          content: `Extraé los datos de este aviso inmobiliario:\n\n${markdown.slice(0, 8000)}`,
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "extract_property_data",
            description: "Extract structured property data from a real estate listing",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string", description: "Título descriptivo de la propiedad" },
                priceRent: { type: "number", description: "Precio de alquiler mensual" },
                priceExpenses: { type: "number", description: "Expensas mensuales" },
                currency: { type: "string", description: "Moneda: USD, UYU o ARS" },
                neighborhood: { type: "string", description: "Barrio o zona" },
                sqMeters: { type: "number", description: "Superficie en metros cuadrados" },
                rooms: { type: "number", description: "Cantidad de ambientes" },
                aiSummary: { type: "string", description: "Resumen breve del aviso" },
              },
              required: ["title", "neighborhood", "aiSummary"],
              additionalProperties: false,
            },
          },
        },
      ],
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
  if (!toolCall?.function?.arguments) {
    throw new Error("La IA no pudo extraer los datos del aviso");
  }

  return JSON.parse(toolCall.function.arguments);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, scraper = "firecrawl" } = await req.json();
    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log(`Scraping URL with ${scraper}:`, formattedUrl);

    // Detect unsupported sites (Facebook, Marketplace, Instagram, etc.)
    const unsupportedDomains = ["facebook.com", "fb.com", "instagram.com", "tiktok.com"];
    const urlLower = formattedUrl.toLowerCase();
    const isUnsupported = unsupportedDomains.some(d => urlLower.includes(d));
    if (isUnsupported) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "MARKETPLACE_MANUAL",
          message: "Facebook Marketplace y redes sociales no permiten scraping automático. Revisá la publicación y completá los datos manualmente.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 1: Scrape
    let markdown: string;
    let imageUrls: string[];

    if (scraper === "zenrows") {
      const result = await scrapeWithZenRows(formattedUrl);
      markdown = result.markdown;
      imageUrls = result.imageUrls;
    } else {
      const result = await scrapeWithFirecrawl(formattedUrl);
      markdown = result.markdown;
      imageUrls = result.imageUrls;
    }

    console.log(`Found ${imageUrls.length} property images`);

    if (!markdown) {
      return new Response(
        JSON.stringify({ success: false, error: "No se encontró contenido en la página" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Scraped content length:", markdown.length);

    // Step 2: Extract with AI
    const extracted = await extractWithAI(markdown);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          title: extracted.title || "",
          priceRent: extracted.priceRent || 0,
          priceExpenses: extracted.priceExpenses || 0,
          currency: extracted.currency || "ARS",
          neighborhood: extracted.neighborhood || "",
          sqMeters: extracted.sqMeters || 0,
          rooms: extracted.rooms || 1,
          aiSummary: extracted.aiSummary || "",
          images: imageUrls,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("scrape-property error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    const status = message.includes("429") ? 429 : message.includes("402") ? 402 : 500;
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
