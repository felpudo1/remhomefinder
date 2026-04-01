import { CheckCircle2, Loader2 } from "lucide-react";
import { useSystemConfig } from "@/hooks/useSystemConfig";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    AGENT_FREE_PLAN_PUBLISH_LIMIT_KEY,
    AGENT_FREE_PLAN_PUBLISH_LIMIT_DEFAULT,
    USER_FREE_PLAN_SAVE_LIMIT_KEY,
    USER_FREE_PLAN_SAVE_LIMIT_DEFAULT,
    USER_PREMIUM_PLAN_SAVE_LIMIT_KEY,
    USER_PREMIUM_PLAN_SAVE_LIMIT_DEFAULT,
    AGENT_REFERRAL_BONUS_SAVES_KEY,
    AGENT_REFERRAL_BONUS_SAVES_DEFAULT,
    LIMIT_INCLUDES_MARKETPLACE_KEY,
    LIMIT_INCLUDES_MARKETPLACE_DEFAULT
} from "@/lib/config-keys";

/**
 * Componente para gestionar los límites de los clientes en el plan gratuito.
 * Extraído de AdminSystem para mejor mantenibilidad (REGLA 2).
 */
export const AdminPlans = () => {
    const { toast } = useToast();

    // Límite de Usuarios (Saves)
    const {
        value: saveLimit,
        isLoading: isLoadingLimit,
        setValue: setSaveLimit,
        isSaving: isSavingLimit,
    } = useSystemConfig(USER_FREE_PLAN_SAVE_LIMIT_KEY, USER_FREE_PLAN_SAVE_LIMIT_DEFAULT);

    // Límite de Usuarios Premium (Saves)
    const {
        value: premiumSaveLimit,
        isLoading: isLoadingPremium,
        setValue: setPremiumSaveLimit,
        isSaving: isSavingPremium,
    } = useSystemConfig(USER_PREMIUM_PLAN_SAVE_LIMIT_KEY, USER_PREMIUM_PLAN_SAVE_LIMIT_DEFAULT);

    // Límite de Agentes (Publishes)
    const {
        value: publishLimit,
        isLoading: isLoadingPublish,
        setValue: setPublishLimit,
        isSaving: isSavingPublish,
    } = useSystemConfig(AGENT_FREE_PLAN_PUBLISH_LIMIT_KEY, AGENT_FREE_PLAN_PUBLISH_LIMIT_DEFAULT);

    const [limitDraft, setLimitDraft] = useState(saveLimit);
    const [premiumLimitDraft, setPremiumLimitDraft] = useState(premiumSaveLimit);
    const [publishDraft, setPublishDraft] = useState(publishLimit);

    useEffect(() => { setLimitDraft(saveLimit); }, [saveLimit]);
    useEffect(() => { setPremiumLimitDraft(premiumSaveLimit); }, [premiumSaveLimit]);
    useEffect(() => { setPublishDraft(publishLimit); }, [publishLimit]);

    const handleSaveLimit = async () => {
        try {
            await setSaveLimit(limitDraft.trim());
            toast({ title: "Límite guardado", description: "El cambio se aplicará a todos los usuarios Free de inmediato." });
        } catch (error: any) {
            toast({ title: "Error al guardar límite", description: error.message, variant: "destructive" });
        }
    };

    // Guardar límite premium de usuarios
    const handleSavePremiumLimit = async () => {
        try {
            await setPremiumSaveLimit(premiumLimitDraft.trim());
            toast({ title: "Límite premium guardado", description: "El cambio se aplicará a todos los usuarios Premium de inmediato." });
        } catch (error: any) {
            toast({ title: "Error al guardar límite", description: error.message, variant: "destructive" });
        }
    };

    const handleSavePublishLimit = async () => {
        try {
            await setPublishLimit(publishDraft.trim());
            toast({ title: "Límite guardado", description: "El cambio se aplicará a todas las organizaciones Free de inmediato." });
        } catch (error: any) {
            toast({ title: "Error al guardar límite", description: error.message, variant: "destructive" });
        }
    };

    // Bonus por referral de agente
    const {
        value: referralBonus,
        isLoading: isLoadingBonus,
        setValue: setReferralBonus,
        isSaving: isSavingBonus,
    } = useSystemConfig(AGENT_REFERRAL_BONUS_SAVES_KEY, AGENT_REFERRAL_BONUS_SAVES_DEFAULT);

    const [bonusDraft, setBonusDraft] = useState(referralBonus);
    useEffect(() => { setBonusDraft(referralBonus); }, [referralBonus]);

    // Guardar bonus de referral
    const handleSaveBonusLimit = async () => {
        try {
            await setReferralBonus(bonusDraft.trim());
            toast({ title: "Bonus guardado", description: "Los usuarios referidos por agentes ahora reciben " + bonusDraft.trim() + " avisos extra." });
        } catch (error: any) {
            toast({ title: "Error al guardar bonus", description: error.message, variant: "destructive" });
        }
    };

    const isGlobalLoading = isLoadingLimit || isSavingLimit || isLoadingPremium || isSavingPremium || isLoadingPublish || isSavingPublish || isLoadingBonus || isSavingBonus;

    return (
        <div className="space-y-6">
            {/* Límite de Usuarios */}
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-foreground text-sm">Límite de Guardado (Usuarios Free)</h3>
                    {isGlobalLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
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
                            disabled={isGlobalLoading}
                            className="rounded-xl border-border bg-card pr-20"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground uppercase">
                            AVISOS
                        </div>
                    </div>
                    <Button
                        onClick={handleSaveLimit}
                        disabled={isGlobalLoading || limitDraft === saveLimit}
                        className="rounded-xl shrink-0"
                        size="sm"
                    >
                        Actualizar
                    </Button>
                </div>
            </div>

            {/* Límite de Usuarios Premium */}
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-yellow-500" />
                    <h3 className="font-semibold text-foreground text-sm">Límite de Guardado (Usuarios Premium)</h3>
                </div>
                <p className="text-xs text-muted-foreground pl-6">
                    Ajustá el límite de propiedades que un usuario con plan **Premium** puede guardar en su lista personal.
                </p>

                <div className="flex gap-2 pl-6 max-w-sm">
                    <div className="relative flex-1">
                        <Input
                            type="number"
                            placeholder="Ej: 200"
                            value={premiumLimitDraft}
                            onChange={(e) => setPremiumLimitDraft(e.target.value)}
                            disabled={isGlobalLoading}
                            className="rounded-xl border-border bg-card pr-24"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-yellow-500 uppercase">
                            PREMIUM
                        </div>
                    </div>
                    <Button
                        onClick={handleSavePremiumLimit}
                        disabled={isGlobalLoading || premiumLimitDraft === premiumSaveLimit}
                        className="rounded-xl shrink-0"
                        size="sm"
                    >
                        Actualizar
                    </Button>
                </div>
            </div>

            {/* Límite de Agentes */}
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-foreground text-sm">Límite de Publicación (Agentes)</h3>
                </div>
                <p className="text-xs text-muted-foreground pl-6">
                    Ajustá el límite de propiedades que una **Organización** con plan **Free** puede publicar en el marketplace.
                </p>

                <div className="flex gap-2 pl-6 max-w-sm">
                    <div className="relative flex-1">
                        <Input
                            type="number"
                            placeholder="Ej: 3"
                            value={publishDraft}
                            onChange={(e) => setPublishDraft(e.target.value)}
                            disabled={isGlobalLoading}
                            className="rounded-xl border-border bg-card pr-20"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground uppercase">
                            MARKET
                        </div>
                    </div>
                    <Button
                        onClick={handleSavePublishLimit}
                        disabled={isGlobalLoading || publishDraft === publishLimit}
                        className="rounded-xl shrink-0"
                        size="sm"
                    >
                        Actualizar
                    </Button>
                </div>
            </div>

            {/* Bonus por Referral de Agente */}
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <h3 className="font-semibold text-foreground text-sm">Bonus por Referral de Agente</h3>
                </div>
                <p className="text-xs text-muted-foreground pl-6">
                    Avisos extra que recibe un usuario cuando se registra usando el link de referido de un **agente**. Se suman al límite del plan.
                </p>

                <div className="flex gap-2 pl-6 max-w-sm">
                    <div className="relative flex-1">
                        <Input
                            type="number"
                            placeholder="Ej: 5"
                            value={bonusDraft}
                            onChange={(e) => setBonusDraft(e.target.value)}
                            disabled={isGlobalLoading}
                            className="rounded-xl border-border bg-card pr-20"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-green-500 uppercase">
                            BONUS
                        </div>
                    </div>
                    <Button
                        onClick={handleSaveBonusLimit}
                        disabled={isGlobalLoading || bonusDraft === referralBonus}
                        className="rounded-xl shrink-0"
                        size="sm"
                    >
                        Actualizar
                    </Button>
                </div>
            </div>
        </div>
    );
};
