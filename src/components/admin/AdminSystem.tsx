import { Settings, Monitor, CheckCircle2, Loader2 } from "lucide-react";
import { useSystemConfig } from "@/hooks/useSystemConfig";
import { useToast } from "@/hooks/use-toast";

/** Posibles valores de configuración del botón de agregar */
export type AddButtonConfig = "blue" | "white" | "both" | "none";

/** Clave en la tabla system_config de Supabase */
export const ADD_BUTTON_CONFIG_KEY = "add_button_config";

/** Valor por defecto si no hay config en Supabase */
export const ADD_BUTTON_DEFAULT: AddButtonConfig = "blue";

/**
 * Componente de configuración del sistema para el panel de Admin.
 * Permite al admin controlar qué botón (+) de agregar propiedades ven los usuarios.
 * La configuración se persiste en la tabla `system_config` de Supabase.
 */
export function AdminSystem() {
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
        } catch {
            toast({ title: "Error al guardar", variant: "destructive" });
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
        <div className="space-y-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Monitor className="w-4 h-4" />
                <p>Estos ajustes controlan qué elementos de UI se muestran a los usuarios regulares de la plataforma.</p>
            </div>

            {/* Sección: Botón de agregar propiedad */}
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-foreground text-sm">Botón de agregar propiedad</h3>
                    {(isLoading || isSaving) && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                </div>
                <p className="text-xs text-muted-foreground pl-6">
                    Controlá qué botón flotante (+) ven los usuarios en su panel principal. El cambio aplica para todos en tiempo real.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {options.map((option) => {
                        const isSelected = selected === option.value;
                        return (
                            <button
                                key={option.value}
                                onClick={() => handleSelect(option.value)}
                                disabled={isLoading || isSaving}
                                className={`relative text-left p-4 rounded-2xl border-2 transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${isSelected
                                        ? "border-primary bg-primary/5 shadow-sm"
                                        : "border-border bg-card hover:border-border/80"
                                    }`}
                            >
                                {/* Checkmark de selección */}
                                {isSelected && (
                                    <CheckCircle2 className="w-4 h-4 text-primary absolute top-3 right-3" />
                                )}

                                {/* Preview del botón */}
                                <div className="mb-3">{option.preview}</div>

                                <div>
                                    <p className={`text-sm font-semibold ${isSelected ? "text-primary" : "text-foreground"}`}>
                                        {option.label}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                                        {option.description}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
