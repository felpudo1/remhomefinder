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
        </div>
    );
}
