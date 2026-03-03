import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Save, RotateCcw, Info } from "lucide-react";

// Prompt base por defecto del sistema
const DEFAULT_PROMPT = `Sos un extractor de avisos inmobiliarios de Uruguay y Argentina. Reglas estrictas:
- MONEDA: Si la URL contiene ".uy" → UYU. Si contiene ".com.ar" o precio en "$" → ARS. "U$S" o "USD" → USD.
- PRECIO: En infocasas/gallito, el precio principal es el alquiler. Extraé también expensas si aparecen.
- BARRIO: Extraé el barrio o zona mencionada. NUNCA pongas la ciudad, solo el barrio.
- AMBIENTES: "monoambiente" = 1, "1 dormitorio" = 2, "2 dormitorios" = 3. (ambientes = dormitorios + 1)
- SUPERFICIE: Extraé los metros cuadrados. Diferenciá entre superficie total y cubierta si aparecen.
- RESUMEN: Hacé un resumen breve de 1-2 oraciones destacando lo más importante del aviso.
- Si un dato no está disponible, dejá el número en 0 o el texto vacío. Never invent data.`;

interface Props {
    toast: (opts: { title: string; description?: string; variant?: "default" | "destructive" }) => void;
}

/**
 * Sección de administración del Prompt del scraper IA.
 * Permite editar el system prompt que usa el modelo para extraer datos.
 */
export function AdminPrompt({ toast }: Props) {
    const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
    const [saved, setSaved] = useState(true);

    const handleSave = async () => {
        // Por ahora guardamos en localStorage (se puede migrar a DB en el futuro)
        localStorage.setItem("admin_scraper_prompt", prompt);
        setSaved(true);
        toast({ title: "Prompt guardado", description: "El nuevo prompt se usará en el próximo scraping." });
    };

    const handleReset = () => {
        setPrompt(DEFAULT_PROMPT);
        setSaved(false);
        toast({ title: "Prompt reseteado", description: "El prompt volvió a los valores originales." });
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setPrompt(e.target.value);
        setSaved(false);
    };

    return (
        <div className="space-y-5">
            {/* Info Banner */}
            <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl text-sm text-muted-foreground">
                <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                    <p className="font-medium text-foreground mb-1">¿Qué es el Prompt del Scraper?</p>
                    <p>Es la instrucción que le damos a la IA para que sepa cómo interpretar los avisos inmobiliarios. Un prompt más preciso genera datos de mejor calidad.</p>
                </div>
            </div>

            {/* Editor de Prompt */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                        <Bot className="w-4 h-4 text-primary" />
                        System Prompt
                    </label>
                    {!saved && (
                        <span className="text-xs text-amber-600 font-medium">Sin guardar</span>
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
                <Button onClick={handleSave} className="gap-2" disabled={saved}>
                    <Save className="w-4 h-4" />
                    {saved ? "Guardado" : "Guardar Prompt"}
                </Button>
                <Button variant="outline" onClick={handleReset} className="gap-2">
                    <RotateCcw className="w-4 h-4" />
                    Resetear al Original
                </Button>
            </div>
        </div>
    );
}
