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
import {
    PREMIUM_PLAN_PRICE_KEY, PREMIUM_PLAN_PRICE_DEFAULT,
    PREMIUM_PLAN_CURRENCY_KEY, PREMIUM_PLAN_CURRENCY_DEFAULT,
    AGENT_MONTHLY_PRICE_KEY, AGENT_MONTHLY_PRICE_DEFAULT,
    AGENT_ANNUAL_PRICE_KEY, AGENT_ANNUAL_PRICE_DEFAULT,
    AGENT_SUB_CURRENCY_KEY, AGENT_SUB_CURRENCY_DEFAULT,
} from "@/lib/config-keys";

interface UpgradePlanModalProps {
    open: boolean;
    onClose: () => void;
    limit?: number;
    type?: "user" | "agent";
    title?: string;
    description?: string;
}

export function UpgradePlanModal({ 
    open, 
    onClose, 
    type = "user",
    title,
}: UpgradePlanModalProps) {
    const isAgent = type === "agent";
    const [showContent, setShowContent] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedInterval, setSelectedInterval] = useState<"monthly" | "yearly">("monthly");
    const { toast } = useToast();

    // User one-time payment config
    const { value: configPrice } = useSystemConfig(PREMIUM_PLAN_PRICE_KEY, PREMIUM_PLAN_PRICE_DEFAULT);
    const { value: configCurrency } = useSystemConfig(PREMIUM_PLAN_CURRENCY_KEY, PREMIUM_PLAN_CURRENCY_DEFAULT);

    // Agent subscription config
    const { value: agentMonthlyPrice } = useSystemConfig(AGENT_MONTHLY_PRICE_KEY, AGENT_MONTHLY_PRICE_DEFAULT);
    const { value: agentAnnualPrice } = useSystemConfig(AGENT_ANNUAL_PRICE_KEY, AGENT_ANNUAL_PRICE_DEFAULT);
    const { value: agentCurrency } = useSystemConfig(AGENT_SUB_CURRENCY_KEY, AGENT_SUB_CURRENCY_DEFAULT);

    useEffect(() => {
        if (open) {
            setShowContent(false);
            const timer = setTimeout(() => setShowContent(true), 100);
            return () => clearTimeout(timer);
        }
    }, [open]);

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

    const handleUserPayment = async () => {
        try {
            setIsLoading(true);
            const { data, error } = await supabase.functions.invoke("mp-create-preference", {
                body: { 
                    amount: Number(configPrice) || 1, 
                    currency: configCurrency || "USD",
                    description: "Upgrade Elite Member",
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
            toast({ title: "Error de pago", description: err.message || "Ocurrió un error al conectar con Mercado Pago.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleAgentSubscription = async () => {
        try {
            setIsLoading(true);
            const price = selectedInterval === "yearly" ? agentAnnualPrice : agentMonthlyPrice;
            const { data, error } = await supabase.functions.invoke("mp-create-subscription", {
                body: {
                    amount: Number(price) || 15,
                    currency: agentCurrency || "USD",
                    interval: selectedInterval,
                    description: selectedInterval === "yearly" 
                        ? "Suscripción Anual Agente Premium" 
                        : "Suscripción Mensual Agente Premium",
                    locationOrigin: window.location.origin
                }
            });
            if (error) throw error;
            if (data?.error) throw new Error(data.error);
            if (data?.init_point) {
                window.location.href = data.init_point;
            } else {
                throw new Error("No se pudo obtener el link de suscripción");
            }
        } catch (err: any) {
            console.error("Error al crear suscripción:", err);
            toast({ title: "Error de suscripción", description: err.message || "Ocurrió un error al conectar con Mercado Pago.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const displayPrice = isAgent
        ? (selectedInterval === "yearly" ? agentAnnualPrice : agentMonthlyPrice)
        : configPrice;
    const displayCurrency = isAgent ? agentCurrency : configCurrency;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent
                className="max-w-lg rounded-[2rem] p-0 overflow-hidden border-none shadow-[0_0_60px_rgba(30,64,175,0.3)] animate-in zoom-in-95 duration-300 [&>button]:bg-white/10 [&>button]:border [&>button]:border-white/20 [&>button]:text-white [&>button]:hover:bg-white/20 [&>button]:rounded-full [&>button]:p-2.5 [&>button]:top-5 [&>button]:right-5 [&>button>svg]:w-5 [&>button>svg]:h-5"
            >
                <div className="relative overflow-hidden min-h-[550px] flex flex-col bg-gradient-to-br from-[#1a1c2c] via-[#1a2040] to-[#1a1c2c]">

                    {/* Decoraciones de fondo */}
                    <div className="absolute top-[-10%] left-[-10%] w-40 h-40 rounded-full blur-3xl animate-pulse bg-blue-500/15" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-40 h-40 rounded-full blur-3xl animate-pulse delay-700 bg-yellow-500/15" />
                    <div className="absolute top-[40%] right-[-5%] w-24 h-24 rounded-full blur-2xl animate-pulse delay-300 bg-primary/10" />

                    {/* Contenido */}
                    <div className="relative z-10 p-8 flex-1 flex flex-col">

                        {/* Badge */}
                        <div className={`transition-all duration-500 ${showContent ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
                            <div className="flex items-center mb-6">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border bg-yellow-500/10 border-yellow-500/20 text-yellow-200 backdrop-blur-md">
                                    <Gem className="w-3.5 h-3.5 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                                        {isAgent ? "Plan Agente Pro" : "Plan Exclusive"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Ícono Central */}
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
                        <div className={`text-center mb-4 transition-all duration-700 delay-200 ${showContent ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}>
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

                        {/* Interval Selector (solo agentes) */}
                        {isAgent && (
                            <div className={`flex justify-center gap-2 mb-4 transition-all duration-700 delay-250 ${showContent ? "opacity-100" : "opacity-0"}`}>
                                <button
                                    onClick={() => setSelectedInterval("monthly")}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                                        selectedInterval === "monthly"
                                            ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/40"
                                            : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10"
                                    }`}
                                >
                                    Mensual · {agentMonthlyPrice} {agentCurrency}
                                </button>
                                <button
                                    onClick={() => setSelectedInterval("yearly")}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all relative ${
                                        selectedInterval === "yearly"
                                            ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/40"
                                            : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10"
                                    }`}
                                >
                                    Anual · {agentAnnualPrice} {agentCurrency}
                                    <span className="absolute -top-2 -right-2 text-[8px] bg-green-500 text-white px-1.5 py-0.5 rounded-full font-black">
                                        AHORRO
                                    </span>
                                </button>
                            </div>
                        )}

                        {/* Beneficios */}
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

                        {/* Botones */}
                        <div className={`pt-5 space-y-3 transition-all duration-700 delay-500 ${showContent ? "opacity-100" : "opacity-0"}`}>
                            <Button
                                disabled={isLoading}
                                onClick={isAgent ? handleAgentSubscription : handleUserPayment}
                            >
                                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:animate-shimmer" />
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Rocket className="w-5 h-5 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
                                )}
                                <span className="relative z-10 uppercase">
                                    {isLoading 
                                        ? "PROCESANDO..." 
                                        : isAgent 
                                            ? `Suscribirme · ${displayPrice} ${displayCurrency}/${selectedInterval === "yearly" ? "año" : "mes"}`
                                            : "Activa tu Modo Pro"
                                    }
                                </span>
                            </Button>

                            <button
                                onClick={onClose}
                                className="w-full py-3 text-[10px] text-gray-500 hover:text-blue-300 bg-white/3 hover:bg-white/5 border border-white/10 rounded-2xl transition-all font-black uppercase tracking-[0.3em] active:scale-95"
                            >
                                Explorar funciones gratis
                            </button>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-3 text-center border-t bg-[#0f111a] border-white/5">
                        <p className="text-[9px] text-gray-600 font-bold uppercase tracking-[0.3em]">
                            {isAgent ? "👑 Elite Agent · Suscripción Recurrente" : "👑 Elite Member Premium Access"}
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
