import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Save, RotateCcw, Info, Loader2, Globe } from "lucide-react";

// Prompts base por defecto: uno para usuarios y otro para agentes
const DEFAULT_PROMPT_USER = `Sos un extractor de avisos inmobiliarios de Uruguay y Argentina. Reglas estrictas:
- TIPO DE OPERACIÓN (PRIORIDAD MÁXIMA): Determiná si el aviso es alquiler o venta.
  → Palabras clave de VENTA: "venta", "en venta", "se vende", "precio de venta", "compra". Retorná listingType: "sale"
  → Palabras clave de ALQUILER: "alquiler", "se alquila", "arriendo", "renta". Retorná listingType: "rent"
  → Ante duda: las ventas tienen precios altos en USD sin cuota mensual; los alquileres tienen precio mensual + gastos comunes.
- MONEDA: URL con ".uy" → UYU. "U$S" o "USD" → USD. "$" sin aclaración → ARS.
- PRECIO: En alquiler extraé precio mensual + gastos comunes/G.C./expensas por separado. En venta, extraé el precio total en priceRent y dejá priceExpenses en 0.
- BARRIO: Solo el barrio o zona. NUNCA la ciudad.
- AMBIENTES: "monoambiente" = 1, "1 dormitorio" = 2, "2 dormitorios" = 3. (ambientes = dormitorios + 1)
- SUPERFICIE: Priorizá metros cubiertos sobre totales si ambos aparecen.
- RESUMEN: 1-2 oraciones. Mencioná siempre si es venta o alquiler.
- Dato no disponible → número 0 o texto vacío. Never invent data.`;

const DEFAULT_PROMPT_AGENT = `Sos un extractor de avisos inmobiliarios profesional para agencias de Uruguay y Argentina. Reglas estrictas:
- MONEDA: Si la URL contiene ".uy" → UYU. Si contiene ".com.ar" o precio en "$" → ARS. "U$S" o "USD" → USD.
- PRECIO: Extraé precio de alquiler/venta y gastos comunes por separado.
- TIPO DE OPERACIÓN: Si el aviso es una venta, retorná listingType: "sale". Si es alquiler, retorná listingType: "rent". Buscá palabras como "venta", "en venta", "se vende", "compra", "sale price" para determinar si es venta.
- BARRIO: Extraé el barrio o zona mencionada. NUNCA pongas la ciudad, solo el barrio.
- AMBIENTES: "monoambiente" = 1, "1 dormitorio" = 2, "2 dormitorios" = 3. (ambientes = dormitorios + 1)
- SUPERFICIE: Extraé los metros cuadrados. Diferenciá entre superficie total y cubierta si aparecen.
- RESUMEN: Hacé un resumen profesional de 2-3 oraciones orientado a la venta/alquiler del inmueble.
- Si un dato no está disponible, dejá el número en 0 o el texto vacío. Never invent data.`;

const DEFAULT_PROMPT_IMAGE = `Sos un asistente que extrae datos de avisos inmobiliarios de Uruguay y Argentina a partir de capturas de pantalla de publicaciones en redes sociales (Instagram, Facebook Marketplace, etc.).
Analizá la imagen y extraé los datos de la propiedad que puedas identificar.
- TIPO DE OPERACIÓN: Determiná si el aviso es de VENTA ("sale") o ALQUILER ("rent"). Buscá palabras clave como "venta", "vendo", "se vende", "USD venta" para sale, o "alquiler", "alquilo", "se alquila", "/mes" para rent.
- MONEDA: Usá "UYU" para pesos uruguayos, "ARS" para pesos argentinos, "USD" para dólares.
- BARRIO: Extraé el barrio o zona mencionada. NUNCA pongas la ciudad.
- AMBIENTES: "monoambiente" = 1, "1 dormitorio" = 2, "2 dormitorios" = 3 (ambientes = dormitorios + 1).
- SUPERFICIE: Priorizá metros cubiertos sobre totales.
- RESUMEN: Hacé un resumen breve de 1-2 oraciones destacando lo más importante del aviso. Mencioná si es venta o alquiler.
- IMPORTANTE: Si un dato no está disponible o no se puede leer claramente en la imagen, dejalo vacío (string vacío) o en 0. No inventes datos.`;

