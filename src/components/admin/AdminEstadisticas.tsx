/**
 * ARCHIVO: AdminEstadisticas.tsx
 * DESCRIPCIÓN: Sección de estadísticas generales de la plataforma.
 * Muestra métricas clave del sistema y la tabla de auditoría detallada.
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

    // Estado para estadísticas detalladas (migrado de AdminPublicaciones)
    const [statProps, setStatProps] = useState<StatProperty[]>([]);
    const [loadingStats, setLoadingStats] = useState(true);
    const [page, setPage] = useState(0);
    const [totalUnifiedCount, setTotalUnifiedCount] = useState(0);
    const PAGE_SIZE = 50;
    const [sortConfig, setSortConfig] = useState<{ key: keyof StatProperty; direction: 'asc' | 'desc' }>({
        key: 'created_at',
        direction: 'desc'
    });

    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        fetchAllStats();
    }, [page, sortConfig]);

    const fetchStats = async () => {
        setLoading(true);
        try {
            // 1. Obtener perfiles y roles por separado para evitar errores de join
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

            // Procesar desgloses de Agencias y Usuarios en memoria
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

                if (roles.includes('admin')) {
                    adminsCount++;
                }
            });

            // 2. Agencias (validación extra por tabla agencies si es necesario, pero profiles+role es la fuente de verdad del estado)
            const agenciesTotalRes = await supabase.from("agencies").select("id", { count: "exact", head: true });

            // 3. Propiedades (Marketplace)
            const mktTotal = await supabase.from("marketplace_properties").select("id", { count: "exact", head: true });
            const { data: mktData, error: mktError } = await (supabase
                .from("marketplace_properties")
                .select("status") as any);

            if (mktError) throw mktError;

            const propStats = { active: 0, paused: 0, closed: 0 };
            mktData?.forEach(p => {
                if (p.status === 'active') propStats.active++;
                else if (p.status === 'paused') propStats.paused++;
                else if (['sold', 'rented'].includes(p.status)) propStats.closed++;
            });

            setStats({
                properties: {
                    total: mktTotal.count || 0,
                    breakdown: [
                        { label: "Activas", count: propStats.active, color: "text-emerald-500" },
                        { label: "Pausadas", count: propStats.paused, color: "text-amber-500" },
                        { label: "Cerradas", count: propStats.closed, color: "text-blue-500" },
                    ]
                },
                agencies: {
                    total: agenciesTotalRes.count || 0,
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

    /**
     * FUNCIÓN: fetchAllStats (Migrada)
     * Procesa la auditoría unificada de Marketplace y Usuarios personales.
     */
    const fetchAllStats = async () => {
        setLoadingStats(true);
        try {
            const from = page * (PAGE_SIZE / 2);
            const to = from + (PAGE_SIZE / 2) - 1;

            const [mktRes, userRes, ratingsRes] = await Promise.all([
                supabase.from("marketplace_properties")
                    .select("*, agencies(name)", { count: "exact" })
                    .order('created_at', { ascending: false })
                    .range(from, to),
                supabase.from("properties")
                    .select("*", { count: "exact" })
                    .order('created_at', { ascending: false })
                    .range(from, to),
                supabase.from("property_ratings" as any).select("*") as any,
            ]);

            if (mktRes.error) throw mktRes.error;
            if (userRes.error) throw userRes.error;
            if (ratingsRes.error) throw ratingsRes.error;

            const mktData = mktRes.data || [];
            const userData = userRes.data || [];
            const ratingsData: any[] = ratingsRes.data || [];

            const propToMktMap: Record<string, string> = {};
            userData.forEach(p => {
                if (p.source_marketplace_id) propToMktMap[p.id] = p.source_marketplace_id;
            });

            const globalMktStats: Record<string, { sum: number, count: number }> = {};
            const familyStats: Record<string, { sum: number, count: number }> = {};
            const mktIdSet = new Set(mktData.map((m: any) => m.id));

            ratingsData.forEach(r => {
                if (!r.property_id || r.rating === null) return;
                const ratingVal = Number(r.rating);
                if (isNaN(ratingVal)) return;

                const mktId = propToMktMap[r.property_id] || (mktIdSet.has(r.property_id) ? r.property_id : null);

                if (mktId) {
                    if (!globalMktStats[mktId]) globalMktStats[mktId] = { sum: 0, count: 0 };
                    globalMktStats[mktId].sum += ratingVal;
                    globalMktStats[mktId].count++;
                }

                if (!familyStats[r.property_id]) familyStats[r.property_id] = { sum: 0, count: 0 };
                familyStats[r.property_id].sum += ratingVal;
                familyStats[r.property_id].count++;
            });

            const savesMap: Record<string, number> = {};
            userData.forEach(p => {
                if (p.source_marketplace_id) {
                    savesMap[p.source_marketplace_id] = (savesMap[p.source_marketplace_id] || 0) + 1;
                }
            });

            const unified: StatProperty[] = [
                ...mktData.map((p: any) => {
                    const stats = globalMktStats[p.id];
                    const saves = savesMap[p.id] || 0;
                    return {
                        id: p.id,
                        title: p.title,
                        creator: p.agencies?.name || "Agencia",
                        type: "agency" as const,
                        listing_type: p.listing_type,
                        neighborhood: p.neighborhood,
                        city: p.city,
                        total_cost: p.total_cost,
                        sq_meters: p.sq_meters,
                        rooms: p.rooms,
                        status: p.status,
                        average_rating: stats ? stats.sum / stats.count : 0,
                        total_votes: stats ? stats.count : 0,
                        views_count: p.views_count || 0,
                        cr: p.views_count > 0 ? (saves / p.views_count) * 100 : 0,
                        created_at: p.created_at,
                        url: p.url,
                    };
                }),
                ...userData.map((p: any) => {
                    const stats = familyStats[p.id];
                    return {
                        id: p.id,
                        title: p.title,
                        creator: p.created_by_email,
                        type: "user" as const,
                        listing_type: p.listing_type,
                        neighborhood: p.neighborhood,
                        city: p.city,
                        total_cost: p.total_cost,
                        sq_meters: p.sq_meters,
                        rooms: p.rooms,
                        status: p.status,
                        average_rating: stats ? stats.sum / stats.count : 0,
                        total_votes: stats ? stats.count : 0,
                        views_count: p.views_count || 0,
                        cr: p.views_count > 0 ? (stats ? stats.count : 0) / p.views_count * 100 : 0,
                        created_at: p.created_at,
                        url: p.url,
                    };
                })
            ];

            setStatProps(unified);
            // El total unificado es la suma de los counts exactos de ambas tablas
            setTotalUnifiedCount((mktRes.count || 0) + (userRes.count || 0));
        } catch (e: any) {
            toast({ title: "Error en estadísticas", description: e.message, variant: "destructive" });
        } finally {
            setLoadingStats(false);
        }
    };

    const handleSort = (key: keyof StatProperty) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
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
                {/* Categoría: Propiedades */}
                <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/20 flex items-center justify-center">
                            <Home className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="font-bold text-foreground">Propiedades</h4>
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

                {/* Categoría: Agencias */}
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

                {/* Categoría: Usuarios */}
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

                {/* Categoría: Equipo */}
                <div className="bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-900/20 flex items-center justify-center">
                                <Shield className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-foreground">Control</h4>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Staff</p>
                            </div>
                        </div>
                        <div className="flex justify-between items-end mb-6">
                            <span className="text-3xl font-black text-foreground">{stats?.admins}</span>
                            <span className="text-xs text-muted-foreground mb-1">ADMINS</span>
                        </div>
                    </div>
                    <div className="bg-muted/40 rounded-xl p-3 text-[10px] text-center text-muted-foreground font-medium uppercase tracking-tighter">
                        Dashboard Maestro de Auditoría
                    </div>
                </div>
            </div>

            <div className="border-t border-border pt-8">
                <EstadisticasTab
                    statProps={statProps}
                    loadingStats={loadingStats}
                    fetchAllStats={fetchAllStats}
                    sortConfig={sortConfig}
                    handleSort={handleSort}
                    sortedStats={sortedStats}
                    // Props de paginación
                    page={page}
                    setPage={setPage}
                    totalCount={totalUnifiedCount}
                    pageSize={PAGE_SIZE}
                />
            </div>
        </div>
    );
}

