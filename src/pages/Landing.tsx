import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Users, Search, CheckCircle2, ArrowRight, Building2, Store } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const Landing = () => {
    const navigate = useNavigate();
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setIsLoggedIn(!!session);
        });
    }, []);

    return (
        <div className="min-h-screen bg-background selection:bg-primary/20">
            {/* Navbar Minimalista */}
            <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center">
                            <Home className="w-4 h-4 text-primary-foreground" />
                        </div>
                        <span className="font-bold text-xl tracking-tight">HomeFinder</span>
                    </div>
                    <div className="flex gap-4">
                        {isLoggedIn ? (
                            <Button onClick={() => navigate("/dashboard")} className="rounded-xl">
                                Ir al Dashboard
                                <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                        ) : (
                            <Button onClick={() => navigate("/auth")} className="rounded-xl">
                                Iniciar Sesión
                            </Button>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden text-center">
                {/* Gradiantes de fondo decorativos */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[500px] bg-primary/5 blur-[120px] rounded-full -z-10" />

                <div className="max-w-4xl mx-auto px-6 space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        NUEVA FORMA DE BUSCAR
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground leading-[1.1]">
                        Buscá en <span className="text-primary italic">equipo</span>,<br />
                        decidí en <span className="italic">familia</span>.
                    </h1>

                    <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        El primer organizador grupal inmobiliario para encontrar tu próximo alquiler o compra sin estrés.
                    </p>

                    <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button
                            size="lg"
                            onClick={() => navigate(isLoggedIn ? "/dashboard" : "/auth")}
                            className="h-14 px-8 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all border-b-4 border-primary-foreground/20 active:border-b-0 active:translate-y-1"
                        >
                            Comenzar gratis
                            <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-24 bg-muted/30">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16 space-y-4">
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Todo lo que necesitás en un solo lugar</h2>
                        <p className="text-muted-foreground max-w-xl mx-auto">Diseñado para familias y grupos que quieren simplificar el proceso de encontrar un nuevo hogar.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Users className="w-6 h-6 text-primary" />}
                            title="Grupos Familiares"
                            description="Invitá a tu pareja o familia para centralizar todas las propiedades que les interesan."
                        />
                        <FeatureCard
                            icon={<Search className="w-6 h-6 text-primary" />}
                            title="Organizador Inteligente"
                            description="Mantené el estado de cada propiedad: Visitas coordinadas, fotos y comentarios grupales."
                        />
                        <FeatureCard
                            icon={<Store className="w-6 h-6 text-primary" />}
                            title="HFMarket"
                            description="Accedé a listados exclusivos publicados directamente por agentes e inmobiliarias."
                        />
                    </div>
                </div>
            </section>

            {/* Trust Quote */}
            <section className="py-24 border-t border-border">
                <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
                    <div className="flex justify-center gap-1">
                        {[...Array(5)].map((_, i) => (
                            <CheckCircle2 key={i} className="w-5 h-5 text-amber-500 fill-amber-500" />
                        ))}
                    </div>
                    <p className="text-2xl md:text-3xl font-medium italic text-foreground/90">
                        "HomeFinder cambió nuestra forma de buscar depto. Antes nos perdíamos entre links de WhatsApp, ahora decidimos todo en la app."
                    </p>
                    <div className="text-sm text-muted-foreground font-medium">— Familia Martínez, usuarios felices.</div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t border-border bg-card">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center">
                            <Home className="w-3 h-3 text-primary-foreground" />
                        </div>
                        <span className="font-bold text-lg">HomeFinder</span>
                    </div>
                    <p className="text-sm text-muted-foreground">© 2024 HomeFinder. El primer organizador grupal inmobiliario.</p>
                    <div className="flex gap-6 text-sm text-muted-foreground font-medium">
                        <a href="#" className="hover:text-primary">Términos</a>
                        <a href="#" className="hover:text-primary">Privacidad</a>
                        <a href="#" className="hover:text-primary">Contacto</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
    <div className="bg-card p-8 rounded-3xl border border-border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
        <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center mb-6">
            {icon}
        </div>
        <h3 className="text-xl font-bold mb-3">{title}</h3>
        <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
);

export default Landing;
