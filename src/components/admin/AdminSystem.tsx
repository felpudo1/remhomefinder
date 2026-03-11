import { Settings, Monitor, CheckCircle2, Loader2, Mail, Phone } from "lucide-react";
import { useSystemConfig } from "@/hooks/useSystemConfig";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    SUPPORT_EMAIL_CONFIG_KEY,
    SUPPORT_EMAIL_DEFAULT,
    SUPPORT_PHONE_CONFIG_KEY,
    SUPPORT_PHONE_DEFAULT
} from "@/components/Footer";
import {
    FREE_PLAN_SAVE_LIMIT_KEY,
    FREE_PLAN_SAVE_LIMIT_DEFAULT
} from "@/hooks/useSubscription";

/** Posibles valores de configuración del botón de agregar */
export type AddButtonConfig = "blue" | "white" | "both" | "none";

import {
    SHOW_AUTH_VIDEO_CONFIG_KEY,
    SHOW_AUTH_VIDEO_DEFAULT,
    ADD_BUTTON_CONFIG_KEY,
    ADD_BUTTON_DEFAULT
} from "@/lib/config-keys";

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
    // Support phone config
    const {
        value: supportPhone,
        isLoading: isLoadingPhone,
        setValue: setSupportPhone,
        isSaving: isSavingPhone,
    } = useSystemConfig(SUPPORT_PHONE_CONFIG_KEY, SUPPORT_PHONE_DEFAULT);

    const [phoneDraft, setPhoneDraft] = useState(supportPhone);

    // Save limit config
    const {
        value: saveLimit,
        isLoading: isLoadingLimit,
        setValue: setSaveLimit,
        isSaving: isSavingLimit,
    } = useSystemConfig(FREE_PLAN_SAVE_LIMIT_KEY, FREE_PLAN_SAVE_LIMIT_DEFAULT);

    const [limitDraft, setLimitDraft] = useState(saveLimit);

    // Video config
    const {
        value: showVideo,
        isLoading: isLoadingVideo,
        setValue: setShowVideo,
        isSaving: isSavingVideo,
    } = useSystemConfig(SHOW_AUTH_VIDEO_CONFIG_KEY, SHOW_AUTH_VIDEO_DEFAULT);

    useEffect(() => {
        setPhoneDraft(supportPhone);
    }, [supportPhone]);

    useEffect(() => {
        setLimitDraft(saveLimit);
    }, [saveLimit]);

    const handleSelect = async (newValue: AddButtonConfig) => {
        try {
            await setValue(newValue);
            toast({ title: "Configuración guardada", description: "El cambio se aplicará a todos los usuarios." });
        } catch (error: any) {
            console.error("Error al guardar ADD_BUTTON:", error);
            toast({ title: "Error al guardar", description: error.message, variant: "destructive" });
        }
    };

    const handleToggleVideo = async () => {
        const newValue = showVideo === "true" ? "false" : "true";
        try {
            await setShowVideo(newValue);
            toast({ title: "Video actualizado", description: newValue === "true" ? "Video activado." : "Video desactivado." });
        } catch (error: any) {
            console.error("Error al guardar SHOW_VIDEO:", error);
            toast({ title: "Error al guardar video", description: error.message, variant: "destructive" });
        }
    };

    const handleSaveEmail = async () => {
        try {
            await setSupportEmail(emailDraft.trim());
            toast({ title: "Email de soporte guardado", description: "Se mostrará en el footer para todos los usuarios." });
        } catch {
            toast({ title: "Error al guardar email", variant: "destructive" });
        }
    };

    const handleSavePhone = async () => {
        try {
            await setSupportPhone(phoneDraft.trim());
            toast({ title: "Teléfono de soporte guardado", description: "Se mostrará como enlace de WhatsApp en el footer." });
        } catch {
            toast({ title: "Error al guardar teléfono", variant: "destructive" });
        }
    };

    const handleSaveLimit = async () => {
        try {
            await setSaveLimit(limitDraft.trim());
            toast({ title: "Límite guardado", description: "El cambio se aplicará a todos los usuarios Free de inmediato." });
        } catch {
            toast({ title: "Error al guardar límite", variant: "destructive" });
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

            {/* Sección: Planes y Límites */}
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-foreground text-sm">Planes y Límites (Freemium)</h3>
                    {(isLoadingLimit || isSavingLimit) && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                </div>
                <p className="text-xs text-muted-foreground pl-6">
                    Ajustá el límite de propiedades que un usuario con plan **Free** puede guardar en su lista personal.
                </p>

                <div className="flex gap-2 pl-6 max-w-sm">
                    <div className="relative flex-1">
                        <Input
                            type="number"
                            placeholder="Ej: 10"
                            value={limitDraft}
                            onChange={(e) => setLimitDraft(e.target.value)}
                            disabled={isLoadingLimit || isSavingLimit}
                            className="rounded-xl border-border bg-card pr-20"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground uppercase">
                            AVISOS
                        </div>
                    </div>
                    <Button
                        onClick={handleSaveLimit}
                        disabled={isLoadingLimit || isSavingLimit || limitDraft === saveLimit}
                        className="rounded-xl shrink-0"
                        size="sm"
                    >
                        Actualizar Límite
                    </Button>
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
                        className="rounded-xl border-border bg-card"
                    />
                    <Button
                        onClick={handleSaveEmail}
                        disabled={isLoadingEmail || isSavingEmail || emailDraft === supportEmail}
                        className="rounded-xl shrink-0"
                        size="sm"
                    >
                        Guardar Email
                    </Button>
                </div>
            </div>

            {/* Sección: Teléfono de soporte */}
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-foreground text-sm">WhatsApp de soporte</h3>
                    {(isLoadingPhone || isSavingPhone) && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                </div>
                <p className="text-xs text-muted-foreground pl-6">
                    Este número se mostrará como enlace directo a WhatsApp en el footer. Usá formato internacional (ej: +54911...).
                </p>

                <div className="flex gap-2 pl-6 max-w-md">
                    <Input
                        type="text"
                        placeholder="+54 9 11 1234 5678"
                        value={phoneDraft}
                        onChange={(e) => setPhoneDraft(e.target.value)}
                        disabled={isLoadingPhone || isSavingPhone}
                        className="rounded-xl border-border bg-card"
                    />
                    <Button
                        onClick={handleSavePhone}
                        disabled={isLoadingPhone || isSavingPhone || phoneDraft === supportPhone}
                        className="rounded-xl shrink-0"
                        size="sm"
                    >
                        Guardar Teléfono
                    </Button>
                </div>
            </div>

            {/* Sección: Video de fondo */}
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-foreground text-sm">Video de fondo (Auth)</h3>
                    {(isLoadingVideo || isSavingVideo) && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                </div>
                <p className="text-xs text-muted-foreground pl-6">
                    Activa o desactiva el video de fondo en la página de inicio de sesión/registro para ahorrar recursos.
                </p>

                <div className="flex items-center gap-3 pl-6">
                    <button
                        onClick={handleToggleVideo}
                        disabled={isLoadingVideo || isSavingVideo}
                        className={cn(
                            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                            showVideo === "true" ? "bg-primary" : "bg-muted"
                        )}
                    >
                        <span
                            className={cn(
                                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                                showVideo === "true" ? "translate-x-6" : "translate-x-1"
                            )}
                        />
                    </button>
                    <span className="text-sm font-medium text-foreground">
                        {showVideo === "true" ? "Video Activado" : "Video Desactivado (Imagen fija)"}
                    </span>
                </div>
            </div>

            {/* Sección: Botón de agregar propiedad (AHORA AL FINAL Y MÁS CHICO) */}
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
        </div>
    );
}
