import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Save, RotateCcw, Info, Loader2 } from "lucide-react";

// Prompt base por defecto del sistema (usado como fallback)
const DEFAULT_PROMPT = `Sos un asistente que extrae datos de avisos inmobiliarios de Uruguay y Argentina. 
Analizá el contenido del aviso y extraé los datos de la propiedad.
- Para moneda: usá "UYU" para pesos uruguayos, "ARS" para pesos argentinos, "USD" para dólares. Detectá la moneda según el sitio y el país (ej: mercadolibre.com.uy → UYU, infocasas.com.uy → UYU).
- Para el barrio: extraé el barrio o zona mencionada.
- Para el resumen: hacé un resumen breve de 1-2 oraciones destacando lo más importante del aviso.
- Si un dato no está disponible, dejalo vacío o en 0.`;

interface Props {
    toast: (opts: { title: string; description?: string; variant?: "default" | "destructive" }) => void;
}

/**
 * Sección de administración del Prompt del scraper IA.
 * Lee y escribe directamente en la tabla app_settings de Supabase.
 * La Edge Function scrape-property lee este prompt en cada ejecución.
 */
export function AdminPrompt({ toast }: Props) {
    const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);

    // Cargamos el prompt actual desde Supabase al montar el componente
    useEffect(() => {
        const loadPrompt = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from("app_settings")
                .select("value")
                .eq("key", "scraper_system_prompt")
                .single();

            if (!error && data?.value) {
                setPrompt(data.value);
            }
            setLoading(false);
        };

        loadPrompt();
    }, []);

    // Guardar el prompt en la tabla app_settings de Supabase
    const handleSave = async () => {
        setSaving(true);
        const { error } = await supabase
            .from("app_settings")
            .upsert(
                {
                    key: "scraper_system_prompt",
                    value: prompt,
                    description: "Instrucción del sistema para la IA del scraper de propiedades.",
                    updated_at: new Date().toISOString(),
                },
                { onConflict: "key" }
            );

        if (error) {
            toast({ title: "Error al guardar", description: error.message, variant: "destructive" });
        } else {
            toast({ title: "✅ Prompt guardado", description: "La IA usará este prompt en el próximo scraping." });
            setIsDirty(false);
        }
        setSaving(false);
    };

    const handleReset = async () => {
        setPrompt(DEFAULT_PROMPT);
        setIsDirty(true);
        toast({ title: "Prompt reseteado", description: "Guardá para aplicar los cambios al scraper." });
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setPrompt(e.target.value);
        setIsDirty(true);
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Info Banner */}
            <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl text-sm text-muted-foreground">
                <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                    <p className="font-medium text-foreground mb-1">Prompt conectado a la Edge Function</p>
                    <p>
                        Lo que guardes aquí se usa directamente cuando la IA extrae datos de un aviso. Los cambios
                        toman efecto en el próximo scraping, sin necesidad de redesplegar código.
                    </p>
                </div>
            </div>

            {/* Editor de Prompt */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                        <Bot className="w-4 h-4 text-primary" />
                        System Prompt (activo en producción)
                    </label>
                    {isDirty && (
                        <span className="text-xs text-amber-600 font-medium animate-pulse">Sin guardar</span>
                    )}
                </div>
                <Textarea
                    value={prompt}
                    onChange={handleChange}
                    className="min-h-[280px] font-mono text-xs resize-y rounded-xl leading-relaxed"
                    placeholder="Ingresá el system prompt para la IA del scraper..."
                />
                <p className="text-xs text-muted-foreground">{prompt.length} caracteres</p>
            </div>

            {/* Botones de acción */}
            <div className="flex items-center gap-3">
                <Button onClick={handleSave} className="gap-2" disabled={saving || !isDirty}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? "Guardando..." : isDirty ? "Guardar en Supabase" : "Guardado ✓"}
                </Button>
                <Button variant="outline" onClick={handleReset} className="gap-2" disabled={saving}>
                    <RotateCcw className="w-4 h-4" />
                    Resetear al Original
                </Button>
            </div>
        </div>
    );
}
