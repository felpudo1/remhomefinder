import {
    Sheet,
    SheetContent,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Crown, Sparkles, Rocket, Zap, Shield, Gem, Star, X } from "lucide-react";

interface UpgradePlanModalProps {
    open: boolean;
    onClose: () => void;
    limit?: number;
    type?: "user" | "agent";
    title?: string;
    description?: string;
}

/**
 * UpgradePlanModal - Rediseño UX Pro "Elite Experience" v8 (Floating Side Drawer)
 * Se muestra como un lateral derecho flotante, ocupando 1/3 del ancho.
 * Mejoras: Sin X de cierre, botón de exploración con borde, Gem con brillo.
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
        <Sheet open={open} onOpenChange={onClose}>
            <SheetContent 
                side="right" 
                hideClose
                className="w-[85vw] sm:max-w-none sm:w-[35vw] p-0 border-none bg-transparent shadow-none transition-all duration-700 right-4 sm:right-4 top-4 bottom-4 h-[calc(100vh-2rem)] translate-x-[-2%] sm:translate-x-0"
            >
                {/* Contenedor Principal Flotante con Bordeado Curvo Total */}
                <div className="h-full flex flex-col bg-white rounded-[3rem] overflow-hidden shadow-[-20px_20px_80px_rgba(0,0,0,0.2)] border border-white/10 relative">
                    
                    {/* 🌌 Cabecera: Royal Blue (Proporción optimizada) */}
                    <div className="h-[32%] bg-gradient-to-br from-[#1E40AF] to-[#3B82F6] p-10 text-white relative flex flex-col items-center justify-center text-center overflow-hidden">
                        
                        {/* Elementos Decorativos: Corona de Fondo Submarina (Reducida 50%) */}
                        <Crown className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[18rem] h-[18rem] rotate-12 opacity-10 text-white" />
                        
                        {/* Efectos de Iluminación UX Pro */}
                        <div className="absolute top-0 right-0 w-[150%] h-[150%] bg-gradient-to-br from-white/5 to-transparent rounded-full -mr-[50%] -mt-[50%]" />
                        <Sparkles className="absolute top-10 right-10 w-6 h-6 text-yellow-300 opacity-50 animate-pulse" />

                        <div className="relative z-10 space-y-4">
                            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-xl px-5 py-2 rounded-full border border-white/20 shadow-lg relative overflow-hidden group">
                                {/* ✨ Efecto de Brillo (Shimmer) en la gema */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-100%] animate-shimmer" />
                                <Gem className="w-4 h-4 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]" />
                                <span className="text-[11px] font-black uppercase tracking-[0.3em] text-yellow-100 italic">Plan Exclusive</span>
                            </div>

                            <div className="space-y-1">
                                <h2 className="text-3xl lg:text-4xl font-black leading-[1.1] uppercase tracking-tighter">
                                    Multiplica tu <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-100 via-yellow-300 to-yellow-100 animate-shimmer">Potencial</span>
                                </h2>
                                <p className="text-blue-100/90 text-[10px] font-black uppercase tracking-[0.4em]">
                                    {title || "Experiencia Elite"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* ✨ Cuerpo: Clean Luxury (Fondo blanco optimizado) */}
                    <div className="flex-1 p-8 bg-white flex flex-col justify-between relative overflow-hidden">
                        
                        {/* Lista de Beneficios */}
                        <div className="space-y-5 pt-2">
                            {benefits.map((benefit, i) => (
                                <div 
                                    key={i} 
                                    className="flex items-center gap-4 group transition-transform duration-300 hover:translate-x-1"
                                    style={{ animationDelay: `${i * 100}ms` }}
                                >
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 shadow-sm group-hover:bg-primary/5 group-hover:border-primary/20 transition-all duration-500">
                                        <benefit.icon className="w-5 h-5 text-primary transition-transform group-hover:scale-110" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-wide">{benefit.label}</h4>
                                        <p className="text-[11px] font-semibold text-slate-500 leading-tight">{benefit.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Sección de Acción: Siempre visible sin scroll */}
                        <div className="space-y-5 pt-4">
                            <Button
                                className="w-full h-16 rounded-[1.5rem] text-lg font-black shadow-[0_15px_30px_rgba(30,64,175,0.2)] hover:shadow-[0_20px_40px_rgba(30,64,175,0.3)] transition-all bg-gradient-to-br from-yellow-400 via-orange-500 to-yellow-600 hover:from-yellow-300 hover:to-orange-500 text-white border-none flex items-center justify-center gap-3 active:scale-95 group relative overflow-hidden"
                                onClick={() => {
                                    window.open("https://wa.me/+5491112345678?text=Hola!%20Quiero%20información%20sobre%20el%20Plan%20Premium", "_blank");
                                }}
                            >
                                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:animate-shimmer" />
                                <Rocket className="w-6 h-6 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
                                <span className="relative z-10 uppercase">Activa tu Modo Pro</span>
                            </Button>
                            
                            <div className="text-center space-y-4">
                                <button
                                    onClick={onClose}
                                    className="w-full py-4 text-[10px] text-slate-500 hover:text-primary hover:bg-slate-50 border border-slate-200 rounded-2xl transition-all font-black uppercase tracking-[0.3em] active:scale-95 shadow-sm"
                                >
                                    Explorar funciones gratis
                                </button>
                                
                                <div className="pt-4 border-t border-slate-100">
                                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.5em] opacity-60">
                                        {isAgent ? "Elite Member Agent Edition" : "Elite Member Premium Access"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
