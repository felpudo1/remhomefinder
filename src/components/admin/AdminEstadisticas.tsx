/**
 * ARCHIVO: AdminEstadisticas.tsx
 * Estadísticas generales de la plataforma - adaptado al nuevo esquema.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Home, Building2, TrendingUp, Users2, Loader2, BarChart3, Shield, RefreshCw } from "lucide-react";
import { EstadisticasTab } from "./publicaciones/EstadisticasTab";
import { StatProperty } from "@/types/admin-publications";
import { useToast } from "@/hooks/use-toast";

interface StatusCount {
    label: string;
    count: number;
    color?: string;
}

interface CategoryStats {
    total: number;
    breakdown: StatusCount[];
}

interface Stats {
    properties: CategoryStats;
    agencies: CategoryStats;
    users: CategoryStats;
    admins: number;
}

export function AdminEstadisticas() {
    const { toast } = useToast();
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [marketProps, setMarketProps] = useState<StatProperty[]>([]);
    const [personalProps, setPersonalProps] = useState<StatProperty[]>([]);
    const [loadingMarket, setLoadingMarket] = useState(true);
    const [loadingPersonal, setLoadingPersonal] = useState(true);
    const [pageMarket, setPageMarket] = useState(0);
    const [pagePersonal, setPagePersonal] = useState(0);
    const [totalMarketCount, setTotalMarketCount] = useState(0);
    const [totalPersonalCount, setTotalPersonalCount] = useState(0);
    const [statsSubTab, setStatsSubTab] = useState<"marketplace" | "personal">("marketplace");
    const PAGE_SIZE = 50;
    const [sortConfig, setSortConfig] = useState<{ key: keyof StatProperty; direction: 'asc' | 'desc' }>({
        key: 'created_at',
        direction: 'desc'
    });
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await Promise.all([fetchStats(), fetchMarketStats(), fetchPersonalStats()]);
        setIsRefreshing(false);
    };

    useEffect(() => { fetchStats(); }, []);
    useEffect(() => { fetchMarketStats(); }, [pageMarket]);
    useEffect(() => { fetchPersonalStats(); }, [pagePersonal]);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const [profilesRes, rolesRes] = await Promise.all([
                supabase.from("profiles").select("user_id, status"),
                supabase.from("user_roles").select("user_id, role"),
            ]);

            if (profilesRes.error) throw profilesRes.error;
            if (rolesRes.error) throw rolesRes.error;

            const roleMap: Record<string, string[]> = {};
            rolesRes.data?.forEach(r => {
                if (!roleMap[r.user_id]) roleMap[r.user_id] = [];
                roleMap[r.user_id].push(r.role);
            });

            const agStats = { total: 0, active: 0, pending: 0, suspended: 0, rejected: 0 };
            const userStats = { total: 0, active: 0, pending: 0, suspended: 0, rejected: 0 };
            let adminsCount = 0;

            profilesRes.data?.forEach((p) => {
                const roles = roleMap[p.user_id] || [];
                const status = p.status;

                if (roles.includes('agency')) {
                    agStats.total++;
                    if (status === 'active') agStats.active++;
                    else if (status === 'pending') agStats.pending++;
                    else if (status === 'suspended') agStats.suspended++;
                    else if (status === 'rejected') agStats.rejected++;
                }

                if (roles.includes('user')) {
                    userStats.total++;
                    if (status === 'active') userStats.active++;
                    else if (status === 'pending') userStats.pending++;
                    else if (status === 'suspended') userStats.suspended++;
                    else if (status === 'rejected') userStats.rejected++;
                }

                if (roles.includes('admin')) adminsCount++;
            });

            // Count agent_publications
            const pubTotal = await supabase.from("agent_publications").select("id", { count: "exact", head: true });
            const { data: pubData } = await supabase.from("agent_publications").select("status");

            const propStats = { active: 0, paused: 0, closed: 0 };
            pubData?.forEach((p) => {
                if (p.status === 'disponible') propStats.active++;
                else if (p.status === 'pausado') propStats.paused++;
                else if (['vendido', 'alquilado'].includes(p.status)) propStats.closed++;
            });

            setStats({
                properties: {
                    total: pubTotal.count || 0,
                    breakdown: [
                        { label: "Activas", count: propStats.active, color: "text-emerald-500" },
                        { label: "Pausadas", count: propStats.paused, color: "text-amber-500" },
                        { label: "Cerradas", count: propStats.closed, color: "text-blue-500" },
                    ]
                },
                agencies: {
                    total: agStats.total,
                    breakdown: [
                        { label: "Activas", count: agStats.active, color: "text-emerald-500" },
                        { label: "Pendientes", count: agStats.pending, color: "text-amber-500" },
                        { label: "Suspendidas", count: agStats.suspended, color: "text-orange-500" },
                        { label: "Eliminadas", count: agStats.rejected, color: "text-rose-500" },
                    ]
                },
                users: {
                    total: userStats.total,
                    breakdown: [
                        { label: "Activos", count: userStats.active, color: "text-emerald-500" },
                        { label: "Pendientes", count: userStats.pending, color: "text-amber-500" },
                        { label: "Suspendidos", count: userStats.suspended, color: "text-orange-500" },
                        { label: "Eliminados", count: userStats.rejected, color: "text-rose-500" },
                    ]
                },
                admins: adminsCount,
            });
        } catch (e: unknown) {
            console.error("Error en dashboard stats:", e);
            toast({ title: "Error al cargar dashboard", description: e instanceof Error ? e.message : "Error desconocido", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const fetchMarketStats = async () => {
        setLoadingMarket(true);
        try {
            const from = pageMarket * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;
            const [pubRes, ratingsRes, insightsRes] = await Promise.all([
                supabase.from("agent_publications")
                    .select("*, properties(title, source_url, neighborhood, city, total_cost, m2_total, rooms), organizations(name)", { count: "exact" })
                    .order('created_at', { ascending: false })
                    .range(from, to),
                supabase.from("property_reviews").select("property_id, rating"),
                supabase.from("property_insights_summary").select("property_id, attribute_name, total_scores"),
            ]);
            if (pubRes.error) throw pubRes.error;
            const pubData = pubRes.data || [];
            const ratingsData: any[] = ratingsRes.data || [];
            const insightsData: { property_id: string; attribute_name: string; total_scores: number }[] = insightsRes.data || [];

            const discardReasonsMap: Record<string, { name: string; count: number }[]> = {};
            insightsData.forEach((row) => {
                if (!row.property_id || !row.attribute_name) return;
                if (!discardReasonsMap[row.property_id]) discardReasonsMap[row.property_id] = [];
                discardReasonsMap[row.property_id].push({ name: row.attribute_name, count: row.total_scores || 0 });
            });
            Object.keys(discardReasonsMap).forEach((pid) => discardReasonsMap[pid].sort((a, b) => b.count - a.count));

            const ratingsMap: Record<string, { sum: number; count: number }> = {};
            ratingsData.forEach(r => {
                if (!r.property_id || r.rating === null) return;
                if (!ratingsMap[r.property_id]) ratingsMap[r.property_id] = { sum: 0, count: 0 };
                ratingsMap[r.property_id].sum += Number(r.rating);
                ratingsMap[r.property_id].count++;
            });

            const market: StatProperty[] = pubData.map((pub) => {
                const p = (pub as any).properties || {};
                const stats = ratingsMap[(pub as any).property_id];
                const propId = (pub as any).property_id;
                return {
                    id: pub.id,
                    title: p.title || "",
                    creator: pub.organizations?.name || "Agencia",
                    type: "agency" as const,
                    listing_type: pub.listing_type,
                    neighborhood: p.neighborhood || "",
                    city: p.city || "",
                    total_cost: Number(p.total_cost || 0),
                    sq_meters: Number(p.m2_total || 0),
                    rooms: p.rooms || 0,
                    status: pub.status,
                    average_rating: stats ? stats.sum / stats.count : 0,
                    total_votes: stats ? stats.count : 0,
                    views_count: pub.views_count || 0,
                    created_at: pub.created_at,
                    url: p.source_url || "",
                    discardReasons: discardReasonsMap[propId] || [],
                };
            });
            setMarketProps(market);
            setTotalMarketCount(pubRes.count || 0);
        } catch (e: unknown) {
            toast({ title: "Error en estadísticas marketplace", description: e instanceof Error ? e.message : "Error desconocido", variant: "destructive" });
        } finally {
            setLoadingMarket(false);
        }
    };

    const fetchPersonalStats = async () => {
        setLoadingPersonal(true);
        try {
            const from = pagePersonal * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;
            const [listingsRes, ratingsRes, insightsRes] = await Promise.all([
                supabase.from("user_listings")
                    .select("*, properties(title, source_url, neighborhood, city, total_cost, m2_total, rooms)", { count: "exact" })
                    .order('created_at', { ascending: false })
                    .range(from, to),
                supabase.from("property_reviews").select("property_id, rating"),
                supabase.from("property_insights_summary").select("property_id, attribute_name, total_scores"),
            ]);
            if (listingsRes.error) throw listingsRes.error;
            const listingsData = listingsRes.data || [];
            const ratingsData: any[] = ratingsRes.data || [];
            const insightsData: { property_id: string; attribute_name: string; total_scores: number }[] = insightsRes.data || [];

            const addedByIds = [...new Set((listingsData as { added_by?: string }[]).map((l) => l.added_by).filter(Boolean))];
            let addedByMap: Record<string, string> = {};
            if (addedByIds.length > 0) {
                const { data: profilesData } = await supabase.from("profiles").select("user_id, display_name, email").in("user_id", addedByIds);
                profilesData?.forEach((pr) => { addedByMap[pr.user_id] = pr.display_name || pr.email || "Usuario"; });
            }

            const discardReasonsMap: Record<string, { name: string; count: number }[]> = {};
            insightsData.forEach((row) => {
                if (!row.property_id || !row.attribute_name) return;
                if (!discardReasonsMap[row.property_id]) discardReasonsMap[row.property_id] = [];
                discardReasonsMap[row.property_id].push({ name: row.attribute_name, count: row.total_scores || 0 });
            });
            Object.keys(discardReasonsMap).forEach((pid) => discardReasonsMap[pid].sort((a, b) => b.count - a.count));

            const ratingsMap: Record<string, { sum: number; count: number }> = {};
            ratingsData.forEach(r => {
                if (!r.property_id || r.rating === null) return;
                if (!ratingsMap[r.property_id]) ratingsMap[r.property_id] = { sum: 0, count: 0 };
                ratingsMap[r.property_id].sum += Number(r.rating);
                ratingsMap[r.property_id].count++;
            });

            const personal: StatProperty[] = listingsData.map((listing) => {
                const p = (listing as any).properties || {};
                const stats = ratingsMap[(listing as any).property_id];
                const propId = (listing as any).property_id;
                const addedBy = (listing as any).added_by;
                return {
                    id: listing.id,
                    title: p.title || "",
                    creator: addedByMap[addedBy] || "Usuario",
                    type: "user" as const,
                    listing_type: listing.listing_type,
                    neighborhood: p.neighborhood || "",
                    city: p.city || "",
                    total_cost: Number(p.total_cost || 0),
                    sq_meters: Number(p.m2_total || 0),
                    rooms: p.rooms || 0,
                    status: listing.current_status,
                    average_rating: stats ? stats.sum / stats.count : 0,
                    total_votes: stats ? stats.count : 0,
                    created_at: listing.created_at,
                    url: p.source_url || "",
                    discardReasons: discardReasonsMap[propId] || [],
                };
            });
            setPersonalProps(personal);
            setTotalPersonalCount(listingsRes.count || 0);
        } catch (e: unknown) {
            toast({ title: "Error en estadísticas personales", description: e instanceof Error ? e.message : "Error desconocido", variant: "destructive" });
        } finally {
            setLoadingPersonal(false);
        }
    };

    const handleSort = (key: keyof StatProperty) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const currentProps = statsSubTab === "marketplace" ? marketProps : personalProps;
    const sortedStats = [...currentProps].sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        if (sortConfig.key === 'discardReasons') {
            const sum = (arr: { count: number }[] | undefined) => (arr || []).reduce((s, r) => s + r.count, 0);
            aVal = sum(a.discardReasons);
            bVal = sum(b.discardReasons);
        }
        if (typeof aVal === 'string' && typeof bVal === 'string') {
            return sortConfig.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }
        if (typeof aVal === 'number' && typeof bVal === 'number') {
            return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }
        return 0;
    });

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-end">
                <button
                    title="Refrescar datos"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground border border-border disabled:opacity-50 flex items-center gap-2"
                >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                    <span className="text-sm font-medium">Refrescar</span>
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/20 flex items-center justify-center">
                            <Home className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="font-bold text-foreground">Publicaciones</h4>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Marketplace</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-end">
                            <span className="text-3xl font-black text-foreground">{stats?.properties.total}</span>
                            <span className="text-xs text-muted-foreground mb-1">TOTAL</span>
                        </div>
                        <div className="pt-3 border-t border-border/50 space-y-2">
                            {stats?.properties.breakdown.map(b => (
                                <div key={b.label} className="flex justify-between text-xs font-medium">
                                    <span className="text-muted-foreground">{b.label}</span>
                                    <span className={b.color}>{b.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 flex items-center justify-center">
                            <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="font-bold text-foreground">Agencias</h4>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Socios HF</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-end">
                            <span className="text-3xl font-black text-foreground">{stats?.agencies.total}</span>
                            <span className="text-xs text-muted-foreground mb-1">TOTAL</span>
                        </div>
                        <div className="pt-3 border-t border-border/50 space-y-2">
                            {stats?.agencies.breakdown.map(b => (
                                <div key={b.label} className="flex justify-between text-xs font-medium">
                                    <span className="text-muted-foreground">{b.label}</span>
                                    <span className={b.color}>{b.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-900/20 flex items-center justify-center">
                            <Users2 className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="font-bold text-foreground">Usuarios</h4>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Clientes</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-end">
                            <span className="text-3xl font-black text-foreground">{stats?.users.total}</span>
                            <span className="text-xs text-muted-foreground mb-1">REGISTRADOS</span>
                        </div>
                        <div className="pt-3 border-t border-border/50 space-y-2">
                            {stats?.users.breakdown.map(b => (
                                <div key={b.label} className="flex justify-between text-xs font-medium">
                                    <span className="text-muted-foreground">{b.label}</span>
                                    <span className={b.color}>{b.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-900/20 flex items-center justify-center">
                            <Shield className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="font-bold text-foreground">Admin</h4>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Sistema</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-end">
                            <span className="text-3xl font-black text-foreground">{stats?.admins}</span>
                            <span className="text-xs text-muted-foreground mb-1">ADMINS</span>
                        </div>
                    </div>
                </div>
            </div>

            <EstadisticasTab
                statProps={sortedStats}
                loadingStats={statsSubTab === "marketplace" ? loadingMarket : loadingPersonal}
                sortConfig={sortConfig}
                handleSort={handleSort}
                page={statsSubTab === "marketplace" ? pageMarket : pagePersonal}
                setPage={statsSubTab === "marketplace" ? setPageMarket : setPagePersonal}
                totalCount={statsSubTab === "marketplace" ? totalMarketCount : totalPersonalCount}
                pageSize={PAGE_SIZE}
                subTab={statsSubTab}
                onSubTabChange={setStatsSubTab}
            />
        </div>
    );
}
