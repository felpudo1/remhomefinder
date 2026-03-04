import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Save, RotateCcw, Info, Loader2 } from "lucide-react";

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

// Claves en la tabla app_settings de Supabase
const SETTINGS_KEYS = {
  user: "scraper_prompt_user",
  agent: "scraper_prompt_agent",
} as const;

interface Props {
  toast: (opts: { title: string; description?: string; variant?: "default" | "destructive" }) => void;
}

/**
 * Sección de administración de Prompts del scraper IA.
 * Maneja dos prompts independientes: uno para usuarios y otro para agentes.
 * Lee y escribe directamente en la tabla app_settings de Supabase.
 */
export function AdminPrompt({ toast }: Props) {
  const [promptUser, setPromptUser] = useState(DEFAULT_PROMPT_USER);
  const [promptAgent, setPromptAgent] = useState(DEFAULT_PROMPT_AGENT);
  const [savedUser, setSavedUser] = useState(true);
  const [savedAgent, setSavedAgent] = useState(true);
  const [loading, setLoading] = useState(true);

  // Cargar prompts desde Supabase al montar el componente
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("key, value")
        .in("key", [SETTINGS_KEYS.user, SETTINGS_KEYS.agent]);

      if (data) {
        for (const row of data) {
          if (row.key === SETTINGS_KEYS.user) setPromptUser(row.value);
          if (row.key === SETTINGS_KEYS.agent) setPromptAgent(row.value);
        }
      }
      setLoading(false);
    };
    load();
  }, []);

  // Guardar prompt en Supabase por tipo
  const handleSave = async (type: "user" | "agent") => {
    const key = SETTINGS_KEYS[type];
    const value = type === "user" ? promptUser : promptAgent;

    const { error } = await supabase
      .from("app_settings")
      .upsert({ key, value, description: `Prompt del scraper para ${type}s` }, { onConflict: "key" });

    if (error) {
      toast({ title: "Error al guardar", description: error.message, variant: "destructive" });
      return;
    }

    if (type === "user") setSavedUser(true);
    else setSavedAgent(true);
    toast({
      title: "Prompt guardado",
      description: `El prompt de ${type === "user" ? "usuarios" : "agentes"} se actualizó correctamente.`,
    });
  };

  // Resetear prompt al valor por defecto
  const handleReset = (type: "user" | "agent") => {
    if (type === "user") { setPromptUser(DEFAULT_PROMPT_USER); setSavedUser(false); }
    else { setPromptAgent(DEFAULT_PROMPT_AGENT); setSavedAgent(false); }
    toast({ title: "Prompt reseteado", description: "Volvió a los valores originales. Guardá para confirmar." });
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
            Son las instrucciones que le damos a la IA para interpretar avisos inmobiliarios.
            El prompt de <strong>usuarios</strong> se usa cuando un usuario agrega una propiedad.
            El de <strong>agentes</strong> cuando una agencia publica desde su panel.
          </p>
        </div>
      </div>

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
