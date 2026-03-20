import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Star, Sparkles, PartyPopper, CheckCircle2, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { useSystemConfig } from "@/hooks/useSystemConfig";
import { APP_BRAND_NAME_DEFAULT, APP_BRAND_NAME_KEY } from "@/lib/config-keys";

interface PremiumWelcomeModalProps {
    open: boolean;
    onClose: () => void;
    type?: "user" | "agent";
}

export function PremiumWelcomeModal({ open, onClose, type = "user" }: PremiumWelcomeModalProps) {
    const [showContent, setShowContent] = useState(false);
    const isAgent = type === "agent";
    const { value: appBrandName } = useSystemConfig(APP_BRAND_NAME_KEY, APP_BRAND_NAME_DEFAULT);

    useEffect(() => {
        if (open) {
            const timer = setTimeout(() => setShowContent(true), 100);
            return () => clearTimeout(timer);
        } else {
            setShowContent(false);
        }
    }, [open]);

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md rounded-[2.5rem] p-0 overflow-hidden border-none shadow-[0_0_50px_rgba(var(--primary-rgb),0.3)] animate-in zoom-in-95 duration-300">
                {/* Fondo con Graduado Animado y Partículas Visuales */}
                <div className="bg-gradient-to-br from-[#1a1c2c] via-[#4a192c] to-[#1a1c2c] p-10 text-white relative overflow-hidden min-h-[500px] flex flex-col items-center justify-center text-center">

                    {/* Decoraciones de Fondo */}
                    <div className="absolute top-[-10%] left-[-10%] w-40 h-40 bg-primary/20 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-40 h-40 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-700" />

                    <div className="relative z-10 space-y-8">
                        {/* Ícono Central con Animación */}
                        <div className={`transition-all duration-1000 transform ${showContent ? 'scale-110 opacity-100 rotate-0' : 'scale-50 opacity-0 -rotate-12'}`}>
                            <div className="relative inline-block">
                                <div className="absolute inset-0 bg-primary blur-2xl opacity-40 animate-pulse" />
                                <div className="relative bg-gradient-to-b from-yellow-400 to-orange-600 p-6 rounded-3xl shadow-2xl skew-y-3">
                                    <Crown className="w-16 h-16 text-white drop-shadow-lg" />
                                </div>
                                <Sparkles className="absolute -top-4 -right-4 w-8 h-8 text-yellow-300 animate-bounce" />
                                <Star className="absolute -bottom-2 -left-6 w-6 h-6 text-yellow-200 animate-pulse" />
                            </div>
                        </div>

                        {/* Texto de Bienvenida */}
                        <div className={`space-y-3 transition-all duration-700 delay-300 ${showContent ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20">
                                <PartyPopper className="w-4 h-4 text-yellow-400" />
                                <span className="text-xs font-bold uppercase tracking-[0.2em] text-yellow-100">¡Nivel Desbloqueado!</span>
                            </div>
                            <h2 className="text-4xl font-black tracking-tight leading-tight">
                                ¡Bienvenido al <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-200 animate-shimmer">Círculo Premium</span>!
                            </h2>
                            <p className="text-gray-300 text-sm font-medium px-4">
                                {isAgent
                                    ? "Tu suscripción como Agente ha sido activada. Preparate para publicar sin límites y destacar tus propiedades como nunca."
                                    : `Tu experiencia en ${appBrandName} ahora es ilimitada. Preparate para alcanzar todas tus metas como un verdadero profesional.`}
                            </p>
                        </div>

                        {/* Grid de Beneficios VIP */}
                        <div className={`grid grid-cols-2 gap-3 transition-all duration-700 delay-500 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
                            {(isAgent ? [
                                { icon: Zap, text: "Publicaciones Ilimitadas" },
                                { icon: CheckCircle2, text: "Prioridad en Market" },
                                { icon: Star, text: "Sello de Verificado" },
                                { icon: Sparkles, text: "Soporte VIP" }
                            ] : [
                                { icon: Zap, text: "Lista Ilimitada" },
                                { icon: CheckCircle2, text: "Sin Restricciones" },
                                { icon: Star, text: "Acceso VIP" },
                                { icon: Sparkles, text: "Tooltips Pro" }
                            ]).map((item, i) => (
                                <div key={i} className="flex items-center gap-2 bg-white/5 border border-white/10 p-2.5 rounded-2xl">
                                    <item.icon className="w-4 h-4 text-yellow-400 shrink-0" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-200">{item.text}</span>
                                </div>
                            ))}
                        </div>

                        <div className={`pt-4 transition-all duration-700 delay-700 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
                            <Button
                                className="w-full h-14 rounded-2xl text-md font-bold bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-600 hover:from-yellow-300 hover:to-orange-500 text-black border-none shadow-[0_10px_20px_rgba(234,179,8,0.3)] transition-all hover:scale-[1.03] active:scale-95"
                                onClick={onClose}
                            >
                                COMENZAR MI EXPERIENCIA VIP
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Footer Discreto */}
                <div className="bg-[#0f111a] p-4 text-center border-t border-white/5">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em]">
                        {isAgent ? "Agencia Premium &bull; Elite Edition" : `${appBrandName} Premium &bull; Edición 2026`}
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
