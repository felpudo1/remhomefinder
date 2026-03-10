/**
 * ARCHIVO: EstadisticasTab.tsx
 * DESCRIPCIÓN: Sub-componente del Admin. Es la tabla bonita donde el jefe (tú)
 * puede ver todos los números de rendimiento: Precios, Vistas, CR%, etc.
 */
import { Loader2, ExternalLink, MapPin, DollarSign, Maximize2, Users, Building2, Star, ChevronUp, ChevronDown, BarChart3, Eye, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TabsContent } from "@/components/ui/tabs";
import { StatProperty } from "@/types/admin-publications";
import { PROPERTY_STATUS_LABELS } from "@/lib/constants";

interface EstadisticasTabProps {
    statProps: StatProperty[];
    loadingStats: boolean;
    fetchAllStats: () => void;
    sortConfig: { key: keyof StatProperty; direction: 'asc' | 'desc' };
    handleSort: (key: keyof StatProperty) => void;
    sortedStats: StatProperty[];
}

export function EstadisticasTab({
    loadingStats,
    fetchAllStats,
    sortConfig,
    handleSort,
    sortedStats,
}: EstadisticasTabProps) {
    return (
        <TabsContent value="estadisticas" className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    Vista unificada de auditoría total. Analizá el rendimiento, precios y feedback de todas las propiedades.
                </p>
                <Button variant="outline" size="sm" onClick={fetchAllStats} disabled={loadingStats} className="rounded-xl">
                    {loadingStats ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <BarChart3 className="w-4 h-4 mr-2" />}
                    Actualizar
                </Button>
            </div>

            <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-muted/50 border-b border-border">
                                {[
                                    { key: 'title', label: 'Propiedad', icon: Building2 },
                                    { key: 'creator', label: 'Creador' },
                                    { key: 'neighborhood', label: 'Ubicación', icon: MapPin },
                                    { key: 'total_cost', label: 'Precio', icon: DollarSign },
                                    { key: 'sq_meters', label: 'Sup.', icon: Maximize2 },
                                    { key: 'status', label: 'Estado' },
                                    { key: 'average_rating', label: 'Rating', icon: Star },
                                    { key: 'views_count', label: 'Vistas', icon: Eye },
                                    { key: 'cr', label: 'CR%', icon: Percent },
                                    { key: 'total_votes', label: 'Votos', icon: Users },
                                ].map((col) => (
                                    <th key={col.key} className="p-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                        <button
                                            onClick={() => handleSort(col.key as keyof StatProperty)}
                                            className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                                        >
                                            {col.icon && <col.icon className="w-3 h-3" />}
                                            {col.label}
                                            {sortConfig.key === col.key && (
                                                sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                                            )}
                                        </button>
                                    </th>
                                ))}
                                <th className="p-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-right">Ver</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {sortedStats.map((p) => (
                                <tr key={p.id} className="hover:bg-muted/30 transition-colors text-xs">
                                    <td className="p-3 max-w-[200px]">
                                        <div className="font-semibold truncate">{p.title}</div>
                                        <div className="text-[10px] opacity-50 mt-0.5">{p.type === 'agency' ? 'Marketplace' : 'Personal'}</div>
                                    </td>
                                    <td className="p-3">
                                        <div className="truncate max-w-[120px] text-muted-foreground">{p.creator}</div>
                                    </td>
                                    <td className="p-3">
                                        <div className="truncate max-w-[100px]">{p.neighborhood}</div>
                                        <div className="text-[10px] opacity-50">{p.city}</div>
                                    </td>
                                    <td className="p-3 font-mono font-medium">
                                        ${p.total_cost?.toLocaleString()}
                                    </td>
                                    <td className="p-3">
                                        {p.sq_meters}m²
                                        <div className="text-[10px] opacity-50">{p.rooms} amb.</div>
                                    </td>
                                    <td className="p-3">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium text-[9px] uppercase border ${p.status === 'active' || p.status === 'ingresado' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-muted text-muted-foreground border-border"
                                            }`}>
                                            {PROPERTY_STATUS_LABELS[p.status as string] || p.status}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        <div className="flex items-center gap-1.5 font-bold text-amber-500">
                                            <Star className={`w-3 h-3 ${(p.average_rating || 0) > 0 ? "fill-current" : ""}`} />
                                            {(p.average_rating || 0) > 0 ? p.average_rating.toFixed(1) : "—"}
                                        </div>
                                    </td>
                                    <td className="p-3 text-muted-foreground font-medium">
                                        {p.views_count || 0}
                                    </td>
                                    <td className="p-3">
                                        <div className={`font-bold ${p.cr && p.cr > 5 ? "text-emerald-500" : p.cr && p.cr > 2 ? "text-amber-500" : "text-muted-foreground"}`}>
                                            {p.cr ? `${p.cr.toFixed(1)}%` : "0%"}
                                        </div>
                                    </td>
                                    <td className="p-3 text-muted-foreground font-medium">
                                        {(p.total_votes || 0) > 0 ? p.total_votes : "0"}
                                    </td>
                                    <td className="p-3 text-right">
                                        {p.url && (
                                            <a href={p.url} target="_blank" rel="noopener noreferrer" className="inline-flex h-7 w-7 items-center justify-center rounded-lg hover:bg-muted transition-colors text-primary">
                                                <ExternalLink className="w-3.5 h-3.5" />
                                            </a>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </TabsContent>
    );
}
