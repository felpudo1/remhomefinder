/**
 * EstadisticasTab - tabla de auditoría con subpestañas Marketplace / Personal.
 */
import { Loader2, ExternalLink, MapPin, DollarSign, Maximize2, Users, Building2, Star, ChevronUp, ChevronDown, BarChart3, Eye, MessageSquare, Store, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StatProperty } from "@/types/admin-publications";
import { PROPERTY_STATUS_LABELS } from "@/lib/constants";

interface EstadisticasTabProps {
    statProps: StatProperty[];
    loadingStats: boolean;
    sortConfig: { key: keyof StatProperty; direction: 'asc' | 'desc' };
    handleSort: (key: keyof StatProperty) => void;
    page: number;
    setPage: (page: number | ((p: number) => number)) => void;
    totalCount: number;
    pageSize: number;
    subTab: "marketplace" | "personal";
    onSubTabChange: (tab: "marketplace" | "personal") => void;
}

export function EstadisticasTab({
    statProps,
    loadingStats,
    sortConfig,
    handleSort,
    page,
    setPage,
    totalCount,
    pageSize,
    subTab,
    onSubTabChange,
}: EstadisticasTabProps) {
    const isMarketplace = subTab === "marketplace";
    const baseCols = [
        { key: 'title', label: 'Propiedad', icon: Building2 },
        { key: 'creator', label: isMarketplace ? 'Agencia' : 'Usuario' },
        { key: 'neighborhood', label: 'Ubicación', icon: MapPin },
        { key: 'total_cost', label: 'Precio', icon: DollarSign },
        { key: 'sq_meters', label: 'Sup.', icon: Maximize2 },
        { key: 'status', label: 'Estado' },
        { key: 'average_rating', label: 'Rating', icon: Star },
        ...(isMarketplace ? [{ key: 'views_count', label: 'Vistas', icon: Eye }] : []),
        { key: 'total_votes', label: 'Votos', icon: Users },
        { key: 'discardReasons', label: 'Motivos descarte', icon: MessageSquare },
    ];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-primary" />
                        Auditoría de propiedades
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        Analizá el rendimiento, precios y feedback por tipo de listado.
                    </p>
                </div>
            </div>

            <Tabs value={subTab} onValueChange={(v) => onSubTabChange(v as "marketplace" | "personal")}>
                <TabsList className="grid w-full max-w-[320px] grid-cols-2 rounded-xl">
                    <TabsTrigger value="marketplace" className="flex items-center gap-2 rounded-lg">
                        <Store className="w-4 h-4" />
                        Marketplace
                    </TabsTrigger>
                    <TabsTrigger value="personal" className="flex items-center gap-2 rounded-lg">
                        <User className="w-4 h-4" />
                        Personal
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="marketplace" className="mt-4">
                    <StatsTable statProps={statProps} loadingStats={loadingStats} sortConfig={sortConfig} handleSort={handleSort} baseCols={baseCols} isMarketplace={true} page={page} setPage={setPage} totalCount={totalCount} pageSize={pageSize} />
                </TabsContent>
                <TabsContent value="personal" className="mt-4">
                    <StatsTable statProps={statProps} loadingStats={loadingStats} sortConfig={sortConfig} handleSort={handleSort} baseCols={baseCols} isMarketplace={false} page={page} setPage={setPage} totalCount={totalCount} pageSize={pageSize} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

function StatsTable({
    statProps,
    loadingStats,
    sortConfig,
    handleSort,
    baseCols,
    isMarketplace,
    page,
    setPage,
    totalCount,
    pageSize,
}: {
    statProps: StatProperty[];
    loadingStats: boolean;
    sortConfig: { key: keyof StatProperty; direction: 'asc' | 'desc' };
    handleSort: (key: keyof StatProperty) => void;
    baseCols: { key: string; label: string; icon?: React.ComponentType }[];
    isMarketplace: boolean;
    page: number;
    setPage: (page: number | ((p: number) => number)) => void;
    totalCount: number;
    pageSize: number;
}) {
    const cols = isMarketplace ? baseCols : baseCols.filter(c => c.key !== 'views_count');
    return (
        <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-muted/50 border-b border-border">
                                {cols.map((col) => (
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
                            {loadingStats ? (
                                <tr><td colSpan={cols.length + 1} className="p-8 text-center text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></td></tr>
                            ) : statProps.map((p) => (
                                <tr key={p.id} className="hover:bg-muted/30 transition-colors text-xs">
                                    <td className="p-3 max-w-[200px]">
                                        <div className="font-semibold truncate">{p.title}</div>
                                    </td>
                                    <td className="p-3">
                                        <div className="truncate max-w-[120px] text-muted-foreground">{p.creator}</div>
                                    </td>
                                    <td className="p-3">
                                        <div className="truncate max-w-[100px]">{p.neighborhood}</div>
                                        <div className="text-[10px] opacity-50">{p.city}</div>
                                    </td>
                                    <td className="p-3 font-mono font-medium">${p.total_cost?.toLocaleString()}</td>
                                    <td className="p-3">
                                        {p.sq_meters}m²
                                        <div className="text-[10px] opacity-50">{p.rooms} amb.</div>
                                    </td>
                                    <td className="p-3">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium text-[9px] uppercase border ${p.status === 'disponible' || p.status === 'ingresado' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-muted text-muted-foreground border-border"}`}>
                                            {PROPERTY_STATUS_LABELS[p.status as string] || p.status}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        <div className="flex items-center gap-1.5 font-bold text-amber-500">
                                            <Star className={`w-3 h-3 ${(p.average_rating || 0) > 0 ? "fill-current" : ""}`} />
                                            {(p.average_rating || 0) > 0 ? p.average_rating.toFixed(1) : "—"}
                                        </div>
                                    </td>
                                    {isMarketplace && (
                                        <td className="p-3 text-muted-foreground font-medium">{p.views_count || 0}</td>
                                    )}
                                    <td className="p-3 text-muted-foreground font-medium">{(p.total_votes || 0) > 0 ? p.total_votes : "0"}</td>
                                    <td className="p-3 max-w-[180px]">
                                        {p.discardReasons && p.discardReasons.length > 0 ? (
                                            <span className="text-[10px] text-muted-foreground" title={p.discardReasons.map(r => `${r.name}: ${r.count}`).join(", ")}>
                                                {p.discardReasons.slice(0, 3).map(r => `${r.name} (${r.count})`).join(", ")}
                                                {p.discardReasons.length > 3 && "…"}
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground/50">—</span>
                                        )}
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

            <div className="flex items-center justify-between px-4 py-4 bg-muted/20 border border-border rounded-2xl">
                <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                    Mostrando {statProps.length} de aprox. {totalCount} registros
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0 || loadingStats} className="h-8 rounded-xl px-4 text-xs shadow-sm">Anterior</Button>
                    <div className="flex items-center px-3 text-xs font-bold text-primary bg-primary/10 rounded-xl h-8">{page + 1}</div>
                    <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={statProps.length < pageSize || loadingStats} className="h-8 rounded-xl px-4 text-xs shadow-sm">Siguiente</Button>
                </div>
            </div>
        </div>
    );
}
