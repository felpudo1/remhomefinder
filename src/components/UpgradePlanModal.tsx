import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Crown, Sparkles, Rocket } from "lucide-react";

interface UpgradePlanModalProps {
    open: boolean;
    onClose: () => void;
    maxSaves: number;
}

export function UpgradePlanModal({ open, onClose, maxSaves }: UpgradePlanModalProps) {
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
                {/* Cabecera con Degradado Premium */}
                <div className="bg-gradient-to-br from-primary via-primary/90 to-blue-600 p-8 text-white relative">
                    <div className="absolute top-4 right-4 opacity-20">
                        <Crown className="w-24 h-24 rotate-12" />
                    </div>

                    <div className="relative z-10 space-y-2">
                        <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                            <Sparkles className="w-3 h-3" />
                            Plan Premium
                        </div>
                        <DialogTitle className="text-3xl font-extrabold leading-tight">
                            Alcanzaste el límite de tu lista
                        </DialogTitle>
                        <DialogDescription className="text-blue-100 text-sm font-medium">
                            Actualmente podés tener hasta {maxSaves} propiedades en tu lista personal.
                        </DialogDescription>
                    </div>
                </div>

                {/* Cuerpo del Modal */}
                <div className="p-8 bg-card space-y-6">
                    <div className="space-y-4">
                        <p className="text-foreground/80 text-sm font-medium">
                            Pasate a **Premium** para armar tu lista de deseos completa y acceder a herramientas avanzadas:
                        </p>

                        <ul className="space-y-3">
                            {[
                                "Guardados ilimitados en tu lista personal",
                                "Estadísticas de evolución detalladas",
                                "Scraping prioritario y sin límites diarios",
                                "Soporte técnico preferencial",
                            ].map((feature, i) => (
                                <li key={i} className="flex items-center gap-3 text-sm text-foreground/70">
                                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                                    </div>
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="pt-4 space-y-3">
                        <Button
                            className="w-full h-14 rounded-2xl text-md font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform flex items-center gap-2"
                            onClick={() => {
                                // Aquí iría la lógica de pago o contacto
                                window.open("https://wa.me/+5491112345678?text=Hola!%20Quiero%20información%20sobre%20el%20Plan%20Premium", "_blank");
                            }}
                        >
                            <Rocket className="w-5 h-5" />
                            ¡Quiero ser Premium ahora!
                        </Button>
                        <button
                            onClick={onClose}
                            className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors font-medium py-2"
                        >
                            Tal vez más tarde
                        </button>
                    </div>
                </div>

                <div className="bg-muted/50 p-4 text-center border-t border-border">
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
                        Diseñado para buscadores exigentes.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
