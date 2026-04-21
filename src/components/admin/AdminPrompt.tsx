import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Save, RotateCcw, Info, Loader2, Globe, Sparkles, MessageSquareCode, FileCode } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminScrapingProfiles } from "./AdminScrapingProfiles";

// Prompts base por defecto
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

const DEFAULT_PROMPT_SENTIMENT_ANALYSIS = `Sos un analista de leads inmobiliarios. Recibís ratings (1-5 estrellas) de un usuario sobre una propiedad, según su estado actual en el embudo: Contactado, Visita Coordinada, Firme Candidato, Posible Interés, Descartado o Meta Conseguida.

Tu tarea:
1) RESUMEN HUMANO: Generá un resumen narrativo de MÁXIMO 15 PALABRAS, en tono natural y accionable para el agente (ej: "Usuario muy interesado, le urge la mudanza y el precio le cuadra").
2) MATCH %: Calculá un porcentaje de match (0-100) ponderando los ratings críticos del estado.

Diferenciación por estado (CRÍTICO):
- DESCARTADO: Buscá los bloqueadores (precio excesivo, fotos irreales, ubicación, humedad). Resumen orientado a "por qué no funcionó".
- POSIBLE INTERÉS: Lead tibio. Destacar qué falta para escalar (precio, info, visita).
- FIRME CANDIDATO: Hot lead. Resaltar alta intención y factores ganadores.
- CONTACTADO: Resaltar urgencia y adecuación inicial (capacidad, timing).
- VISITA COORDINADA: Resaltar nivel de compromiso y expectativa.
- META CONSEGUIDA: Resaltar el factor decisivo del cierre.

Devolvé SIEMPRE JSON válido: { "summary": "...", "match_percent": 0-100 }`;

const SETTINGS_KEYS = {
  user: "scraper_prompt_user",
  agent: "scraper_prompt_agent",
  image: "image_extract_prompt_user",
  import: "scraper_prompt_import",
  sentiment: "agent_sentiment_prompt",
  tokens: "scraper_unavailable_tokens",
  excludeUrls: "scraper_exclude_urls",
  forbiddenExtensions: "scraper_forbidden_extensions",
} as const;

interface Props {
  toast: (opts: { title: string; description?: string; variant?: "default" | "destructive" }) => void;
}

