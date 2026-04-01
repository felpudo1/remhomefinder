import {
  BarChart3,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2,
  RefreshCw,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PROPERTY_STATUS_LABELS } from "@/lib/constants";
import type { StatProperty } from "@/types/admin-publications";
import type { AgentStatsColumn } from "./agentEstadisticasTypes";

interface AgentMarketAuditTableProps {
  columns: AgentStatsColumn[];
  sortedStats: StatProperty[];
  totalStatsCount: number;
  statsPage: number;
  pageSize: number;
  sortConfig: {
    key: keyof StatProperty;
    direction: "asc" | "desc";
  };
  isLoading: boolean;
  isRefreshing: boolean;
  isDisabled: boolean;
  onSort: (key: keyof StatProperty) => void;
  onRefresh: () => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
}

/**
 * Encapsula la tabla de auditoria con sort, refresh y paginacion.
 */
export function AgentMarketAuditTable({
  columns,
  sortedStats,
  totalStatsCount,
  statsPage,
  pageSize,
  sortConfig,
  isLoading,
  isRefreshing,
  isDisabled,
  onSort,
  onRefresh,
  onPreviousPage,
  onNextPage,
}: AgentMarketAuditTableProps) {
  return (
    <div className="order-first space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold">
            <BarChart3 className="h-5 w-5 text-primary" />
            Auditoria de propiedades
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Analiza el rendimiento, precios y feedback de tus publicaciones en el
            marketplace.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isDisabled}
          className="h-8 shrink-0 gap-1.5 rounded-xl px-3 text-xs shadow-sm"
          title="Refrescar esta pestana"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`}
          />
          Refrescar
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="p-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
                  >
                    <button
                      onClick={() => onSort(column.key as keyof StatProperty)}
                      className="flex items-center gap-1.5 transition-colors hover:text-foreground"
                    >
                      {column.icon && <column.icon className="h-3 w-3" />}
                      {column.label}
                      {sortConfig.key === column.key &&
                        (sortConfig.direction === "asc" ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        ))}
                    </button>
                  </th>
                ))}
                <th className="p-3 text-right text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Ver
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    className="p-8 text-center text-muted-foreground"
                  >
                    <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                  </td>
                </tr>
              ) : sortedStats.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    className="p-8 text-center text-muted-foreground"
                  >
                    No hay publicaciones en el marketplace.
                  </td>
                </tr>
              ) : (
                sortedStats.map((property) => (
                  <tr
                    key={property.id}
                    className="text-xs transition-colors hover:bg-muted/30"
                  >
                    <td className="max-w-[200px] p-3">
                      <div className="truncate font-semibold">{property.title}</div>
                    </td>
                    <td className="p-3">
                      <div className="max-w-[100px] truncate">
                        {property.neighborhood}
                      </div>
                      <div className="text-[10px] opacity-50">{property.city}</div>
                    </td>
                    <td className="p-3 font-mono font-medium">
                      ${property.total_cost?.toLocaleString()}
                    </td>
                    <td className="p-3">
                      {property.sq_meters}m2
                      <div className="text-[10px] opacity-50">
                        {property.rooms} amb.
                      </div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-medium uppercase ${
                          property.status === "disponible" ||
                          property.status === "ingresado"
                            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                            : "border-border bg-muted text-muted-foreground"
                        }`}
                      >
                        {PROPERTY_STATUS_LABELS[property.status as string] ||
                          property.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5 font-bold text-amber-500">
                        <Star
                          className={`h-3 w-3 ${
                            (property.average_rating || 0) > 0 ? "fill-current" : ""
                          }`}
                        />
                        {(property.average_rating || 0) > 0
                          ? property.average_rating.toFixed(1)
                          : "—"}
                      </div>
                    </td>
                    <td className="p-3 font-medium text-muted-foreground">
                      {property.views_count || 0}
                    </td>
                    <td className="p-3 font-medium text-muted-foreground">
                      {(property.total_votes || 0) > 0 ? property.total_votes : "0"}
                    </td>
                    <td className="p-3 font-medium text-muted-foreground">
                      {(property.saves_count ?? 0) > 0 ? property.saves_count : "0"}
                    </td>
                    <td className="max-w-[180px] p-3">
                      {property.discardReasons && property.discardReasons.length > 0 ? (
                        <span
                          className="text-[10px] text-muted-foreground"
                          title={property.discardReasons
                            .map((reason) => `${reason.name}: ${reason.count}`)
                            .join(", ")}
                        >
                          {property.discardReasons
                            .slice(0, 3)
                            .map((reason) => `${reason.name} (${reason.count})`)
                            .join(", ")}
                          {property.discardReasons.length > 3 && "…"}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {property.url && (
                        <a
                          href={property.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-primary transition-colors hover:bg-muted"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-border bg-muted/20 px-4 py-4">
        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Mostrando {sortedStats.length} de aprox. {totalStatsCount} registros
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPreviousPage}
            disabled={statsPage === 0 || isLoading}
            className="h-8 rounded-xl px-4 text-xs shadow-sm"
          >
            Anterior
          </Button>
          <div className="flex h-8 items-center rounded-xl bg-primary/10 px-3 text-xs font-bold text-primary">
            {statsPage + 1}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onNextPage}
            disabled={sortedStats.length < pageSize || isLoading}
            className="h-8 rounded-xl px-4 text-xs shadow-sm"
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  );
}
