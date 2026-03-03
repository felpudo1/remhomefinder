import { Settings, Monitor, CheckCircle2, Loader2, Mail } from "lucide-react";
import { useSystemConfig } from "@/hooks/useSystemConfig";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SUPPORT_EMAIL_CONFIG_KEY, SUPPORT_EMAIL_DEFAULT } from "@/components/Footer";

/** Posibles valores de configuración del botón de agregar */
export type AddButtonConfig = "blue" | "white" | "both" | "none";

/** Clave en la tabla system_config de Supabase */
export const ADD_BUTTON_CONFIG_KEY = "add_button_config";

/** Valor por defecto si no hay config en Supabase */
export const ADD_BUTTON_DEFAULT: AddButtonConfig = "blue";

export function AdminSystem() {
    const { toast } = useToast();
    const { value, isLoading, setValue, isSaving } = useSystemConfig(
        ADD_BUTTON_CONFIG_KEY,
        ADD_BUTTON_DEFAULT
    );
    const selected = (value as AddButtonConfig) || ADD_BUTTON_DEFAULT;

    // Support email config
    const {
        value: supportEmail,
        isLoading: isLoadingEmail,
        setValue: setSupportEmail,
        isSaving: isSavingEmail,
    } = useSystemConfig(SUPPORT_EMAIL_CONFIG_KEY, SUPPORT_EMAIL_DEFAULT);

    const [emailDraft, setEmailDraft] = useState(supportEmail);
    useEffect(() => {
        setEmailDraft(supportEmail);
    }, [supportEmail]);

    const handleSelect = async (newValue: AddButtonConfig) => {
        try {
            await setValue(newValue);
            toast({ title: "Configuración guardada", description: "El cambio se aplicará a todos los usuarios." });
        } catch {
            toast({ title: "Error al guardar", variant: "destructive" });
        }
    };

    const handleSaveEmail = async () => {
        try {
            await setSupportEmail(emailDraft.trim());
            toast({ title: "Email de soporte guardado", description: "Se mostrará en el footer para todos los usuarios." });
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
        <div className="space-y-8">
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
                                {isSelected && (
                                    <CheckCircle2 className="w-4 h-4 text-primary absolute top-3 right-3" />
                                )}
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

            {/* Sección: Email de soporte */}
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-foreground text-sm">Email de soporte</h3>
                    {(isLoadingEmail || isSavingEmail) && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                </div>
                <p className="text-xs text-muted-foreground pl-6">
                    Este email se mostrará como enlace de "Soporte" en el footer de la plataforma. Dejalo vacío para ocultarlo.
                </p>

                <div className="flex gap-2 pl-6 max-w-md">
                    <Input
                        type="email"
                        placeholder="soporte@ejemplo.com"
                        value={emailDraft}
                        onChange={(e) => setEmailDraft(e.target.value)}
                        disabled={isLoadingEmail || isSavingEmail}
                        className="rounded-xl"
                    />
                    <Button
                        onClick={handleSaveEmail}
                        disabled={isLoadingEmail || isSavingEmail || emailDraft === supportEmail}
                        className="rounded-xl shrink-0"
                        size="sm"
                    >
                        Guardar
                    </Button>
                </div>
            </div>
        </div>
    );
}