export function AdminPrompt({ toast }: Props) {
  const [promptUser, setPromptUser] = useState(DEFAULT_PROMPT_USER);
  const [promptAgent, setPromptAgent] = useState(DEFAULT_PROMPT_AGENT);
  const [promptImage, setPromptImage] = useState(DEFAULT_PROMPT_IMAGE);
  const [promptImport, setPromptImport] = useState(DEFAULT_PROMPT_IMPORT);
  const [promptSentiment, setPromptSentiment] = useState(DEFAULT_PROMPT_SENTIMENT_ANALYSIS);
  const [forbiddenExtensions, setForbiddenExtensions] = useState(".pdf, .jpg, .png, .jpeg, .docx, .xml");
  const [tokens, setTokens] = useState(DEFAULT_UNAVAILABLE_TOKENS);
  const [excludeUrls, setExcludeUrls] = useState(DEFAULT_EXCLUDE_URLS);
  
  const [savedStatus, setSavedStatus] = useState<Record<string, boolean>>({
    user: true, agent: true, image: true, import: true, sentiment: true, tokens: true, excludeUrls: true, forbiddenExtensions: true
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from("app_settings")
          .select("key, value")
          .in("key", Object.values(SETTINGS_KEYS));

        if (error) throw error;

        if (data) {
          data.forEach(row => {
            if (row.key === SETTINGS_KEYS.user) setPromptUser(row.value);
            if (row.key === SETTINGS_KEYS.agent) setPromptAgent(row.value);
            if (row.key === SETTINGS_KEYS.image) setPromptImage(row.value);
            if (row.key === SETTINGS_KEYS.import) setPromptImport(row.value);
            if (row.key === SETTINGS_KEYS.sentiment) setPromptSentiment(row.value);
            if (row.key === SETTINGS_KEYS.tokens) setTokens(row.value);
            if (row.key === SETTINGS_KEYS.excludeUrls) setExcludeUrls(row.value);
            if (row.key === SETTINGS_KEYS.forbiddenExtensions) setForbiddenExtensions(row.value);
          });
        }
      } catch (err) {
        console.error("Error loading settings:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async (type: keyof typeof SETTINGS_KEYS) => {
    const key = SETTINGS_KEYS[type];
    const value = 
      type === "user" ? promptUser : 
      type === "agent" ? promptAgent : 
      type === "image" ? promptImage : 
      type === "import" ? promptImport :
      type === "sentiment" ? promptSentiment :
      type === "tokens" ? tokens :
      type === "excludeUrls" ? excludeUrls :
      forbiddenExtensions;

    const { error } = await supabase
      .from("app_settings")
      .upsert({ key, value }, { onConflict: "key" });

    if (error) {
      toast({ title: "Error al guardar", description: error.message, variant: "destructive" });
    } else {
      setSavedStatus(prev => ({ ...prev, [type]: true }));
      toast({ title: "Configuración guardada 💎" });
    }
  };

  const handleReset = (type: keyof typeof SETTINGS_KEYS) => {
    if (type === "user") setPromptUser(DEFAULT_PROMPT_USER);
    if (type === "agent") setPromptAgent(DEFAULT_PROMPT_AGENT);
    if (type === "image") setPromptImage(DEFAULT_PROMPT_IMAGE);
    if (type === "import") setPromptImport(DEFAULT_PROMPT_IMPORT);
    if (type === "sentiment") setPromptSentiment(DEFAULT_PROMPT_SENTIMENT_ANALYSIS);
    if (type === "tokens") setTokens(DEFAULT_UNAVAILABLE_TOKENS);
    if (type === "excludeUrls") setExcludeUrls(DEFAULT_EXCLUDE_URLS);
    if (type === "forbiddenExtensions") setForbiddenExtensions(".pdf, .jpg, .png, .jpeg, .docx, .xml");
    setSavedStatus(prev => ({ ...prev, [type]: false }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Inteligencia de Datos & Scraping</h2>
          <p className="text-muted-foreground italic text-sm">Gestioná los prompts globales y las reglas específicas por inmobiliaria.</p>
        </div>
      </div>

      <Tabs defaultValue="prompts" className="w-full">
        <TabsList className="bg-slate-900 border-2 border-slate-700 mb-6 p-1 h-12">
          <TabsTrigger 
            value="prompts" 
            className="gap-2 px-6 py-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-slate-300 font-bold transition-all"
          >
            <MessageSquareCode className="w-4 h-4" />
            Prompts Globales
          </TabsTrigger>
          <TabsTrigger 
            value="profiles" 
            className="gap-2 px-6 py-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-slate-300 font-bold transition-all"
          >
            <Sparkles className="w-4 h-4" />
            Perfiles Agencias Pro
          </TabsTrigger>
        </TabsList>

        <TabsContent value="prompts" className="space-y-8 animate-in slide-in-from-left-2 duration-300">
          <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl text-sm text-muted-foreground">
            <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground mb-1">¿Qué son los Prompts del Scraper?</p>
              <p>Son las instrucciones que le damos a la IA para interpretar avisos inmobiliarios en distintos contextos.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PromptCard 
              title="Prompt para Usuarios" 
              value={promptUser} 
              onValueChange={(v) => { setPromptUser(v); setSavedStatus(prev => ({ ...prev, user: false })); }}
              onSave={() => handleSave("user")}
              onReset={() => handleReset("user")}
              saved={savedStatus.user}
              description="Extracción desde RRSS para usuarios finales"
            />
            <PromptCard 
              title="Prompt para Agentes" 
              value={promptAgent} 
              onValueChange={(v) => { setPromptAgent(v); setSavedStatus(prev => ({ ...prev, agent: false })); }}
              onSave={() => handleSave("agent")}
              onReset={() => handleReset("agent")}
              saved={savedStatus.agent}
              description="Extracción desde Marketplace para el CRM"
            />
            <PromptCard 
              title="Prompt para Imágenes" 
              value={promptImage} 
              onValueChange={(v) => { setPromptImage(v); setSavedStatus(prev => ({ ...prev, image: false })); }}
              onSave={() => handleSave("image")}
              onReset={() => handleReset("image")}
              saved={savedStatus.image}
              description="Análisis de capturas de pantalla (OCR + AI)"
            />
            <PromptCard 
              title="Prompt para Importación Masiva" 
              value={promptImport} 
              onValueChange={(v) => { setPromptImport(v); setSavedStatus(prev => ({ ...prev, import: false })); }}
              onSave={() => handleSave("import")}
              onReset={() => handleReset("import")}
              saved={savedStatus.import}
              description="Extractor especializado para barrido de agencias"
            />

            <div className="bg-card border border-border/50 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <Bot className="w-5 h-5" />
                <h3 className="font-bold">Tokens de Descarte</h3>
              </div>
              <Textarea 
                value={tokens}
                onChange={(e) => { setTokens(e.target.value); setSavedStatus(prev => ({ ...prev, tokens: false })); }}
                className="min-h-[100px] bg-muted/30 border-primary/10 rounded-xl text-xs"
              />
              <Button onClick={() => handleSave("tokens")} size="sm" className="w-full gap-2 rounded-lg" disabled={savedStatus.tokens}>
                <Save className="w-4 h-4" />
                {savedStatus.tokens ? "Guardado" : "Guardar Tokens"}
              </Button>
            </div>

            <div className="bg-card border border-border/50 rounded-2xl p-6 space-y-4 transition-all hover:border-primary/30">
              <div className="flex items-center gap-2 text-primary">
                <Globe className="w-5 h-5" />
                <h3 className="font-bold">Filtro Global URLs</h3>
              </div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Ej: /login, /registro, /mi-cuenta</p>
              <Textarea 
                value={excludeUrls}
                onChange={(e) => { setExcludeUrls(e.target.value); setSavedStatus(prev => ({ ...prev, excludeUrls: false })); }}
                className="min-h-[100px] bg-muted/30 border-primary/10 rounded-xl text-xs"
              />
              <Button onClick={() => handleSave("excludeUrls")} size="sm" className="w-full gap-2 rounded-lg" disabled={savedStatus.excludeUrls}>
                <Save className="w-4 h-4" />
                {savedStatus.excludeUrls ? "Guardado" : "Guardar Filtros"}
              </Button>
            </div>

            <div className="bg-card border border-border/50 rounded-2xl p-6 space-y-4 transition-all hover:border-primary/30">
              <div className="flex items-center gap-2 text-primary">
                <FileCode className="w-5 h-5" />
                <h3 className="font-bold">Extensiones Prohibidas Globales</h3>
              </div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Ej: .pdf, .jpg, .xml, .docx</p>
              <Textarea 
                value={forbiddenExtensions}
                onChange={(e) => { setForbiddenExtensions(e.target.value); setSavedStatus(prev => ({ ...prev, forbiddenExtensions: false })); }}
                className="min-h-[100px] bg-muted/30 border-primary/10 rounded-xl text-xs"
              />
              <Button onClick={() => handleSave("forbiddenExtensions")} size="sm" className="w-full gap-2 rounded-lg" disabled={savedStatus.forbiddenExtensions}>
                <Save className="w-4 h-4" />
                {savedStatus.forbiddenExtensions ? "Guardado" : "Guardar Extensiones"}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="profiles" className="animate-in slide-in-from-right-2 duration-300">
          <AdminScrapingProfiles />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface PromptCardProps {
  title: string;
  value: string;
  onValueChange: (v: string) => void;
  onSave: () => void;
  onReset: () => void;
  saved: boolean;
  description: string;
}

function PromptCard({ title, value, onValueChange, onSave, onReset, saved, description }: PromptCardProps) {
  return (
    <div className="bg-card border border-border/50 rounded-2xl p-6 space-y-4 flex flex-col transition-all hover:border-primary/30 group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-primary">
          <Bot className="w-5 h-5" />
          <h3 className="font-bold">{title}</h3>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{description}</p>
      <Textarea 
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className="flex-grow min-h-[200px] bg-muted/30 border-primary/10 rounded-xl text-xs"
      />
      <div className="flex items-center gap-3 pt-2">
        <Button onClick={onSave} size="sm" className="flex-1 gap-2 rounded-lg" disabled={saved}>
          <Save className="w-4 h-4" />
          {saved ? "Guardado" : "Guardar"}
        </Button>
        <Button variant="outline" size="sm" onClick={onReset} className="gap-2 rounded-lg">
          <RotateCcw className="w-4 h-4" />
          Reset
        </Button>
      </div>
    </div>
  );
}
