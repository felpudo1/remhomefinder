import { useState, useEffect } from "react";
import { useSystemConfig } from "@/hooks/useSystemConfig";
import { ShieldAlert, AlertTriangle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Sub-componente para gestionar el modo mantenimiento (REGLA 2).
 */
export function AdminMaintenance() {
    const { value: mode, setValue: setMode, isSaving: isSavingMode } = useSystemConfig("maintenance_mode", "false");
    const { value: message, setValue: setMessage, isSaving: isSavingMessage } = useSystemConfig("maintenance_message", "");
    const { value: autoProtect, setValue: setAutoProtect, isSaving: isSavingAuto } = useSystemConfig("auto_maintenance_protection", "false");
    const { value: threshold, setValue: setThreshold, isSaving: isSavingThreshold } = useSystemConfig("maintenance_threshold", "20");
    
    // Estado local para evitar guardar en cada pulsación de tecla (REGLA 2: Performance)
    const [localThreshold, setLocalThreshold] = useState(threshold);

    // Sincronizar con el valor de la BD cuando este cambie (ej: carga inicial)
    useEffect(() => {
        setLocalThreshold(threshold);
    }, [threshold]);

    const handleSaveThreshold = () => {
        if (localThreshold !== threshold) {
            setThreshold(localThreshold);
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
                        Activa el escudo global. Solo administradores podrán saltar el bloqueo.
                    </p>
                </div>
                <Switch 
                    checked={mode === "true"} 
                    onCheckedChange={(checked) => setMode(checked ? "true" : "false")}
                    disabled={isSavingMode}
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
                            El escudo se activará solo si el Burst Balance (crédito de IO) cae por debajo del umbral.
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
        </div>
    );
}
