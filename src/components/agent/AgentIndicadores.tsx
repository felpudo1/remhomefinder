import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  buildLineMetrics,
  INDICADORES_PERIODOS_OPTIONS,
  type IndicadoresPeriodo,
  type LineaIndicadoresMetrics,
} from "@/lib/indicadoresMercado";
import { useMarketplaceProperties } from "@/hooks/useMarketplaceProperties";

/** Re-export del tipo por si otros módulos importaban desde este archivo. */
export type { IndicadoresPeriodo };

/**
 * Una fila KPI en el panel (valor + tendencia o guión).
 */
type MarketKpi = {
  id: string;
  label: string;
  value: string;
  change: string;
  /** Si true, la variación se muestra en gris sin flechas (sin dato o métrica puntual). */
  neutralTrend?: boolean;
  /** Solo si neutralTrend es false: verde si sube “bien”, rojo si baja. */
  positive: boolean;
};

/**
 * Convierte métricas calculadas desde marketplace en tarjetas para Venta o Alquiler.
 */
function metricsToKpis(
  linea: "venta" | "alquiler",
  periodo: IndicadoresPeriodo,
  m: LineaIndicadoresMetrics
): MarketKpi[] {
  const base = `${linea}-${periodo}`;
  const precioLabel = linea === "venta" ? "Precio medio" : "Precio medio (mensual)";

  const trendNeutral = (t: { text: string; positive: boolean } | null) => !t;

  return [
    {
      id: `${base}-precio`,
      label: precioLabel,
      value: m.precioMedio,
      change: m.precioTrend?.text ?? "—",
      positive: m.precioTrend?.positive ?? true,
      neutralTrend: trendNeutral(m.precioTrend),
    },
    {
      id: `${base}-pub`,
      label: "Publicaciones (período)",
      value: m.publicaciones,
      change: m.publicacionesTrend?.text ?? "—",
      positive: m.publicacionesTrend?.positive ?? true,
      neutralTrend: trendNeutral(m.publicacionesTrend),
    },
    {
      id: `${base}-inv`,
      label: "Activos en marketplace",
      value: m.inventario,
      change: m.inventarioTrend?.text ?? "—",
      positive: true,
      neutralTrend: true,
    },
    {
      id: `${base}-dias`,
      label: "Días promedio (activos)",
      value: m.diasMercado,
      change: m.diasMercadoTrend?.text ?? "—",
      positive: true,
      neutralTrend: true,
    },
  ];
}

/**
 * Selector de período: tres botones explícitos (más visible que ToggleGroup en todos los temas).
 */
function SelectorPeriodo({
  value,
  onChange,
  ariaLabel,
}: {
  value: IndicadoresPeriodo;
  onChange: (v: IndicadoresPeriodo) => void;
  ariaLabel: string;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        "flex flex-col gap-2 sm:items-end",
        "w-full sm:w-auto min-w-0"
      )}
    >
      <span className="text-xs font-medium text-muted-foreground sm:text-right">Comparar por</span>
      <div
        className={cn(
          "inline-flex flex-wrap gap-1 rounded-xl border-2 border-border bg-muted/40 p-1",
          "w-full sm:w-auto justify-stretch sm:justify-end"
        )}
      >
        {INDICADORES_PERIODOS_OPTIONS.map((p) => {
          const isOn = value === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onChange(p.id)}
              className={cn(
                "flex-1 sm:flex-initial min-h-[40px] rounded-lg px-3 py-2 text-xs font-semibold transition-colors sm:min-h-0 sm:px-4 sm:text-sm",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isOn
                  ? "bg-background text-foreground shadow-md ring-1 ring-border"
                  : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
              )}
            >
              {p.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Grilla de tarjetas KPI.
 */
function KpiGrid({ items }: { items: readonly MarketKpi[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {items.map((kpi) => (
        <Card key={kpi.id} className="rounded-2xl border-border/80 card-shadow overflow-hidden">
          <CardContent className="p-5 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{kpi.label}</p>
            <p className="text-2xl md:text-3xl font-bold text-foreground tabular-nums">{kpi.value}</p>
            {kpi.neutralTrend ? (
              <p className="text-sm font-medium text-muted-foreground">{kpi.change}</p>
            ) : (
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
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Panel de indicadores: datos reales desde publicaciones del marketplace (agent_publications + properties).
 * Venta / alquiler según listing_type; período filtra por fecha de creación de la publicación.
 */
export function AgentIndicadores() {
  const [periodoVenta, setPeriodoVenta] = useState<IndicadoresPeriodo>("mes-actual");
  const [periodoAlquiler, setPeriodoAlquiler] = useState<IndicadoresPeriodo>("mes-actual");

  const { data: marketplace = [], isLoading, isError } = useMarketplaceProperties();

  const venta = useMemo(
    () => buildLineMetrics(marketplace, "sale", periodoVenta),
    [marketplace, periodoVenta]
  );
  const alquiler = useMemo(
    () => buildLineMetrics(marketplace, "rent", periodoAlquiler),
    [marketplace, periodoAlquiler]
  );

  const kpisVenta = useMemo(
    () => metricsToKpis("venta", periodoVenta, venta),
    [venta, periodoVenta]
  );
  const kpisAlquiler = useMemo(
    () => metricsToKpis("alquiler", periodoAlquiler, alquiler),
    [alquiler, periodoAlquiler]
  );

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
          Panel de análisis de mercado
        </h1>
        <p className="text-muted-foreground text-sm md:text-base max-w-2xl">
          Tendencias del mercado en tiempo real e información basada en analítica avanzada
        </p>
        <p className="text-xs text-muted-foreground max-w-2xl">
          Precios y publicaciones según avisos del marketplace (venta y alquiler). Mes actual: desde el día 1 del
          mes hasta hoy; la variación se compara con el mismo tramo de días del mes anterior. Inventario y días:
          solo avisos activos.
        </p>
        {isError && (
          <p className="text-sm text-destructive">No se pudieron cargar los datos del marketplace.</p>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
          <Loader2 className="h-10 w-10 animate-spin" aria-hidden />
          <span className="text-sm">Cargando indicadores…</span>
        </div>
      ) : (
        <>
          <section className="space-y-4" aria-labelledby="indicadores-venta-heading">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <h2 id="indicadores-venta-heading" className="text-lg font-semibold text-foreground shrink-0">
                Venta
              </h2>
              <SelectorPeriodo
                value={periodoVenta}
                onChange={setPeriodoVenta}
                ariaLabel="Período de comparación para indicadores de venta"
              />
            </div>
            <KpiGrid items={kpisVenta} />
          </section>

          <section className="space-y-4" aria-labelledby="indicadores-alquiler-heading">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <h2 id="indicadores-alquiler-heading" className="text-lg font-semibold text-foreground shrink-0">
                Alquiler
              </h2>
              <SelectorPeriodo
                value={periodoAlquiler}
                onChange={setPeriodoAlquiler}
                ariaLabel="Período de comparación para indicadores de alquiler"
              />
            </div>
            <KpiGrid items={kpisAlquiler} />
          </section>
        </>
      )}
    </div>
  );
}