const DEFAULT_PROMPT_IMPORT = `Sos un experto en extracción de fichas inmobiliarias masivas para agencias de Uruguay y Argentina.
Instrucciones estrictas para esta importación por lotes:
- DISPONIBILIDAD (CRÍTICO): Si detectás que la propiedad ya no está disponible (ej: el sitio dice "vivienda ya vendida", "propiedad reservada", "señalada" o mensajes de error como "Ups, la propiedad ya fue señalada" comunes en ACSA), debés retornar isUnavailable: true.
- CALIDAD TOTAL: Extraé todos los detalles técnicos posibles de este aviso si está disponible.
- TIPO DE OPERACIÓN: Clasificá con precisión entre "sale" (venta) o "rent" (alquiler). Es CRÍTICO para el marketplace.
- PRECIO Y MONEDA: Extraé el precio principal y los gastos comunes por separado. Detectá la moneda (USD, UYU o ARS).
- BARRIO Y UBICACIÓN: Extraé solo el barrio o zona (ej: Pocitos, Palermo, Nordelta). NUNCA repitas la ciudad en el campo barrio.
- AMBIENTES: Traducí a ambientes totales ( dormitorios + 1 ). Monoambiente = 1.
- DATOS DE CONTACTO: Buscá nombres de agentes o inmobiliarias y teléfonos de contacto en el texto.
- RESUMEN: Hacé un resumen comercial atractivo de 2 oraciones.
- Si un dato no existe, devolvé "" o 0. No inventes información.`;

const DEFAULT_UNAVAILABLE_TOKENS = "ya fue señalada, Ups!, propiedad ya fue, no disponible, señalada, reservada";
const DEFAULT_EXCLUDE_URLS = "/propiedad/nada, /propiedad/alq, /propiedad/ven, /login, /registro, /mi-cuenta";

// Claves en la tabla app_settings de Supabase
const SETTINGS_KEYS = {
  user: "scraper_prompt_user",
  agent: "scraper_prompt_agent",
  image: "image_extract_prompt_user",
  import: "scraper_prompt_import",
  tokens: "scraper_unavailable_tokens",
  excludeUrls: "scraper_exclude_urls",
} as const;

interface Props {
  toast: (opts: { title: string; description?: string; variant?: "default" | "destructive" }) => void;
}

/**
 * Sección de administración de Prompts del scraper IA.
 * Maneja cuatro prompts independientes: usuario, agente, rrss e importación masiva.
 * Lee y escribe directamente en la tabla app_settings de Supabase.
 */
