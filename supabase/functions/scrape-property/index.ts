import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "FIRECRAWL_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "LOVABLE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 1: Scrape the URL with Firecrawl
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log("Scraping URL:", formattedUrl);

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
        waitFor: 2000, // Dar tiempo a Gallito para renderizar los precios y datos dinámicos
      }),
    });

    const scrapeData = await scrapeResponse.json();

    if (!scrapeResponse.ok) {
      console.error("Firecrawl error:", scrapeData);
      const firecrawlError = scrapeData?.error || "No se pudo acceder a la página";
      return new Response(
        JSON.stringify({ success: false, error: `Firecrawl: ${firecrawlError}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const markdown = scrapeData?.data?.markdown || scrapeData?.markdown || "";
    const html = scrapeData?.data?.html || scrapeData?.html || "";
    const allLinks: string[] = scrapeData?.data?.links || scrapeData?.links || [];

    // Extract image URLs from multiple sources
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
    const imageUrls = Array.from(imageSet)
      .filter((url) => {
        // Must be a real image format (no SVGs, GIFs, ICOs)
        if (excludeExtensions.test(url)) return false;
        if (!imageExtensions.test(url)) return false;
        const isIcon = /(icon|logo|avatar|favicon|sprite|badge|button|arrow|chevron|pixel|tracking|analytics|agency|assets\/vectorial)/i.test(url);
        const isTiny = /(16x|32x|48x|64x|1x1|2x2|1\.gif|blank\.)/i.test(url);
        return !isIcon && !isTiny;
      })
      .slice(0, 15);

    console.log(`Found ${imageUrls.length} property images from ${imageSet.size} candidates`);

    if (!markdown) {
      return new Response(
        JSON.stringify({ success: false, error: "No se encontró contenido en la página" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Scraped content length:", markdown.length);

    // Step 2: Extract structured data with Lovable AI using tool calling
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-1.5-flash",
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
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);

      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: "Demasiadas solicitudes. Intentá de nuevo en unos segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: "Créditos de IA agotados." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: false, error: "Error al procesar con IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    console.log("AI response:", JSON.stringify(aiData));

    // Extract tool call arguments
    const toolCall = aiData?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      return new Response(
        JSON.stringify({ success: false, error: "La IA no pudo extraer los datos del aviso" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const extracted = JSON.parse(toolCall.function.arguments);

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
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
