import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function getImagePromptFromDb(): Promise<string | null> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const sb = createClient(supabaseUrl, serviceKey);

  const { data } = await sb.from("app_settings").select("value").eq("key", "image_extract_prompt_user").maybeSingle();
  return data?.value || null;
}

const FALLBACK_PROMPT = `Sos un asistente que extrae datos de avisos inmobiliarios de Uruguay y Argentina a partir de capturas de pantalla de publicaciones en redes sociales (Instagram, Facebook Marketplace, etc.).
Analizá la(s) imagen(es) y extraé los datos de la propiedad que puedas identificar.
- Para listingType: determiná si el aviso es de VENTA ("sale") o ALQUILER ("rent"). Buscá palabras clave como "venta", "vendo", "se vende", "USD venta" para sale, o "alquiler", "alquilo", "se alquila", "/mes" para rent.
- Para moneda: usá "UYU" para pesos uruguayos, "ARS" para pesos argentinos, "USD" para dólares.
- Para el barrio: extraé el barrio o zona mencionada.
- Para el resumen: hacé un resumen breve de 1-2 oraciones destacando lo más importante del aviso.
- IMPORTANTE: Si un dato no está disponible o no se puede leer claramente en la imagen, dejalo vacío (string vacío) o en 0. No inventes datos.`;

const toolSchema = {
  type: "function" as const,
  function: {
    name: "extract_property_data",
    description: "Extract structured property data from a real estate listing screenshot",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Título descriptivo de la propiedad" },
        listingType: { type: "string", enum: ["sale", "rent"], description: "Tipo de operación: 'sale' para venta, 'rent' para alquiler" },
        priceRent: { type: "number", description: "Precio de alquiler mensual (o precio total de venta si listingType es sale). 0 si no se detecta." },
        priceExpenses: { type: "number", description: "Gastos comunes/expensas mensuales. 0 si no se detecta." },
        currency: { type: "string", description: "Moneda: USD, UYU o ARS" },
        neighborhood: { type: "string", description: "Barrio o zona. Vacío si no se detecta." },
        sqMeters: { type: "number", description: "Superficie en metros cuadrados. 0 si no se detecta." },
        rooms: { type: "number", description: "Cantidad de ambientes/dormitorios. 0 si no se detecta." },
        aiSummary: { type: "string", description: "Resumen breve del aviso con lo que se pudo identificar" },
        ref: { type: "string", description: "Código de referencia del aviso si existe (ej: REF-123, ID del aviso). Vacío si no se detecta." },
        details: { type: "string", description: "Detalles adicionales del aviso: características, amenities, descripción extendida. Vacío si no se detecta." },
      },
      required: ["title", "listingType", "aiSummary"],
      additionalProperties: false,
    },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Acepta imageUrl (string) o imageUrls (string[])
    const body = await req.json();
    const { role = "user" } = body;

    // Normalizar a array de URLs
    let urls: string[] = [];
    if (body.imageUrls && Array.isArray(body.imageUrls)) {
      urls = body.imageUrls.slice(0, 3);
    } else if (body.imageUrl) {
      urls = [body.imageUrl];
    }

    if (urls.length === 0) {
      return new Response(JSON.stringify({ success: false, error: "imageUrl o imageUrls es requerido" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Extracting property data from ${urls.length} image(s) (role: ${role}):`, urls);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const dbPrompt = await getImagePromptFromDb();
    const systemPrompt = dbPrompt || FALLBACK_PROMPT;

    // Construir contenido multimodal con todas las imágenes
    const imageContent = urls.map((url) => ({
      type: "image_url" as const,
      image_url: { url },
    }));

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: "Extraé los datos de esta(s) captura(s) de pantalla de un aviso inmobiliario publicado en redes sociales:" },
              ...imageContent,
            ],
          },
        ],
        tools: [toolSchema],
        tool_choice: { type: "function", function: { name: "extract_property_data" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ success: false, error: "Demasiadas solicitudes. Intentá de nuevo en unos segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ success: false, error: "Créditos de IA agotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", status, errText);
      throw new Error("Error al procesar la imagen con IA");
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      throw new Error("La IA no pudo extraer datos de la imagen");
    }

    const extracted = JSON.parse(toolCall.function.arguments);
    console.log("Extracted data:", extracted);

    return new Response(JSON.stringify({
      success: true,
      data: {
        title: extracted.title || "",
        listingType: extracted.listingType || "rent",
        priceRent: extracted.priceRent || 0,
        priceExpenses: extracted.priceExpenses || 0,
        currency: extracted.currency || "USD",
        neighborhood: extracted.neighborhood || "",
        sqMeters: extracted.sqMeters || 0,
        rooms: extracted.rooms || 0,
        aiSummary: extracted.aiSummary || "",
        images: [],
      },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("extract-from-image error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
