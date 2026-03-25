import { Card, CardContent } from "@/components/ui/card";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Panel de indicadores de mercado para el dashboard del agente (datos de ejemplo / benchmark).
 * Pensado para reemplazar luego por métricas reales desde API o analytics.
 */
const MARKET_KPIS = [
  {
    id: "precio-mediano",
    label: "Precio mediano",
    value: "US$ 498 mil",
    change: "+5,2%",
    positive: true,
  },
  {
    id: "viviendas-vendidas",
    label: "Viviendas vendidas",
    value: "1.234",
    change: "+12,8%",
    positive: true,
  },
  {
    id: "inventario",
    label: "Inventario",
    value: "1.650",
    change: "-31,3%",
    positive: false,
  },
  {
    id: "dias-en-mercado",
    label: "Días en el mercado",
    value: "28",
    change: "-15,2%",
    positive: true,
  },
] as const;

export function AgentIndicadores() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
          Panel de análisis de mercado
        </h1>
        <p className="text-muted-foreground text-sm md:text-base max-w-2xl">
          Tendencias del mercado en tiempo real e información basada en analítica avanzada
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {MARKET_KPIS.map((kpi) => (
          <Card key={kpi.id} className="rounded-2xl border-border/80 card-shadow overflow-hidden">
            <CardContent className="p-5 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{kpi.label}</p>
              <p className="text-2xl md:text-3xl font-bold text-foreground tabular-nums">{kpi.value}</p>
              <div
                className={cn(
                  "inline-flex items-center gap-1 text-sm font-semibold",
                  kpi.positive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                )}
              >
                {kpi.positive ? (
                  <TrendingUp className="w-4 h-4 shrink-0" aria-hidden />
                ) : (
                  <TrendingDown className="w-4 h-4 shrink-0" aria-hidden />
                )}
                <span>{kpi.change}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
