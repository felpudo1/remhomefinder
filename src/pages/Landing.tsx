import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Users, Search, CheckCircle2, ArrowRight, Store } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ROUTES, ROLES } from "@/lib/constants";
import { useSystemConfig } from "@/hooks/useSystemConfig";
import { APP_BRAND_NAME_DEFAULT, APP_BRAND_NAME_KEY } from "@/lib/config-keys";
import { Footer } from "@/components/Footer";
import { AgenciesCarousel } from "@/components/AgenciesCarousel";

const Landing = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const { value: appBrandName } = useSystemConfig(APP_BRAND_NAME_KEY, APP_BRAND_NAME_DEFAULT);

    useEffect(() => {
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            if (session?.user) {
                // Obtener roles para redirigir a la página correcta
                const { data: rolesData } = await supabase
                    .from("user_roles")
                    .select("role")
                    .eq("user_id", session.user.id);
                const roles = rolesData?.map(r => r.role) || [];

                if (roles.includes(ROLES.SYSADMIN)) {
                    navigate(ROUTES.ADMIN_INFRA, { replace: true });
                } else if (roles.includes(ROLES.ADMIN)) {
                    navigate(ROUTES.ADMIN, { replace: true });
                } else if (roles.includes(ROLES.AGENCY) || roles.includes(ROLES.AGENCY_MEMBER)) {
                    navigate(ROUTES.AGENCY, { replace: true });
                } else {
                    navigate(ROUTES.DASHBOARD, { replace: true });
                }
                return;
            }
            setIsCheckingAuth(false);
            setIsLoggedIn(false);
        });
    }, [navigate]);

    if (isCheckingAuth) return null;

    return (
        <div className="min-h-screen selection:bg-primary/20">
            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center">
                            <Home className="w-4 h-4 text-primary-foreground" />
                        </div>
                        <span className="font-bold text-xl tracking-tight">{appBrandName}</span>
                    </div>
                    <div className="flex gap-4">
                        {isLoggedIn ?
                            <Button onClick={() => navigate(ROUTES.DASHBOARD)} className="rounded-xl">
                                Ir al Dashboard
                                <ArrowRight className="ml-2 w-4 h-4" />
                            </Button> :

                            <Button
                                onClick={() => {
                                    const ref = searchParams.get("ref") || searchParams.get("agente");
                                    navigate(ref ? `${ROUTES.AUTH}?ref=${ref}` : ROUTES.AUTH);
                                }}
                                className="rounded-xl"
                            >
                                Iniciar Sesión
                            </Button>
                        }
                    </div>
                </div>
            </nav>

            {/* Hero Section con imagen de fondo */}
            <section className="relative pt-32 pb-20 md:pt-48 md:pb-36 overflow-hidden text-center">
                {/* Fondo Pro: Combinación de desenfoque y zoom para matar áreas 'muertas' de la foto */}
                <div className="absolute inset-0 -z-20 overflow-hidden bg-background">
                    <img
                        src="/assets/images/03-04%20at%2021.28.041.jpeg"
                        alt=""
                        className="w-full h-full object-cover blur-3xl opacity-40 scale-150 rotate-[-2deg]"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative w-full h-full max-w-[1000px] overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.15)] ring-1 ring-border/20">
                            <img
                                src="/assets/images/03-04%20at%2021.28.041.jpeg"
                                alt="Background"
                                className="w-full h-full object-cover md:object-[center_60%] scale-[1.3] brightness-[1.03] contrast-[1.05]"
                            />
                            {/* Overlay de gradiente lateral pro para suavizar el corte del centro */}
                            <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-background to-transparent" />
                            <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-background to-transparent" />
                        </div>
                    </div>
                </div>
                <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/91 via-transparent to-background" />

                <div className="max-w-4xl mx-auto px-6 space-y-6">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] uppercase font-black tracking-[0.1em] animate-in fade-in slide-in-from-bottom-5 duration-700">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        Organizá tu búsqueda inmobiliaria
                    </div>

                    {/* Texto secundario movido arriba con delay (UX Pro) */}
                    <p className="text-base md:text-xl text-primary font-bold max-w-2xl mx-auto leading-relaxed opacity-90 animate-in fade-in slide-in-from-bottom-5 duration-1000 delay-200">
                        Compartí, comentá y calificá las propiedades para tomar la mejor decisión.
                        <br className="hidden md:block" /> La misma visión, el mismo objetivo.
                    </p>

                    <h1 className="text-5xl md:text-[80px] font-black tracking-tighter text-white leading-[0.95] drop-shadow-sm animate-in fade-in slide-in-from-bottom-5 duration-1000 delay-500">
                        Tu próximo hogar <br />
                        <span className="text-primary/10 bg-clip-text bg-gradient-to-b from-white to-white/70">se elige en equipo.</span>
                        <br />
                        Se disfruta en familia.
                    </h1>
                </div>
            </section>

            {/* Carrusel de Logos de Agencias (Integración Senior) */}
            <AgenciesCarousel className="-mt-16 md:mt-0" />

            {/* Features Grid */}
            <section className="py-24 bg-muted/30">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16 space-y-4">
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Herramientas profesionales para tu búsqueda</h2>
                        <p className="text-muted-foreground max-w-xl mx-auto">Cada funcionalidad está pensada para que vos y tu grupo tomen decisiones más rápidas y con mejor información.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Users className="w-6 h-6 text-primary" />}
                            title="Grupos Familiares"
                            description="Invitá a tu pareja o familia para centralizar todas las propiedades que les interesan." />

                        <FeatureCard
                            icon={<Search className="w-6 h-6 text-primary" />}
                            title="Organizador Inteligente"
                            description="Mantené el estado de cada propiedad: Visitas coordinadas, fotos y comentarios grupales." />

                        <FeatureCard
                            icon={<Store className="w-6 h-6 text-primary" />}
                            title="HFMarket"
                            description="Accedé a listados exclusivos publicados directamente por agentes e inmobiliarias." />

                    </div>
                </div>
            </section>

            {/* Testimonios rotativos */}
            <TestimonialCarousel />

            <Footer showDbStatus />
        </div>);

};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string; }) =>
    <div className="bg-card p-8 rounded-3xl border border-border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
        <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center mb-6">
            {icon}
        </div>
        <h3 className="text-xl font-bold mb-3">{title}</h3>
        <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>;


