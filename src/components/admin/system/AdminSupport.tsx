import { Mail, Phone, Loader2 } from "lucide-react";
import { useSystemConfig } from "@/hooks/useSystemConfig";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    SUPPORT_EMAIL_CONFIG_KEY,
    SUPPORT_EMAIL_DEFAULT,
    SUPPORT_PHONE_CONFIG_KEY,
    SUPPORT_PHONE_DEFAULT
} from "@/lib/config-keys";

/**
 * Componente para configurar los canales de soporte (Email y WhatsApp).
 * Extraído de AdminSystem para mejor mantenibilidad (REGLA 2).
 */
export const AdminSupport = () => {
    const { toast } = useToast();

    // Config de email
    const {
        value: supportEmail,
        isLoading: isLoadingEmail,
        setValue: setSupportEmail,
        isSaving: isSavingEmail,
    } = useSystemConfig(SUPPORT_EMAIL_CONFIG_KEY, SUPPORT_EMAIL_DEFAULT);

    const [emailDraft, setEmailDraft] = useState(supportEmail);

    // Config de teléfono
    const {
        value: supportPhone,
        isLoading: isLoadingPhone,
        setValue: setSupportPhone,
        isSaving: isSavingPhone,
    } = useSystemConfig(SUPPORT_PHONE_CONFIG_KEY, SUPPORT_PHONE_DEFAULT);

    const [phoneDraft, setPhoneDraft] = useState(supportPhone);

    useEffect(() => {
        setEmailDraft(supportEmail);
    }, [supportEmail]);

    useEffect(() => {
        setPhoneDraft(supportPhone);
    }, [supportPhone]);

    const handleSaveEmail = async () => {
        try {
            await setSupportEmail(emailDraft.trim());
            toast({ title: "Email de soporte guardado", description: "Se mostrará en el footer para todos los usuarios." });
        } catch (error: any) {
            toast({ title: "Error al guardar email", description: error.message, variant: "destructive" });
        }
    };

    const handleSavePhone = async () => {
        try {
            await setSupportPhone(phoneDraft.trim());
            toast({ title: "Teléfono de soporte guardado", description: "Se mostrará como enlace de WhatsApp en el footer." });
        } catch (error: any) {
            toast({ title: "Error al guardar teléfono", description: error.message, variant: "destructive" });
        }
    };

    return (
        <div className="space-y-6">
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
        </div>
    );
};
