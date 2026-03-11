import { Monitor, Loader2 } from "lucide-react";
import { useSystemConfig } from "@/hooks/useSystemConfig";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { SHOW_AUTH_VIDEO_CONFIG_KEY, SHOW_AUTH_VIDEO_DEFAULT } from "@/lib/config-keys";

/**
 * Componente para controlar si se muestra el video de fondo en la página de Auth.
 * Extraído de AdminSystem para mejor mantenibilidad (REGLA 2).
 */
export const AdminVideoConfig = () => {
    const { toast } = useToast();
    const {
        value: showVideo,
        isLoading: isLoadingVideo,
        setValue: setShowVideo,
        isSaving: isSavingVideo,
    } = useSystemConfig(SHOW_AUTH_VIDEO_CONFIG_KEY, SHOW_AUTH_VIDEO_DEFAULT);

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

    return (
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
    );
};
