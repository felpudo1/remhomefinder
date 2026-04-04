import { useState } from "react";
import { Sparkles, Home, CheckCircle2, ChevronRight, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useSystemConfig } from "@/hooks/useSystemConfig";
import { APP_BRAND_NAME_DEFAULT, APP_BRAND_NAME_KEY } from "@/lib/config-keys";

interface UserWelcomeProps {
    onDismiss: (dontShowAgain: boolean) => void;
    /** Nombre (perfil o metadata de registro). */
    userName?: string;
    /** Teléfono (perfil o metadata); opcional. */
    userPhone?: string;
}

export const UserWelcome = ({ onDismiss, userName }: UserWelcomeProps) => {
    const [dontShowAgain, setDontShowAgain] = useState(false);
    const { value: appBrandName } = useSystemConfig(APP_BRAND_NAME_KEY, APP_BRAND_NAME_DEFAULT);

    return (
        <div className="flex flex-col items-center justify-center text-center py-12 md:py-24 animate-in fade-in slide-in-from-bottom-4 duration-700 min-h-[70vh]">
            <div className="w-24 h-24 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent rounded-full flex items-center justify-center mb-8 relative shadow-inner">
                <Home className="w-10 h-10 text-primary drop-shadow-sm" />
                <div className="absolute -top-1 -right-1 w-8 h-8 bg-blue-400/20 backdrop-blur-sm rounded-full flex items-center justify-center animate-pulse border border-blue-400/30">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                </div>
            </div>

            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
                ¡Bienvenido a <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">{appBrandName}</span>{userName ? `, ${userName.split(' ')[0]}` : ''}!
            </h2>
            <div className="mb-10" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl w-full text-left mb-12">
                <div className="p-6 rounded-3xl bg-card border border-border shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Layers className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-foreground mb-1.5 flex items-center gap-2">
                            Todo en un solo tablero
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Pegá el link de cualquier portal inmobiliario, nuestra IA extrae todos los datos y te muestra el aviso con todos los detalles.
                        </p>
                    </div>
                </div>

                <div className="p-6 rounded-3xl bg-card border border-border shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-foreground mb-1.5 flex items-center gap-2">
                            Seguimiento por Estados
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Llevá el control exacto de cuándo tenés que ir, si ya fuiste, si la descartaste. Y todos los miembros de la familia lo ven!! No se te escapa nada.
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-center gap-6 w-full max-w-sm">
                <Button
                    onClick={() => onDismiss(dontShowAgain)}
                    className="w-full h-14 text-base font-semibold rounded-2xl gap-2 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all hover:-translate-y-0.5"
                >
                    Entendido, ir a mi listado
                    <ChevronRight className="w-5 h-5" />
                </Button>

                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="dont-show-again"
                        checked={dontShowAgain}
                        onCheckedChange={(checked) => setDontShowAgain(checked as boolean)}
                        className="border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <label
                        htmlFor="dont-show-again"
                        className="text-sm font-medium leading-none text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                    >
                        No volver a mostrar esta pantalla
                    </label>
                </div>
            </div>
        </div>
    );
};