export function AdminPrompt({ toast }: Props) {
  const [promptUser, setPromptUser] = useState(DEFAULT_PROMPT_USER);
  const [promptAgent, setPromptAgent] = useState(DEFAULT_PROMPT_AGENT);
  const [promptImage, setPromptImage] = useState(DEFAULT_PROMPT_IMAGE);
  const [promptImport, setPromptImport] = useState(DEFAULT_PROMPT_IMPORT);
  const [tokens, setTokens] = useState(DEFAULT_UNAVAILABLE_TOKENS);
  const [excludeUrls, setExcludeUrls] = useState(DEFAULT_EXCLUDE_URLS);
  const [savedUser, setSavedUser] = useState(true);
  const [savedAgent, setSavedAgent] = useState(true);
  const [savedImage, setSavedImage] = useState(true);
  const [savedImport, setSavedImport] = useState(true);
  const [savedTokens, setSavedTokens] = useState(true);
  const [savedExclude, setSavedExclude] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("key, value")
        .in("key", [
          SETTINGS_KEYS.user, 
          SETTINGS_KEYS.agent, 
          SETTINGS_KEYS.image, 
          SETTINGS_KEYS.import,
          SETTINGS_KEYS.tokens,
          SETTINGS_KEYS.excludeUrls
        ]);

      if (data) {
        for (const row of data) {
          if (row.key === SETTINGS_KEYS.user) setPromptUser(row.value);
          if (row.key === SETTINGS_KEYS.agent) setPromptAgent(row.value);
          if (row.key === SETTINGS_KEYS.image) setPromptImage(row.value);
          if (row.key === SETTINGS_KEYS.import) setPromptImport(row.value);
          if (row.key === SETTINGS_KEYS.tokens) setTokens(row.value);
          if (row.key === SETTINGS_KEYS.excludeUrls) setExcludeUrls(row.value);
        }
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async (type: "user" | "agent" | "image" | "import" | "tokens" | "excludeUrls") => {
    const key = SETTINGS_KEYS[type];
    const value = 
      type === "user" ? promptUser : 
      type === "agent" ? promptAgent : 
      type === "image" ? promptImage : 
      type === "import" ? promptImport :
      type === "tokens" ? tokens :
      excludeUrls;
    
    const labels = { 
      user: "usuarios", 
      agent: "agentes", 
      image: "extracción de imágenes",
      import: "importación masiva",
      tokens: "filtros de descarte",
      excludeUrls: "filtros de URL"
    };

    const { error } = await supabase
      .from("app_settings")
      .upsert({ key, value, description: `Prompt para ${labels[type]}` }, { onConflict: "key" });

    if (error) {
      toast({ title: "Error al guardar", description: error.message, variant: "destructive" });
      return;
    }

    if (type === "user") setSavedUser(true);
    else if (type === "agent") setSavedAgent(true);
    else if (type === "image") setSavedImage(true);
    else if (type === "import") setSavedImport(true);
    else if (type === "tokens") setSavedTokens(true);
    else setSavedExclude(true);

    toast({
      title: "Configuración guardada",
      description: `El valor de ${labels[type]} se actualizó correctamente.`,
    });
  };

  const handleReset = (type: "user" | "agent" | "image" | "import" | "tokens" | "excludeUrls") => {
    if (type === "user") { setPromptUser(DEFAULT_PROMPT_USER); setSavedUser(false); }
    else if (type === "agent") { setPromptAgent(DEFAULT_PROMPT_AGENT); setSavedAgent(false); }
    else if (type === "image") { setPromptImage(DEFAULT_PROMPT_IMAGE); setSavedImage(false); }
    else if (type === "import") { setPromptImport(DEFAULT_PROMPT_IMPORT); setSavedImport(false); }
    else if (type === "tokens") { setTokens(DEFAULT_UNAVAILABLE_TOKENS); setSavedTokens(false); }
    else { setExcludeUrls(DEFAULT_EXCLUDE_URLS); setSavedExclude(false); }
    toast({ title: "Reset completado", description: "Volvió a los valores originales. Guardá para confirmar." });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl text-sm text-muted-foreground">
        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-foreground mb-1">¿Qué son los Prompts del Scraper?</p>
          <p>
            Son las instrucciones que le damos a la IA para interpretar avisos inmobiliarios en distintos contextos.
            Modificalos para ajustar qué datos extrae el sistema y cómo los presenta.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Editor de Prompt para Usuarios */}
        <PromptEditor
          label="Prompt Usuarios"
          value={promptUser}
          saved={savedUser}
          onChange={(v) => { setPromptUser(v); setSavedUser(false); }}
          onSave={() => handleSave("user")}
          onReset={() => handleReset("user")}
        />

        {/* Editor de Prompt para Agentes */}
        <PromptEditor
          label="Prompt Agentes"
          value={promptAgent}
          saved={savedAgent}
          onChange={(v) => { setPromptAgent(v); setSavedAgent(false); }}
          onSave={() => handleSave("agent")}
          onReset={() => handleReset("agent")}
        />

        {/* Editor de Prompt para Extracción de Imágenes */}
        <PromptEditor
          label="Prompt Extracción Imágenes (RRSS)"
          value={promptImage}
          saved={savedImage}
          onChange={(v) => { setPromptImage(v); setSavedImage(false); }}
          onSave={() => handleSave("image")}
          onReset={() => handleReset("image")}
        />

        {/* Editor de Prompt para Importación Masiva */}
        <PromptEditor
          label="Prompt Importación Masiva"
          value={promptImport}
          saved={savedImport}
          onChange={(v) => { setPromptImport(v); setSavedImport(false); }}
          onSave={() => handleSave("import")}
          onReset={() => handleReset("import")}
        />
      </div>

      {/* SECCIÓN SEPARADA: FILTROS DE IMPORTACIÓN */}
      <div className="pt-6 border-t space-y-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary" />
          Filtros de Importación Pro
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* FILTRO DE DESCARTE (No Disponible) */}
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Bot className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <h3 className="font-semibold text-lg text-amber-900 dark:text-amber-100">Filtro de Descarte Automático</h3>
            </div>
            <p className="text-sm text-amber-800/80 dark:text-amber-200/60 mb-4 leading-relaxed">
              Palabras que cancelan la importación (ej: ya fue señalada, Ups!). 
              <strong> Separá con coma (,).</strong>
            </p>
            <div className="space-y-4">
              <Textarea
                value={tokens}
                onChange={(e) => { setTokens(e.target.value); setSavedTokens(false); }}
                placeholder="ya fue señalada, Ups!, propiedad ya fue"
                className="min-h-[100px] border-amber-200 dark:border-amber-900 bg-background/50 rounded-xl"
              />
              <div className="flex items-center justify-between">
                <Button 
                  onClick={() => handleSave("tokens")} 
                  size="sm" 
                  className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
                  disabled={savedTokens}
                >
                  <Save className="w-4 h-4" />
                  {savedTokens ? "Guardado" : "Guardar Filtros"}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleReset("tokens")} className="text-amber-700 dark:text-amber-400 gap-2">
                  <RotateCcw className="w-4 h-4" />
                  Resetear
                </Button>
              </div>
            </div>
          </div>

          {/* FILTRO DE URLS (Discovery) */}
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-semibold text-lg text-blue-900 dark:text-blue-100">Filtro de URLs Excluidas</h3>
            </div>
            <p className="text-sm text-blue-800/80 dark:text-blue-200/60 mb-4 leading-relaxed">
              Patrones de URL que el sistema ignorará al escanear (ej: /login, /nada). 
              <strong> Separá con coma (,).</strong>
            </p>
            <div className="space-y-4">
              <Textarea
                value={excludeUrls}
                onChange={(e) => { setExcludeUrls(e.target.value); setSavedExclude(false); }}
                placeholder="/propiedad/nada, /login, /registro"
                className="min-h-[100px] border-blue-200 dark:border-blue-900 bg-background/50 rounded-xl"
              />
              <div className="flex items-center justify-between">
                <Button 
                  onClick={() => handleSave("excludeUrls")} 
                  size="sm" 
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                  disabled={savedExclude}
                >
                  <Save className="w-4 h-4" />
                  {savedExclude ? "Guardado" : "Guardar URLs"}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleReset("excludeUrls")} className="text-blue-700 dark:text-blue-400 gap-2">
                  <RotateCcw className="w-4 h-4" />
                  Resetear
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Componente reutilizable para editar un prompt individual.
 * Siguiendo la Regla 2 (Arquitectura Profesional).
 */
function PromptEditor({
  label, value, saved, onChange, onSave, onReset,
}: {
  label: string;
  value: string;
  saved: boolean;
  onChange: (v: string) => void;
  onSave: () => void;
  onReset: () => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground flex items-center gap-2">
          <Bot className="w-4 h-4 text-primary" />
          {label}
        </label>
        {!saved && (
          <span className="text-xs text-amber-600 font-medium">Sin guardar</span>
        )}
      </div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[200px] font-mono text-xs resize-y rounded-xl leading-relaxed"
      />
      <p className="text-xs text-muted-foreground">{value.length} caracteres</p>
      <div className="flex items-center gap-3">
        <Button onClick={onSave} size="sm" className="gap-2" disabled={saved}>
          <Save className="w-4 h-4" />
          {saved ? "Guardado" : "Guardar"}
        </Button>
        <Button variant="outline" size="sm" onClick={onReset} className="gap-2">
          <RotateCcw className="w-4 h-4" />
          Resetear
        </Button>
      </div>
    </div>
  );
}
