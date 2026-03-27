import type { MarketplaceProperty } from "@/types/property";
import type { ListingType } from "@/types/property";
import { currencySymbol } from "@/lib/currency";

/**
 * Períodos de comparación del panel Indicadores (alineado con la UI).
 */
export type IndicadoresPeriodo = "mes-actual" | "mes-anterior" | "inicio-ano" | "ano-movil";

/** Opciones del selector (orden fijo). */
export const INDICADORES_PERIODOS_OPTIONS: { id: IndicadoresPeriodo; label: string }[] = [
  { id: "mes-actual", label: "Mes actual" },
  { id: "mes-anterior", label: "Mes anterior" },
  { id: "inicio-ano", label: "Inicio año" },
  { id: "ano-movil", label: "Año móvil" },
];

const MS_PER_DAY = 86_400_000;

/**
 * Costo efectivo del aviso (misma lógica que MarketplaceView / tarjetas).
 */
export function marketplaceEffectiveCost(p: MarketplaceProperty): number {
  const t = p.totalCost > 0 ? p.totalCost : p.priceRent + p.priceExpenses;
  return t > 0 ? t : 0;
}

/**
 * Rango de fechas del período seleccionado (inicio inclusive, fin inclusive).
 */
export function getPeriodRange(period: IndicadoresPeriodo, now = new Date()): { start: Date; end: Date } {
  switch (period) {
    case "mes-actual": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start, end: now };
    }
    case "mes-anterior": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { start, end };
    }
    case "inicio-ano": {
      const start = new Date(now.getFullYear(), 0, 1);
      return { start, end: now };
    }
    case "ano-movil": {
      const end = new Date(now);
      const start = new Date(now);
      start.setFullYear(start.getFullYear() - 1);
      return { start, end };
    }
  }
}

/**
 * Rango “anterior” para comparar variación % (promedio y cantidades).
 */
export function getComparisonPeriodRange(period: IndicadoresPeriodo, now = new Date()): { start: Date; end: Date } | null {
  switch (period) {
    case "mes-actual": {
      /** Mismo tramo de días en el mes calendario previo (ej. 1–15 mar vs 1–15 feb). */
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate(), 23, 59, 59, 999);
      return { start, end };
    }
    case "mes-anterior": {
      const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59, 999);
      return { start, end };
    }
    case "inicio-ano": {
      const startThisYear = new Date(now.getFullYear(), 0, 1);
      const elapsed = now.getTime() - startThisYear.getTime();
      const start = new Date(now.getFullYear() - 1, 0, 1);
      const end = new Date(start.getTime() + elapsed);
      return { start, end };
    }
    case "ano-movil": {
      const end = new Date(now);
      end.setFullYear(end.getFullYear() - 1);
      const start = new Date(now);
      start.setFullYear(start.getFullYear() - 2);
      return { start, end };
    }
  }
}

function inDateRange(d: Date, range: { start: Date; end: Date }): boolean {
  return d >= range.start && d <= range.end;
}

function filterByTypeAndRange(
  items: MarketplaceProperty[],
  listingType: ListingType,
  range: { start: Date; end: Date }
): MarketplaceProperty[] {
  return items.filter((p) => p.listingType === listingType && inDateRange(p.createdAt, range));
}

/** Publicaciones consideradas “en cartera” (visibles y no cerradas). */
function isActiveInventory(p: MarketplaceProperty): boolean {
  return p.status === "disponible";
}

/**
 * Moneda mayoritaria en el subconjunto (para promediar sin mezclar USD con UYU).
 */
function majorityCurrency(items: MarketplaceProperty[]): string | null {
  if (items.length === 0) return null;
  const counts = new Map<string, number>();
  for (const p of items) {
    const c = (p.currency || "USD").toUpperCase();
    counts.set(c, (counts.get(c) || 0) + 1);
  }
  let best = "USD";
  let n = 0;
  for (const [cur, count] of counts) {
    if (count > n) {
      n = count;
      best = cur;
    }
  }
  return best;
}

function averageCostForCurrency(items: MarketplaceProperty[], currency: string): number | null {
  const costs = items
    .filter((p) => (p.currency || "USD").toUpperCase() === currency)
    .map(marketplaceEffectiveCost)
    .filter((c) => c > 0);
  if (costs.length === 0) return null;
  return costs.reduce((a, b) => a + b, 0) / costs.length;
}

