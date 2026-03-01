import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Users, Search, CheckCircle2, ArrowRight, Building2, Store, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import authBg from "@/assets/auth-bg.jpg";

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
            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center">
                            <Home className="w-4 h-4 text-primary-foreground" />
                        </div>
                        <span className="font-bold text-xl tracking-tight">HomeFinder</span>
                    </div>
                    <div className="flex gap-4">
                        {isLoggedIn ?
            <Button onClick={() => navigate("/dashboard")} className="rounded-xl">
                                Ir al Dashboard
                                <ArrowRight className="ml-2 w-4 h-4" />
                            </Button> :

            <Button onClick={() => navigate("/auth")} className="rounded-xl">
                                Iniciar Sesión
                            </Button>
            }
                    </div>
                </div>
            </nav>

            {/* Hero Section con imagen de fondo */}
            <section className="relative pt-32 pb-20 md:pt-48 md:pb-36 overflow-hidden text-center">
                {/* Imagen de fondo */}
                <div className="absolute inset-0 -z-20">
                    <img src={authBg} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/85 via-background/70 to-background" />

                <div className="max-w-4xl mx-auto px-6 space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/15 border border-primary/25 text-primary text-xs font-bold uppercase tracking-wider">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        Organizá tu búsqueda inmobiliaria
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground leading-[1.1]">
                        Tu próximo hogar,<br />
                        <span className="text-primary">una decisión</span> en equipo.
                    </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">Compartí, comentá y calificá las propiedades para tomar la mejor decisión familiar — todo desde una sola plataforma.</p>

                    <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button
              size="lg"
              onClick={() => navigate(isLoggedIn ? "/dashboard" : "/auth")}
              className="h-14 px-8 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all border-b-4 border-primary-foreground/20 active:border-b-0 active:translate-y-1">

                            Empezar ahora — es gratis
                            <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                    </div>

                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                        <Shield className="w-3.5 h-3.5" /> Sin tarjeta de crédito · Configurá en 2 minutos
                    </p>
                </div>
            </section>

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
        </div>);

};

const FeatureCard = ({ icon, title, description }: {icon: React.ReactNode;title: string;description: string;}) =>
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
  quote: "Con mi pareja buscábamos alquiler en Cordón y Parque Rodó. HomeFinder nos salvó de la locura de coordinar todo por chat.",
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
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
            i === current ? "bg-primary w-6" : "bg-border hover:bg-muted-foreground/40"}`
            }
            aria-label={`Testimonio ${i + 1}`} />

          )}
                </div>
            </div>
        </section>);

};

export default Landing;