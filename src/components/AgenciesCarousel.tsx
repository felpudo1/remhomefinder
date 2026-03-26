import { Building2, Home, Search, Shield, Users } from "lucide-react";

const agencies = [
  { name: "ACSA", color: "text-blue-600" },
  { name: "Remax Focus", color: "text-red-600" },
  { name: "Propiedades.uy", color: "text-green-600" },
  { name: "InmoGroup", color: "text-purple-600" },
  { name: "Castillo Prop", color: "text-amber-600" },
  { name: "Uruguay Homes", color: "text-sky-600" },
];

/**
 * AgenciesCarousel - UX Pro Senior Design
 * Carrusel infinito con desplazamiento suave y efecto hover de color.
 */
export const AgenciesCarousel = ({ className }: { className?: string }) => {
  // Duplicamos el array para el efecto de scroll infinito
  const infiniteAgencies = [...agencies, ...agencies, ...agencies];

  return (
    <div className={`w-full py-8 md:py-12 overflow-hidden bg-background/50 border-y border-border/50 relative z-40 ${className || ""}`}>
      <div className="max-w-7xl mx-auto px-6 mb-6">
        <p className="text-center text-[10px] uppercase tracking-[0.2em] font-bold text-black mb-8">
          Grandes agencias que confían en nosotros
        </p>
      </div>

      <div className="relative flex overflow-x-hidden">
        {/* Usamos un div con animación de scroll infinito vía CSS puro */}
        <div className="animate-marquee flex gap-12 items-center whitespace-nowrap py-4">
          {infiniteAgencies.map((agency, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-8 group cursor-default transition-all duration-500"
            >
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors duration-500">
                <Building2 className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors duration-500" />
              </div>
              <span className="text-xl font-black tracking-tighter text-muted-foreground/40 group-hover:text-foreground transition-all duration-500 saturate-0 group-hover:saturate-100">
                {agency.name}
              </span>
            </div>
          ))}
        </div>

        {/* Gradientes laterales para suavizar el corte (Glassmorphism UX Pro) */}
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};
