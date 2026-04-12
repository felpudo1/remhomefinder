import { Building2 } from "lucide-react";
import { useLandingAgencies, type LandingAgency } from "@/hooks/useLandingAgencies";

/**
 * AgenciesCarousel - Dos carruseles infinitos con datos de BD.
 * Carrusel 1: scroll → derecha. Carrusel 2: scroll ← izquierda.
 */
export const AgenciesCarousel = ({ className }: { className?: string }) => {
  const { data: agencies = [] } = useLandingAgencies();

  const row1 = agencies.filter(a => a.carousel_row === 1);
  const row2 = agencies.filter(a => a.carousel_row === 2);

  // No mostrar si no hay agencias
  if (row1.length === 0 && row2.length === 0) return null;

  return (
    <div className={`w-full py-8 md:py-12 overflow-hidden bg-background/50 border-y border-border/50 relative z-40 ${className || ""}`}>
      <div className="max-w-7xl mx-auto px-6 mb-6">
        <p className="text-center text-[10px] uppercase tracking-[0.2em] font-bold text-black mb-8">
          Grandes agencias que confían en nosotros
        </p>
      </div>

      {row1.length > 0 && <CarouselStrip agencies={row1} direction="right" />}
      {row2.length > 0 && <CarouselStrip agencies={row2} direction="left" className="mt-6" />}

      <style>{`
        @keyframes marquee-right {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
        @keyframes marquee-left {
          0% { transform: translateX(-33.33%); }
          100% { transform: translateX(0); }
        }
        .animate-marquee-right {
          animation: marquee-right 30s linear infinite;
        }
        .animate-marquee-left {
          animation: marquee-left 30s linear infinite;
        }
        .animate-marquee-right:hover,
        .animate-marquee-left:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};

const CarouselStrip = ({
  agencies,
  direction,
  className,
}: {
  agencies: LandingAgency[];
  direction: "left" | "right";
  className?: string;
}) => {
  // Triplicamos para scroll infinito
  const infinite = [...agencies, ...agencies, ...agencies];

  return (
    <div className={`relative flex overflow-x-hidden ${className || ""}`}>
      <div className={`flex gap-12 items-center whitespace-nowrap py-4 ${direction === "right" ? "animate-marquee-right" : "animate-marquee-left"}`}>
        {infinite.map((agency, i) => (
          <div
            key={`${agency.id}-${i}`}
            className="flex items-center gap-3 px-8 group cursor-default transition-all duration-500"
          >
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors duration-500 overflow-hidden">
              {agency.logo_url ? (
                <img
                  src={agency.logo_url}
                  alt={agency.name}
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
              ) : (
                <Building2 className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors duration-500" />
              )}
            </div>
            <span className="text-xl font-black tracking-tighter text-muted-foreground/40 group-hover:text-foreground transition-all duration-500 saturate-0 group-hover:saturate-100">
              {agency.name}
            </span>
          </div>
        ))}
      </div>

      {/* Gradientes laterales */}
      <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
    </div>
  );
};
