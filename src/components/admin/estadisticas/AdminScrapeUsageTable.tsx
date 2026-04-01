import { Loader2, RefreshCw } from "lucide-react";
import type { ScrapeUsageRow } from "./adminEstadisticasTypes";

interface AdminScrapeUsageTableProps {
  rows: ScrapeUsageRow[];
  loading: boolean;
  onRefresh: () => void;
}

/**
 * Tabla de consumo de scraping por usuario.
 */
export function AdminScrapeUsageTable({
  rows,
  loading,
  onRefresh,
}: AdminScrapeUsageTableProps) {
  return (
    <>
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-row items-start justify-between gap-4">
        <div>
          <h4 className="font-semibold text-sm text-foreground">Consumo de scrapers por usuario</h4>
          <p className="text-[11px] text-muted-foreground mt-1">
            Incluye intentos exitosos y fallidos, incluso cuando no se guardó la propiedad.
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="shrink-0 p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground border border-border disabled:opacity-50"
          title="Refrescar datos de scraping"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="p-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Usuario</th>
                <th className="p-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Tokens consumidos</th>
                <th className="p-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Scrapes totales</th>
                <th className="p-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Éxitos</th>
                <th className="p-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Fallos</th>
                <th className="p-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">URL</th>
                <th className="p-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Imagen</th>
                <th className="p-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Último scrape</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground text-sm">
                    No hay registros todavia.
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => (
                  <tr
                    key={row.user_id || row.user_email || `scrape-row-${index}`}
                    className="hover:bg-muted/30 transition-colors text-xs"
                  >
                    <td className="p-3">
                      <div className="font-semibold">{row.user_name || "Usuario"}</div>
                      <div className="text-[10px] text-muted-foreground">{row.user_email || "Sin email"}</div>
                    </td>
                    <td className="p-3 font-bold text-primary">{row.total_token_charged || 0}</td>
                    <td className="p-3">{row.total_scrapes || 0}</td>
                    <td className="p-3 text-emerald-600">{row.total_success || 0}</td>
                    <td className="p-3 text-rose-600">{row.total_failed || 0}</td>
                    <td className="p-3">{row.total_url_scrapes || 0}</td>
                    <td className="p-3">{row.total_image_scrapes || 0}</td>
                    <td className="p-3 text-muted-foreground">
                      {row.last_scrape_at ? new Date(row.last_scrape_at).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
