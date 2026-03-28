import { useState, useEffect } from "react";
import { useSystemConfig } from "@/hooks/useSystemConfig";
import { ShieldAlert, AlertTriangle, Skull } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

/**
 * Sub-componente para gestionar el modo mantenimiento (REGLA 2).
 */
export function AdminMaintenance() {
    const { value: mode, setValue: setMode, isSaving: isSavingMode } = useSystemConfig("maintenance_mode", "false");
    const { value: message, setValue: setMessage, isSaving: isSavingMessage } = useSystemConfig("maintenance_message", "");
    const { value: autoProtect, setValue: setAutoProtect, isSaving: isSavingAuto } = useSystemConfig("auto_maintenance_protection", "false");
    const { value: threshold, setValue: setThreshold, isSaving: isSavingThreshold } = useSystemConfig("maintenance_threshold", "20");
    const { value: lowIoInterval, setValue: setLowIoInterval, isSaving: isSavingInterval } = useSystemConfig("low_io_polling_minutes", "30");
    
    const [localThreshold, setLocalThreshold] = useState(threshold);
    const [localInterval, setLocalInterval] = useState(lowIoInterval);
    const [isNuking, setIsNuking] = useState(false);

    useEffect(() => {
        setLocalThreshold(threshold);
    }, [threshold]);

    useEffect(() => {
        setLocalInterval(lowIoInterval);
    }, [lowIoInterval]);

    const handleSaveThreshold = () => {
        if (localThreshold !== threshold) {
            setThreshold(localThreshold);
        }
    };

    const handleSaveInterval = () => {
        if (localInterval !== lowIoInterval) {
            setLowIoInterval(localInterval);
        }
    };

    const handleNuclearLogout = async () => {
        setIsNuking(true);
        try {
            const { data: sessionData } = await supabase.auth.getSession();
            const token = sessionData?.session?.access_token;
            if (!token) {
                toast.error("No hay sesión activa");
                return;
            }

            const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
            const res = await fetch(
                `https://${projectId}.supabase.co/functions/v1/get-system-metrics?action=nuclear_logout`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            const result = await res.json();

            if (res.ok && result.success) {
                if ((result.count ?? 0) > 0) {
                    toast.success(`☢️ Nuclear Logout completado: ${result.count} sesiones cerradas`);
                } else {
                    toast.warning("No había otras sesiones activas para cerrar");
                }
            } else {
                toast.error(`Error: ${result.error || "Error desconocido"}`);
            }
        } catch (err: any) {
            toast.error(`Error de red: ${err?.message || "Error desconocido"}`);
        } finally {
            setIsNuking(false);
        }
    };

    const handleActivateShield = async (checked: boolean) => {
        setMode(checked ? "true" : "false");
        // Si se activa el escudo manualmente, ejecutar nuclear logout también
        if (checked) {
            await handleNuclearLogout();
        }
    };

    return (
        <div className="space-y-4 p-4 border border-border rounded-xl bg-card">
            <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                    <div className="font-bold flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-primary" />
                        Modo Mantenimiento
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Activa el escudo global. Solo administradores podrán saltar el bloqueo. Al activar, se ejecuta Nuclear Logout automáticamente.
                    </p>
                </div>
                <Switch 
                    checked={mode === "true"} 
                    onCheckedChange={handleActivateShield}
                    disabled={isSavingMode || isNuking}
                />
            </div>
            {mode === "true" && (
                <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                    <Label className="text-xs font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-yellow-500" />
                        Mensaje para los usuarios
                    </Label>
                    <div className="flex gap-2">
                        <Input 
                            value={message} 
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Ej: Estamos realizando tareas técnicas..."
                            className="text-sm"
                            disabled={isSavingMessage}
                        />
                    </div>
                </div>
            )}

            <div className="pt-2 border-t border-border/50 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <div className="font-bold flex items-center gap-2 text-sm">
                            <ShieldAlert className="w-4 h-4 text-secondary-foreground/70" />
                            Protección Automática
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-tight">
                            El escudo se activará solo si el Burst Balance (crédito de IO) cae por debajo del umbral. También ejecutará Nuclear Logout.
                        </p>
                    </div>
                    <Switch 
                        checked={autoProtect === "true"} 
                        onCheckedChange={(checked) => setAutoProtect(checked ? "true" : "false")}
                        disabled={isSavingAuto}
                    />
                </div>
            </div>

            <div className="flex items-center justify-between gap-4 pt-2 border-t border-border/50 animate-in slide-in-from-right-2 duration-300">
                <div className="space-y-0.5">
                    <Label className="text-xs font-bold text-foreground">
                        Umbral de Burst Balance (%)
                    </Label>
                    <p className="text-[10px] text-muted-foreground">
                        El escudo se activará si el balance cae por debajo de este punto.
                    </p>
                </div>
                <div className="flex items-center gap-1.5 w-24">
                    <Input 
                        type="number"
                        value={localThreshold} 
                        onChange={(e) => setLocalThreshold(e.target.value)}
                        onBlur={handleSaveThreshold}
                        onKeyDown={(e) => e.key === "Enter" && handleSaveThreshold()}
                        className="text-sm h-9 text-center font-bold text-black bg-white dark:bg-slate-200 border-primary/30"
                        min="0"
                        max="100"
                        step="1"
                        disabled={isSavingThreshold}
                    />
                    <span className="text-xs font-bold text-muted-foreground">%</span>
                </div>
            </div>

            {/* Nuclear Logout Button */}
            <div className="pt-3 border-t border-destructive/20">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button
                            variant="destructive"
                            size="sm"
                            className="w-full gap-2"
                            disabled={isNuking}
                        >
                            <Skull className="w-4 h-4" />
                            {isNuking ? "Ejecutando..." : "☢️ Cerrar Todas las Sesiones (Nuclear Logout)"}
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2">
                                <Skull className="w-5 h-5 text-destructive" />
                                ☢️ Nuclear Logout
                            </AlertDialogTitle>
                            <AlertDialogDescription className="space-y-2">
                                <p>
                                    Esta acción cerrará <strong>TODAS las sesiones activas</strong> de todos los usuarios, excepto la tuya.
                                </p>
                                <p>
                                    Todos los usuarios serán forzados a iniciar sesión de nuevo. Usá esto solo en emergencias (ataque, saturación de IO, sesiones fantasma).
                                </p>
                                <p className="text-destructive font-semibold">
                                    Esta acción NO se puede deshacer.
                                </p>
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleNuclearLogout}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                                Confirmar Nuclear Logout
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                <p className="text-[10px] text-muted-foreground mt-2 text-center">
                    Se ejecuta automáticamente con la activación del escudo (manual o por umbral).
                </p>
            </div>
        </div>
    );
}