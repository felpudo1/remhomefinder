import { ADD_BUTTON_CONFIG_KEY, ADD_BUTTON_DEFAULT } from "@/lib/config-keys";
import { AddButtonConfig } from "@/types/property";
import { useToast } from "@/hooks/use-toast";
import { useSystemConfig } from "@/hooks/useSystemConfig";
import { Settings, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Componente para personalizar la visualización de los botones de agregar propiedad (+).
 * Extraído de AdminSystem para mejor mantenibilidad (REGLA 2).
 */
export const AdminButtons = () => {
    const { toast } = useToast();
    const { value, isLoading, setValue, isSaving } = useSystemConfig(
        ADD_BUTTON_CONFIG_KEY,
        ADD_BUTTON_DEFAULT
    );

    const selected = (value as AddButtonConfig) || ADD_BUTTON_DEFAULT;

    const handleSelect = async (newValue: AddButtonConfig) => {
        try {
            await setValue(newValue);
            toast({ title: "Configuración guardada", description: "El cambio se aplicará a todos los usuarios." });
        } catch (error: any) {
            console.error("Error al guardar ADD_BUTTON:", error);
            toast({ title: "Error al guardar", description: error.message, variant: "destructive" });
        }
    };

    const options: { value: AddButtonConfig; label: string; description: string; preview: React.ReactNode }[] = [
        {
            value: "blue",
            label: "Solo botón azul (Firecrawl)",
            description: "El usuario solo ve el botón principal azul para agregar propiedades",
            preview: (
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow text-primary-foreground font-bold text-lg">+</div>
            ),
        },
        {
            value: "white",
            label: "Solo botón blanco (ZenRows)",
            description: "El usuario solo ve el botón blanco secundario para agregar propiedades",
            preview: (
                <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center shadow font-bold text-lg text-foreground">+</div>
            ),
        },
        {
            value: "both",
            label: "Ambos botones",
            description: "El usuario ve el + azul (Firecrawl) y el + blanco (ZenRows)",
            preview: (
                <div className="flex gap-2">
                    <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow text-primary-foreground font-bold text-lg">+</div>
                    <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center shadow font-bold text-lg text-foreground">+</div>
                </div>
            ),
        },
        {
            value: "none",
            label: "Ocultar ambos botones",
            description: "Los usuarios no pueden agregar propiedades manualmente",
            preview: (
                <div className="w-10 h-10 rounded-xl bg-muted/60 border border-dashed border-border flex items-center justify-center text-muted-foreground font-bold text-lg opacity-40">+</div>
            ),
        },
    ];

    return (
        <div className="space-y-3 pt-4 border-t border-border">
            <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider text-[11px]">Personalización de Botones de Agregado</h3>
                {(isLoading || isSaving) && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
            </div>
            <p className="text-[10px] text-muted-foreground pl-6 leading-relaxed max-w-2xl">
                Ajuste avanzado para controlar qué botone(s) (+) ven los usuarios regulares. Úselo con discreción.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pl-6">
                {options.map((option) => {
                    const isSelected = selected === option.value;
                    return (
                        <button
                            key={option.value}
                            onClick={() => handleSelect(option.value)}
                            disabled={isLoading || isSaving}
                            className={cn(
                                "text-left p-3 rounded-xl border flex flex-col justify-between transition-all duration-200 disabled:opacity-50",
                                isSelected
                                    ? "border-primary bg-primary/[0.03] ring-1 ring-primary/20"
                                    : "border-border bg-card hover:bg-muted/30"
                            )}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <p className={cn(
                                    "text-[10px] font-bold leading-none",
                                    isSelected ? "text-primary" : "text-foreground"
                                )}>
                                    {option.label.split('(')[0].trim()}
                                </p>
                                {isSelected && <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />}
                            </div>
                            <p className="text-[9px] text-muted-foreground line-clamp-2 leading-tight">
                                {option.description}
                            </p>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