/**
 * Formatea precio para el panel (venta vs alquiler).
 */
export function formatPrecioIndicador(
  value: number | null,
  currency: string | null,
  listingType: ListingType
): string {
  if (value === null || !currency) return "—";
  const sym = currencySymbol(currency);
  const n = Math.round(value);
  if (listingType === "sale") {
    if (n >= 1_000_000) return `${sym} ${(n / 1_000_000).toLocaleString("es-UY", { maximumFractionDigits: 2 })} mill.`;
    if (n >= 1_000) return `${sym} ${(n / 1_000).toLocaleString("es-UY", { maximumFractionDigits: 1 })} mil`;
  }
  return `${sym} ${n.toLocaleString("es-UY")}`;
}

function pctChange(prev: number | null, curr: number | null): { text: string; positive: boolean } | null {
  if (prev === null || curr === null || prev === 0) return null;
  const raw = ((curr - prev) / prev) * 100;
  const text = `${raw >= 0 ? "+" : ""}${raw.toFixed(1).replace(".", ",")}%`;
  return { text, positive: raw >= 0 };
}

function countPctChange(prevCount: number, currCount: number): { text: string; positive: boolean } | null {
  if (prevCount === 0 && currCount === 0) return null;
  if (prevCount === 0) return { text: "+100%", positive: true };
  const raw = ((currCount - prevCount) / prevCount) * 100;
  const text = `${raw >= 0 ? "+" : ""}${raw.toFixed(1).replace(".", ",")}%`;
  return { text, positive: raw >= 0 };
}

export type LineaIndicadoresMetrics = {
  precioMedio: string;
  precioTrend: { text: string; positive: boolean } | null;
  publicaciones: string;
  publicacionesTrend: { text: string; positive: boolean } | null;
  inventario: string;
  inventarioTrend: { text: string; positive: boolean } | null;
  diasMercado: string;
  diasMercadoTrend: { text: string; positive: boolean } | null;
};

/**
 * Arma las 4 métricas de una línea (venta o alquiler) a partir del marketplace.
 */
export function buildLineMetrics(
  marketplace: MarketplaceProperty[],
  listingType: ListingType,
  period: IndicadoresPeriodo
): LineaIndicadoresMetrics {
  const now = new Date();
  const range = getPeriodRange(period, now);
  const compRange = getComparisonPeriodRange(period, now);

  const inPeriod = filterByTypeAndRange(marketplace, listingType, range);
  const inComp = compRange ? filterByTypeAndRange(marketplace, listingType, compRange) : [];

  /** Moneda mayoritaria del período actual; la comparación usa la misma para ser coherente. */
  const currency = majorityCurrency(inPeriod);
  const avgCur = currency ? averageCostForCurrency(inPeriod, currency) : null;
  const compSameCurrency = currency
    ? inComp.filter((p) => (p.currency || "USD").toUpperCase() === currency)
    : [];
  const avgPrev =
    currency && compSameCurrency.length > 0 ? averageCostForCurrency(compSameCurrency, currency) : null;

  const precioTrend = avgCur !== null && avgPrev !== null ? pctChange(avgPrev, avgCur) : null;

  const pubCur = inPeriod.length;
  const pubPrev = inComp.length;
  const pubTrend = countPctChange(pubPrev, pubCur);

  const activos = marketplace.filter((p) => p.listingType === listingType && isActiveInventory(p));
  const inventarioCount = activos.length;

  let diasProm: number | null = null;
  if (activos.length > 0) {
    const sumDays = activos.reduce((acc, p) => {
      return acc + (now.getTime() - p.createdAt.getTime()) / MS_PER_DAY;
    }, 0);
    diasProm = sumDays / activos.length;
  }

  const diasStr = diasProm !== null ? `${Math.round(diasProm)}` : "—";
  const invStr = String(inventarioCount);

  return {
    precioMedio: formatPrecioIndicador(avgCur, currency, listingType),
    precioTrend,
    publicaciones: String(pubCur),
    publicacionesTrend: pubTrend,
    inventario: invStr,
    inventarioTrend: null,
    diasMercado: diasStr,
    diasMercadoTrend: null,
  };
}
