import { Sparkles, Building2, ShieldCheck } from "lucide-react";

interface AgentWelcomeProps {
    userName?: string;
}

export const AgentWelcome = ({ userName }: AgentWelcomeProps) => {
    return (
        <div className="flex flex-col items-center justify-center text-center py-12 md:py-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="w-24 h-24 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent rounded-full flex items-center justify-center mb-8 relative shadow-inner">
                <Building2 className="w-10 h-10 text-primary drop-shadow-sm" />
                <div className="absolute -top-1 -right-1 w-8 h-8 bg-yellow-400/20 backdrop-blur-sm rounded-full flex items-center justify-center animate-pulse border border-yellow-400/30">
                    <Sparkles className="w-4 h-4 text-yellow-600" />
                </div>
            </div>

            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
                ¡Bienvenido a <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">nuestra red</span>{userName ? `, ${userName.split(' ')[0]}` : ''}!
            </h2>
            <p className="text-muted-foreground max-w-lg mb-12 text-sm md:text-base leading-relaxed">
                Gracias por elegirnos para potenciar tus ventas y escalar tus propiedades. Tu cuenta fue creada exitosamente y actualmente se encuentra en un rápido proceso de revisión.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl w-full text-left">
                <div className="p-6 rounded-3xl bg-card border border-border shadow-sm flex flex-col sm:flex-row gap-4 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-foreground mb-1.5 flex items-center gap-2">
                            Entorno Seguro
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Validamos cada agencia al registrarse para garantizar una red confiable, profesional y de alta calidad para todos nuestros usuarios.
                        </p>
                    </div>
                </div>

                <div className="p-6 rounded-3xl bg-card border border-border shadow-sm flex flex-col sm:flex-row gap-4 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Sparkles className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-foreground mb-1.5 flex items-center gap-2">
                            Nuevas Herramientas
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Pronto tendrás acceso a creación de avisos mediante IA, estadísticas avanzadas de mercado, gestión de portfolio y mucho más.
                        </p>
                    </div>
                </div>
            </div>

            <div className="mt-12 inline-flex items-center justify-center px-6 py-3 rounded-full bg-muted/50 text-sm text-muted-foreground border border-border/50">
                Te notificaremos por correo electrónico apenas tu cuenta sea activada.
            </div>
        </div>
    );
};
