/**
 * AgentEstadisticas - Panel de estadísticas del agente.
 * Adaptado al nuevo esquema (agent_publications + user_listings).
 * Incluye tabla de auditoría similar al admin, filtrada por propiedades del agente.
 */
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bookmark, Building2, CheckCircle, PauseCircle, Loader2, TrendingUp, Star, ExternalLink, ChevronUp, ChevronDown, BarChart3, Eye, MapPin, DollarSign, Maximize2, MessageSquare, RefreshCw, Users } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Agency } from "./AgentProfile";
import { StatProperty } from "@/types/admin-publications";
import { PROPERTY_STATUS_LABELS } from "@/lib/constants";

interface AgentEstadisticasProps {
    agency: Agency;
}

const PAGE_SIZE = 50;
const AGENT_STATS_COLS = [
    { key: 'title', label: 'Propiedad', icon: Building2 },
    { key: 'neighborhood', label: 'Ubicación', icon: MapPin },
    { key: 'total_cost', label: 'Precio', icon: DollarSign },
    { key: 'sq_meters', label: 'Sup.', icon: Maximize2 },
    { key: 'status', label: 'Estado' },
    { key: 'average_rating', label: 'Rating', icon: Star },
    { key: 'views_count', label: 'Vistas', icon: Eye },
    /** Cantidad de votos del rating (public_global_rating) */
    { key: 'total_votes', label: 'Votos', icon: Users },
    /** Usuarios distintos que guardaron la publicación en su listado familiar */
    { key: 'saves_count', label: 'Guardados', icon: Bookmark },
    { key: 'discardReasons', label: 'Motivos descarte', icon: MessageSquare },
];