const testimonials = [
    {
        quote: "Pasamos de tener 50 links sueltos en WhatsApp a organizar todo en un solo lugar. La decisión fue mucho más fácil.",
        author: "Familia Rodríguez",
        location: "Pocitos, Montevideo"
    },
    {
        quote: "Con mi pareja buscábamos alquiler en Cordón y Parque Rodó. Esta app nos salvó de la locura de coordinar todo por chat.",
        author: "Martín y Lucía",
        location: "Cordón, Montevideo"
    },
    {
        quote: "Como agente, publicar en HFMarket me conecta directo con familias que realmente están buscando. Sin intermediarios.",
        author: "Carolina Méndez",
        location: "Agente inmobiliaria, Punta del Este"
    },
    {
        quote: "Nos mudamos desde el interior y no conocíamos los barrios. Poder comparar todo en una sola app nos dio tranquilidad.",
        author: "Familia Pereira",
        location: "Malvín, Montevideo"
    },
    {
        quote: "Antes perdíamos propiedades porque no nos poníamos de acuerdo a tiempo. Ahora todos opinamos en el momento.",
        author: "Diego y Valentina",
        location: "Carrasco, Montevideo"
    }];


const TestimonialCarousel = () => {
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrent((prev) => (prev + 1) % testimonials.length);
        }, 10000);
        return () => clearInterval(timer);
    }, []);

    const t = testimonials[current];

    return (
        <section className="py-24 border-t border-border overflow-hidden">
            <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
                <div className="flex justify-center gap-1">
                    {[...Array(5)].map((_, i) =>
                        <CheckCircle2 key={i} className="w-5 h-5 text-primary fill-primary/20" />
                    )}
                </div>
                <div className="min-h-[140px] flex flex-col items-center justify-center">
                    <p
                        key={current}
                        className="text-2xl md:text-3xl font-medium italic text-foreground/90 animate-in fade-in slide-in-from-right-8 duration-500">

                        "{t.quote}"
                    </p>
                </div>
                <div
                    key={`author-${current}`}
                    className="text-sm text-muted-foreground font-medium animate-in fade-in duration-700">

                    — {t.author}, {t.location}
                </div>
                <div className="flex justify-center gap-2 pt-2">
                    {testimonials.map((_, i) =>
                        <button
                            key={i}
                            onClick={() => setCurrent(i)}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${i === current ? "bg-primary w-6" : "bg-border hover:bg-muted-foreground/40"}`
                            }
                            aria-label={`Testimonio ${i + 1}`} />

                    )}
                </div>
            </div>
        </section>);

};

export default Landing;