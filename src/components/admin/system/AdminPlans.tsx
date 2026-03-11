import { CheckCircle2, Loader2 } from "lucide-react";
import { useSystemConfig } from "@/hooks/useSystemConfig";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FREE_PLAN_SAVE_LIMIT_KEY, FREE_PLAN_SAVE_LIMIT_DEFAULT } from "@/lib/config-keys";

/**
 * Componente para gestionar los límites de los clientes en el plan gratuito.
 * Extraído de AdminSystem para mejor mantenibilidad (REGLA 2).
 */
export const AdminPlans = () => {
    const { toast } = useToast();
    const {
        value: saveLimit,
        isLoading: isLoadingLimit,
        setValue: setSaveLimit,
        isSaving: isSavingLimit,
    } = useSystemConfig(FREE_PLAN_SAVE_LIMIT_KEY, FREE_PLAN_SAVE_LIMIT_DEFAULT);

    const [limitDraft, setLimitDraft] = useState(saveLimit);

    useEffect(() => {
        setLimitDraft(saveLimit);
    }, [saveLimit]);

    const handleSaveLimit = async () => {
        try {
            await setSaveLimit(limitDraft.trim());
            toast({ title: "Límite guardado", description: "El cambio se aplicará a todos los usuarios Free de inmediato." });
        } catch (error: any) {
            toast({ title: "Error al guardar límite", description: error.message, variant: "destructive" });
        }
    };

    return (
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
    );
};
