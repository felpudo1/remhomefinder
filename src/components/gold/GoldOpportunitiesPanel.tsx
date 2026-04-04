import { Zap, TrendingDown, MapPin, Gavel, Gem, Rocket } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useCurrentUser } from "@/contexts/AuthProvider";

const MOCK_METRICS = [
  {
    icon: Zap,
    label: "Oportunidades detectadas hoy",
    value: "14",
    accent: "text-amber-400",
  },
  {
    icon: TrendingDown,
    label: "Promedio de ahorro detectado",
    value: "-18%",
    accent: "text-emerald-400",
  },
  {
    icon: MapPin,
    label: "Zonas con más actividad",
    value: "Cordón, Pocitos, Centro",
    accent: "text-sky-400",
  },
];

export const GoldOpportunitiesPanel = () => {
  const { user } = useCurrentUser();

  const handleRequestAccess = () => {
    if (!user) return;
    toast.success("¡Gracias por tu interés! Te avisaremos cuando GOLD esté disponible.", {
      duration: 5000,
      icon: "💎",
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-6 md:p-8">
        {/* Glow effect */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-amber-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Gem className="w-6 h-6 text-gray-950" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                🧈🧈Radar de Oportunidades Gold 🧈🧈
              </h2>
              <p className="text-sm text-gray-400 mt-0.5">
                Inteligencia de mercado para inversores exigentes
              </p>
            </div>
          </div>
          <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/20 text-xs font-semibold tracking-wide">
            V2 — Próximamente
          </Badge>
        </div>

        {/* Metrics Cards */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
          {MOCK_METRICS.map((metric) => (
            <div
              key={metric.label}
              className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 flex flex-col gap-2 hover:bg-white/[0.08] transition-colors"
            >
              <div className="flex items-center gap-2">
                <metric.icon className={`w-4 h-4 ${metric.accent}`} />
                <span className="text-xs text-gray-400 font-medium">{metric.label}</span>
              </div>
              <span className="text-lg font-bold text-white tracking-tight">{metric.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Remates Banner */}
      <Card className="border-amber-500/15 bg-gradient-to-r from-amber-500/5 via-transparent to-amber-500/5">
        <CardContent className="p-5 md:p-6 flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
            <Gavel className="w-5 h-5 text-amber-600" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-foreground text-sm">
              Centralización de Remates Judiciales en progreso
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              No pierdas más tiempo buscando en el Diario Oficial. Estamos construyendo un motor que
              centraliza y analiza todas las publicaciones de remates para que encuentres las mejores
              oportunidades antes que nadie.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <div className="flex flex-col items-center gap-3 py-6">
        <Button
          size="lg"
          onClick={handleRequestAccess}
          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-gray-950 font-bold rounded-xl shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all px-8 gap-2"
        >
          <Rocket className="w-5 h-5" />
          Solicitar Acceso Anticipado
        </Button>
        <p className="text-xs text-muted-foreground">
          Te notificaremos apenas esté disponible. Sin compromiso.
        </p>
      </div>
    </div>
  );
};