export const AgentEstadisticas = ({ agency }: AgentEstadisticasProps) => {
    const [isRefreshingTab, setIsRefreshingTab] = useState(false);
    const { data: properties = [], isLoading: propsLoading, refetch: refetchPropertiesStats } = useQuery({
        queryKey: ["agency-properties-stats", agency.id],
        enabled: !!agency,
        queryFn: async () => {
            const { data, error } = await supabase
                .from("agent_publications")
                .select("status, listing_type, views_count, properties(price_amount, m2_total)")
                .eq("org_id", agency.id);
            if (error) throw error;
            return data || [];
        },
    });

    const { data: statsData, isLoading: statsLoading, refetch: refetchDashboardStats } = useQuery({
        queryKey: ["agency-dashboard-stats", agency.id],
        enabled: !!agency,
        queryFn: async () => {
            // Contar guardados: filas en user_listings que apuntan a nuestras publicaciones
            const { data: pubs, error: pubErr } = await supabase
                .from("agent_publications")
                .select("id")
                .eq("org_id", agency.id);
            if (pubErr || !pubs?.length) return { total_saved: 0, top_properties: [] };

            const pubIds = pubs.map((p) => p.id).filter(Boolean);
            const { data: saves, error } = await supabase
                .rpc("get_publications_save_counts", { _publication_ids: pubIds });

            if (error) {
                console.error("Error fetching total saves:", error);
                return { total_saved: 0, top_properties: [] };
            }

            const total_saved = (saves || []).reduce((acc: number, curr: any) => acc + (curr.save_count || 0), 0);
            return { total_saved, top_properties: [] };
        },
    });

    const { data: chartData = [], isLoading: chartLoading, refetch: refetchHistoricalStats } = useQuery({
        queryKey: ["agency-historical-stats", agency.id],
        enabled: !!agency,
        queryFn: async () => {
            const { data: pubs } = await supabase
                .from("agent_publications")
                .select("property_id")
                .eq("org_id", agency.id);

            const propertyIds = pubs?.map(p => p.property_id).filter(Boolean) || [];

            const last14Days = Array.from({ length: 14 }, (_, i) => {
                const date = subDays(new Date(), 13 - i);
                return { dateLabel: format(date, 'dd MMM', { locale: es }), _idDate: date, saves: 0, views: 0 };
            });

            if (propertyIds.length === 0) {
                return last14Days.map(({ _idDate, ...rest }) => rest);
            }

            const { data: viewsData } = await supabase
                .from("property_views_log")
                .select("created_at")
                .in("property_id", propertyIds)
                .gte("created_at", subDays(new Date(), 14).toISOString());

            viewsData?.forEach((v: any) => {
                const day = last14Days.find(d => isSameDay(d._idDate, parseISO(v.created_at)));
                if (day) day.views++;
            });

            return last14Days.map(({ _idDate, ...rest }) => rest);
        }
    });

    const [sortConfig, setSortConfig] = useState<{ key: keyof StatProperty; direction: 'asc' | 'desc' }>({
        key: 'created_at', direction: 'desc'
    });
    const [statsPage, setStatsPage] = useState(0);

    /**
     * Tabla de auditoría de propiedades del agente.
     * Migrado de useEffect+setState a useQuery para tener caché de 5 min (global default).
     * Antes: se re-ejecutaban 4 requests cada vez que se cambiaba de pestaña o se remontaba el componente.
     * Ahora: los datos se reutilizan del caché hasta que expiren o el agente presione "Refrescar".
     *
     * También se corrigió el full scan:
     * - Antes: public_global_rating y property_insights_summary se pedían SIN filtro (toda la tabla).
     * - Ahora: se filtran por los propertyIds del agente desde la BD (round-trip 2, en paralelo con saves).
     */
    const { data: marketStatsData, isLoading: loadingStats, refetch: refetchMarketStats } = useQuery({
        queryKey: ["agency-market-stats", agency.id, statsPage],
        enabled: !!agency?.id,
        queryFn: async (): Promise<{ statProps: StatProperty[]; totalCount: number }> => {
            const from = statsPage * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;

            // Round 1: publicaciones de esta agencia (paginadas, con count)
            const pubRes = await (supabase.from("agent_publications") as any)
                .select("*, properties(title, source_url, neighborhood, city, total_cost, m2_total, rooms), organizations(name)", { count: "exact" })
                .eq("org_id", agency.id)
                .order("created_at", { ascending: false })
                .range(from, to);

            if (pubRes.error) throw pubRes.error;
            const pubData: any[] = pubRes.data || [];
            if (pubData.length === 0) return { statProps: [], totalCount: pubRes.count || 0 };

            const propertyIds: string[] = pubData.map((p: any) => p.property_id).filter(Boolean);
            const pubIds: string[] = pubData.map((p: any) => p.id).filter(Boolean);

            // Round 2: ratings, insights y guardados — todos acotados por los IDs del agente (sin full scan)
            const [ratingsRes, insightsRes, savesRes] = await Promise.all([
                // Usamos el agregado global para que el rating no dependa de permisos fila a fila
                propertyIds.length > 0
                    ? (supabase.from("public_global_rating") as any)
                        .select("property_id, avg_rating, total_votes")
                        .in("property_id", propertyIds)
                    : Promise.resolve({ data: [] }),
                propertyIds.length > 0
                    ? (supabase.from("property_insights_summary") as any)
                        .select("property_id, attribute_name, total_scores")
                        .in("property_id", propertyIds)
                    : Promise.resolve({ data: [] }),
                pubIds.length > 0
                    ? supabase.rpc("get_publications_save_counts", { _publication_ids: pubIds })
                    : Promise.resolve({ data: [] }),
            ]);

            // Construir mapas para lookup O(1)
            const ratingsMap: Record<string, { average: number; count: number }> = {};
            (ratingsRes.data || []).forEach((r: any) => {
                if (!r.property_id) return;
                ratingsMap[r.property_id] = {
                    average: Number(r.avg_rating || 0),
                    count: Number(r.total_votes || 0),
                };
            });

            const discardReasonsMap: Record<string, { name: string; count: number }[]> = {};
            (insightsRes.data || []).forEach((row: any) => {
                if (!row.property_id || !row.attribute_name) return;
                if (!discardReasonsMap[row.property_id]) discardReasonsMap[row.property_id] = [];
                discardReasonsMap[row.property_id].push({ name: row.attribute_name, count: row.total_scores || 0 });
            });
            Object.keys(discardReasonsMap).forEach((pid) => discardReasonsMap[pid].sort((a, b) => b.count - a.count));

            const savesByPublication: Record<string, number> = {};
            (savesRes.data || []).forEach((s: any) => {
                savesByPublication[s.publication_id] = s.save_count || 0;
            });

            const statProps: StatProperty[] = pubData.map((pub: any) => {
                const p = pub.properties || {};
                const stats = ratingsMap[pub.property_id];
                return {
                    id: pub.id,
                    title: p.title || "",
                    creator: agency.name || "Mi agencia",
                    type: "agency" as const,
                    listing_type: pub.listing_type,
                    neighborhood: p.neighborhood || "",
                    city: p.city || "",
                    total_cost: Number(p.total_cost || 0),
                    sq_meters: Number(p.m2_total || 0),
                    rooms: p.rooms || 0,
                    status: pub.status,
                    average_rating: stats ? stats.average : 0,
                    total_votes: stats ? stats.count : 0,
                    saves_count: savesByPublication[pub.id] ?? 0,
                    views_count: pub.views_count || 0,
                    created_at: pub.created_at,
                    url: p.source_url || "",
                    discardReasons: discardReasonsMap[pub.property_id] || [],
                };
            });

            return { statProps, totalCount: pubRes.count || 0 };
        },
    });

    const statProps = marketStatsData?.statProps ?? [];
    const totalStatsCount = marketStatsData?.totalCount ?? 0;

    const handleSort = (key: keyof StatProperty) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    const sortedStats = [...statProps].sort((a, b) => {
        const aVal = (a as any)[sortConfig.key];
        const bVal = (b as any)[sortConfig.key];
        if (typeof aVal === 'number' && typeof bVal === 'number') return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        if (typeof aVal === 'string' && typeof bVal === 'string') return sortConfig.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        return 0;
    });

    const handleRefreshTab = async () => {
        setIsRefreshingTab(true);
        await Promise.all([
            refetchPropertiesStats(),
            refetchDashboardStats(),
            refetchHistoricalStats(),
            refetchMarketStats(),
        ]);
        setIsRefreshingTab(false);
    };

    if (propsLoading || statsLoading) {
        return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    }

    const activeCount = properties.filter((p: any) => p.status === "disponible").length;
    const pausedCount = properties.filter((p: any) => p.status === "pausado").length;
    const soldCount = properties.filter((p: any) => p.status === "vendido" || p.status === "alquilado").length;
    const totalSaves = statsData?.total_saved || 0;

    return (
        <div className="space-y-6 flex flex-col">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-border shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Veces Guardada</CardTitle>
                        <Bookmark className="w-4 h-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalSaves}</div>
                        <p className="text-xs text-muted-foreground mt-1">Interés total en tus avisos</p>
                    </CardContent>
                </Card>
                <Card className="border-border shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Propiedades Activas</CardTitle>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeCount}</div>
                        <p className="text-xs text-muted-foreground mt-1">Publicadas en Marketplace</p>
                    </CardContent>
                </Card>
                <Card className="border-border shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">En Pausa</CardTitle>
                        <PauseCircle className="w-4 h-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pausedCount}</div>
                        <p className="text-xs text-muted-foreground mt-1">Requieren atención</p>
                    </CardContent>
                </Card>
                <Card className="border-border shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Vendidas/Alquiladas</CardTitle>
                        <Building2 className="w-4 h-4 text-primary/60" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{soldCount}</div>
                        <p className="text-xs text-muted-foreground mt-1">Operaciones cerradas</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-border shadow-md overflow-hidden bg-white/50 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/50 mb-4">
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-primary" />
                            Evolución de Interés (Últimos 14 días)
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="pt-4">
                    {chartLoading ? (
                        <div className="h-[300px] flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
                    ) : (
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                    <XAxis dataKey="dateLabel" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', borderRadius: '12px', border: '1px solid hsl(var(--border))', fontSize: '12px' }} />
                                    <Area type="monotone" dataKey="views" name="Visitas" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Tabla de auditoría - Mis propiedades en Marketplace */}
            <div className="space-y-4 order-first">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-primary" />
                            Auditoría de propiedades
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Analizá el rendimiento, precios y feedback de tus publicaciones en el marketplace.
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefreshTab}
                        disabled={isRefreshingTab || statsLoading || propsLoading || chartLoading || loadingStats}
                        className="h-8 rounded-xl px-3 text-xs shadow-sm gap-1.5 shrink-0"
                        title="Refrescar esta pestaña"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingTab ? "animate-spin" : ""}`} />
                        Refrescar
                    </Button>
                </div>

                <div className="rounded-2xl border border-border bg-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-muted/50 border-b border-border">
                                    {AGENT_STATS_COLS.map((col) => (
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
                                    <tr><td colSpan={AGENT_STATS_COLS.length + 1} className="p-8 text-center text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></td></tr>
                                ) : sortedStats.length === 0 ? (
                                    <tr><td colSpan={AGENT_STATS_COLS.length + 1} className="p-8 text-center text-muted-foreground">No hay publicaciones en el marketplace.</td></tr>
                                ) : sortedStats.map((p) => (
                                    <tr key={p.id} className="hover:bg-muted/30 transition-colors text-xs">
                                        <td className="p-3 max-w-[200px]">
                                            <div className="font-semibold truncate">{p.title}</div>
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
                                        <td className="p-3 text-muted-foreground font-medium">{p.views_count || 0}</td>
                                        <td className="p-3 text-muted-foreground font-medium">{(p.total_votes || 0) > 0 ? p.total_votes : "0"}</td>
                                        <td className="p-3 text-muted-foreground font-medium">{(p.saves_count ?? 0) > 0 ? p.saves_count : "0"}</td>
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
                        Mostrando {sortedStats.length} de aprox. {totalStatsCount} registros
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setStatsPage(p => Math.max(0, p - 1))} disabled={statsPage === 0 || loadingStats} className="h-8 rounded-xl px-4 text-xs shadow-sm">Anterior</Button>
                        <div className="flex items-center px-3 text-xs font-bold text-primary bg-primary/10 rounded-xl h-8">{statsPage + 1}</div>
                        <Button variant="outline" size="sm" onClick={() => setStatsPage(p => p + 1)} disabled={sortedStats.length < PAGE_SIZE || loadingStats} className="h-8 rounded-xl px-4 text-xs shadow-sm">Siguiente</Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
