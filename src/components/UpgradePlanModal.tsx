import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Sparkles, Rocket, Zap, Shield, Gem, Star, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSystemConfig } from "@/hooks/useSystemConfig";
import { PREMIUM_PLAN_PRICE_KEY, PREMIUM_PLAN_PRICE_DEFAULT, PREMIUM_PLAN_CURRENCY_KEY, PREMIUM_PLAN_CURRENCY_DEFAULT } from "@/lib/config-keys";

interface UpgradePlanModalProps {
    open: boolean;
    onClose: () => void;
    limit?: number;
    type?: "user" | "agent";
    title?: string;
    description?: string;
}

/**
 * UpgradePlanModal - Rediseño "Dark Premium" v9 (Dialog centrado)
 * Modal centrado con estilo dark premium (glassmorphism + gradientes oscuros).
 * Mismo texto y funcionalidad que antes, nueva apariencia unificada.
 */
export function UpgradePlanModal({ 
    open, 
    onClose, 
    limit = 0, 
    type = "user",
    title,
    description 
}: UpgradePlanModalProps) {
    const isAgent = type === "agent";
    const [showContent, setShowContent] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    // Animación de entrada escalonada
    useEffect(() => {
        if (open) {
            setShowContent(false);
            const timer = setTimeout(() => setShowContent(true), 100);
            return () => clearTimeout(timer);
        }
    }, [open]);

    // Beneficios con UX Copywriting de Alto Impacto
    const benefits = isAgent ? [
        { icon: Zap, label: "Alcance Infinito", text: "Publicaciones ilimitadas en el Marketplace sin restricciones de stock." },
        { icon: Star, label: "Visibilidad Elite", text: "Prioridad máxima en resultados de búsqueda para mayor exposición." },
        { icon: Gem, label: "Sello de Confianza", text: "Distinciones premium para fidelizar clientes y destacar tu agencia." },
        { icon: Shield, label: "Soporte Priority", text: "Atención técnica y comercial preferente de nivel VIP." }
    ] : [
        { icon: Zap, label: "Poder Ilimitado", text: "Multiplica x10 tu capacidad de guardado de avisos." },
        { icon: Sparkles, label: "MatchAI Magic", text: "Olvida el scroll infinito, deja que las propiedades perfectas te encuentren a ti." },
        { icon: Crown, label: "Asistencia VIP", text: "Prioridad absoluta en el contacto con agentes y agencias." },
        { icon: Shield, label: "Soporte Elite", text: "Respaldo técnico 24/7 para una experiencia fluida y profesional." }
    ];

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent
                className="max-w-lg rounded-[2rem] p-0 overflow-hidden border-none shadow-[0_0_60px_rgba(30,64,175,0.3)] animate-in zoom-in-95 duration-300 [&>button]:bg-white/10 [&>button]:border [&>button]:border-white/20 [&>button]:text-white [&>button]:hover:bg-white/20 [&>button]:rounded-full [&>button]:p-2.5 [&>button]:top-5 [&>button]:right-5 [&>button>svg]:w-5 [&>button>svg]:h-5"
            >
                <div className="relative overflow-hidden min-h-[550px] flex flex-col bg-gradient-to-br from-[#1a1c2c] via-[#1a2040] to-[#1a1c2c]">

                    {/* ═══════════ Decoraciones de fondo ═══════════ */}
                    <div className="absolute top-[-10%] left-[-10%] w-40 h-40 rounded-full blur-3xl animate-pulse bg-blue-500/15" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-40 h-40 rounded-full blur-3xl animate-pulse delay-700 bg-yellow-500/15" />
                    <div className="absolute top-[40%] right-[-5%] w-24 h-24 rounded-full blur-2xl animate-pulse delay-300 bg-primary/10" />

                    {/* ═══════════ Contenido ═══════════ */}
                    <div className="relative z-10 p-8 flex-1 flex flex-col">

                        {/* Badge superior */}
                        <div className={`transition-all duration-500 ${showContent ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
                            <div className="flex items-center mb-6">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border bg-yellow-500/10 border-yellow-500/20 text-yellow-200 backdrop-blur-md">
                                    {/* Efecto de brillo shimmer */}
                                    <Gem className="w-3.5 h-3.5 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                                        Plan Exclusive
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Ícono Central con Corona */}
                        <div className={`transition-all duration-700 delay-100 ${showContent ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}>
                            <div className="flex justify-center mb-5">
                                <div className="relative inline-block">
                                    <div className="absolute inset-0 blur-2xl opacity-40 animate-pulse bg-yellow-500" />
                                    <div className="relative p-4 rounded-2xl shadow-2xl bg-gradient-to-b from-yellow-400 via-orange-500 to-yellow-600">
                                        <Crown className="w-10 h-10 text-white drop-shadow-lg" />
                                    </div>
                                    <Sparkles className="absolute -top-2 -right-2 w-5 h-5 text-yellow-300 animate-pulse" />
                                </div>
                            </div>
                        </div>

                        {/* Título */}
                        <div className={`text-center mb-6 transition-all duration-700 delay-200 ${showContent ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}>
                            <h2 className="text-2xl font-black tracking-tight text-white leading-tight mb-1">
                                Multiplica tu{" "}
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-orange-400">
                                    Potencial
                                </span>
                            </h2>
                            <p className="text-[10px] text-blue-200/60 font-black uppercase tracking-[0.4em]">
                                {title || "Experiencia Elite"}
                            </p>
                        </div>

                        {/* Lista de Beneficios */}
                        <div className={`space-y-3 flex-1 transition-all duration-700 delay-300 ${showContent ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}>
                            {benefits.map((benefit, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/8 backdrop-blur-sm hover:bg-white/8 transition-all group"
                                    style={{ transitionDelay: `${300 + i * 80}ms` }}
                                >
                                    <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-primary/10 group-hover:border-primary/20 transition-all">
                                        <benefit.icon className="w-4 h-4 text-yellow-400 group-hover:scale-110 transition-transform" />
                                    </div>
                                    <div className="space-y-0.5 min-w-0">
                                        <h4 className="text-[10px] font-black text-yellow-200/90 uppercase tracking-wide">
                                            {benefit.label}
                                        </h4>
                                        <p className="text-[11px] font-medium text-gray-400 leading-tight">
                                            {benefit.text}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Botones de Acción */}
                        <div className={`pt-5 space-y-3 transition-all duration-700 delay-500 ${showContent ? "opacity-100" : "opacity-0"}`}>
                            {/* CTA Principal */}
                            <Button
                                disabled={isLoading}
                                onClick={async () => {
                                    try {
                                        setIsLoading(true);
                                        const { data, error } = await supabase.functions.invoke("mp-create-preference", {
                                            body: { 
                                                amount: 1, 
                                                currency: "USD",
                                                description: isAgent ? "Upgrade Elite Agent" : "Upgrade Elite Member",
                                                locationOrigin: window.location.origin
                                            }
                                        });

                                        if (error) throw error;
                                        if (data?.error) throw new Error(data.error);

                                        if (data?.init_point) {
                                            window.location.href = data.init_point;
                                        } else {
                                            throw new Error("No se pudo obtener el link de pago");
                                        }
                                    } catch (err: any) {
                                        console.error("Error al crear pago:", err);
                                        toast({
                                            title: "Error de pago",
                                            description: err.message || "Ocurrió un error al conectar con Mercado Pago.",
                                            variant: "destructive"
                                        });
                                    } finally {
                                        setIsLoading(false);
                                    }
                                }}
                            >
                                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:animate-shimmer" />
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Rocket className="w-5 h-5 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
                                )}
                                <span className="relative z-10 uppercase">
                                    {isLoading ? "PROCESANDO..." : "Activa tu Modo Pro"}
                                </span>
                            </Button>

                            {/* Botón Secundario */}
                            <button
                                onClick={onClose}
                                className="w-full py-3 text-[10px] text-gray-500 hover:text-blue-300 bg-white/3 hover:bg-white/5 border border-white/10 rounded-2xl transition-all font-black uppercase tracking-[0.3em] active:scale-95"
                            >
                                Explorar funciones gratis
                            </button>
                        </div>
                    </div>

                    {/* Footer discreto */}
                    <div className="p-3 text-center border-t bg-[#0f111a] border-white/5">
                        <p className="text-[9px] text-gray-600 font-bold uppercase tracking-[0.3em]">
                            {isAgent ? "👑 Elite Member Agent Edition" : "👑 Elite Member Premium Access"}
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

