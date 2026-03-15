/**
 * ARCHIVO: AdminEstadisticas.tsx
 * Estadísticas generales de la plataforma - adaptado al nuevo esquema.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Home, Building2, TrendingUp, Users2, Loader2, BarChart3, Shield } from "lucide-react";
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
    const [statProps, setStatProps] = useState<StatProperty[]>([]);
    const [loadingStats, setLoadingStats] = useState(true);
    const [page, setPage] = useState(0);
    const [totalUnifiedCount, setTotalUnifiedCount] = useState(0);
    const PAGE_SIZE = 50;
    const [sortConfig, setSortConfig] = useState<{ key: keyof StatProperty; direction: 'asc' | 'desc' }>({
        key: 'created_at',
        direction: 'desc'
    });

    useEffect(() => { fetchStats(); }, []);
    useEffect(() => { fetchAllStats(); }, [page, sortConfig]);

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

            profilesRes.data?.forEach((p: any) => {
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
            pubData?.forEach((p: any) => {
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
        } catch (e: any) {
            console.error("Error en dashboard stats:", e);
            toast({ title: "Error al cargar dashboard", description: e.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const fetchAllStats = async () => {
        setLoadingStats(true);
        try {
            const from = page * (PAGE_SIZE / 2);
            const to = from + (PAGE_SIZE / 2) - 1;

            const [pubRes, listingsRes, ratingsRes] = await Promise.all([
                supabase.from("agent_publications")
                    .select("*, properties(title, source_url, neighborhood, city, total_cost, m2_total, rooms), organizations(name)", { count: "exact" })
                    .order('created_at', { ascending: false })
                    .range(from, to),
                supabase.from("user_listings")
                    .select("*, properties(title, source_url, neighborhood, city, total_cost, m2_total, rooms)", { count: "exact" })
                    .order('created_at', { ascending: false })
                    .range(from, to),
                supabase.from("property_reviews").select("property_id, rating"),
            ]);

            if (pubRes.error) throw pubRes.error;
            if (listingsRes.error) throw listingsRes.error;

            const pubData = pubRes.data || [];
            const listingsData = listingsRes.data || [];
            const ratingsData: any[] = ratingsRes.data || [];

            // Build ratings map
            const ratingsMap: Record<string, { sum: number; count: number }> = {};
            ratingsData.forEach(r => {
                if (!r.property_id || r.rating === null) return;
                if (!ratingsMap[r.property_id]) ratingsMap[r.property_id] = { sum: 0, count: 0 };
                ratingsMap[r.property_id].sum += Number(r.rating);
                ratingsMap[r.property_id].count++;
            });

            const unified: StatProperty[] = [
                ...pubData.map((pub: any) => {
                    const p = pub.properties || {};
                    const stats = ratingsMap[pub.property_id];
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
                        cr: 0,
                        created_at: pub.created_at,
                        url: p.source_url || "",
                    };
                }),
                ...listingsData.map((listing: any) => {
                    const p = listing.properties || {};
                    const stats = ratingsMap[listing.property_id];
                    return {
                        id: listing.id,
                        title: p.title || "",
                        creator: "Usuario",
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
                        views_count: 0,
                        cr: 0,
                        created_at: listing.created_at,
                        url: p.source_url || "",
                    };
                })
            ];

            setStatProps(unified);
            setTotalUnifiedCount((pubRes.count || 0) + (listingsRes.count || 0));
        } catch (e: any) {
            toast({ title: "Error en estadísticas", description: e.message, variant: "destructive" });
        } finally {
            setLoadingStats(false);
        }
    };

    const handleSort = (key: keyof StatProperty) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const sortedStats = [...statProps].sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
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
                loadingStats={loadingStats}
                sortConfig={sortConfig}
                handleSort={handleSort}
                page={page}
                setPage={setPage}
                totalCount={totalUnifiedCount}
                pageSize={PAGE_SIZE}
            />
        </div>
    );
}
