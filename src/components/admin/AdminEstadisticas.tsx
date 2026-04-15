/**
 * ARCHIVO: AdminEstadisticas.tsx
 * Estadísticas generales de la plataforma - adaptado al nuevo esquema.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, RefreshCw, Bot, TrendingUp } from "lucide-react";
import { AdminInteres } from "./AdminInteres";
import { StatProperty } from "@/types/admin-publications";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { calculateMatches, SearchProfile } from "@/hooks/usePropertyMatches";
import { AdminScrapeUsageTable } from "./estadisticas/AdminScrapeUsageTable";
import { AdminStatsSummaryCards } from "./estadisticas/AdminStatsSummaryCards";
import type { ScrapeUsageRow, Stats } from "./estadisticas/adminEstadisticasTypes";
import { useAdminEstadisticasController } from "./estadisticas/useAdminEstadisticasController";

export function AdminEstadisticas() {
    const { toast } = useToast();
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [marketProps, setMarketProps] = useState<StatProperty[]>([]);
    const [personalProps, setPersonalProps] = useState<StatProperty[]>([]);
    const [_loadingMarket, setLoadingMarket] = useState(true);
    const [_loadingPersonal, setLoadingPersonal] = useState(true);
    const [_totalMarketCount, setTotalMarketCount] = useState(0);
    const [_totalPersonalCount, setTotalPersonalCount] = useState(0);
    const PAGE_SIZE = 50;
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [scrapeUsageRows, setScrapeUsageRows] = useState<ScrapeUsageRow[]>([]);
    const [loadingScrapeUsage, setLoadingScrapeUsage] = useState(true);
    const {
        pageMarket,
        pagePersonal,
        mainTab,
        setMainTab,
    } = useAdminEstadisticasController(marketProps, personalProps);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await Promise.all([fetchStats(), fetchMarketStats(), fetchPersonalStats(), fetchScrapeUsage()]);
        setIsRefreshing(false);
    };

    useEffect(() => { fetchStats(); }, []);
    useEffect(() => { fetchMarketStats(); }, [pageMarket]);
    useEffect(() => { fetchPersonalStats(); }, [pagePersonal]);
    
    useEffect(() => { fetchScrapeUsage(); }, []);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const [profilesRes, rolesRes] = await Promise.all([
                (supabase.from("profiles") as any).select("user_id, status"),
                (supabase.from("user_roles") as any).select("user_id, role"),
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
            let sysAdminsCount = 0;

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
                if (roles.includes('sysadmin')) sysAdminsCount++;
            });

            // Count agents by agencymember role in user_roles
            const { data: agentRoleMembers } = await (supabase.from("user_roles") as any).select("user_id").eq("role", "agencymember");
            const agentStats = { total: 0, active: 0, pending: 0, suspended: 0 };

            if (agentRoleMembers && agentRoleMembers.length > 0) {
                agentStats.total = agentRoleMembers.length;
                const agentUserIds = agentRoleMembers.map((m: any) => m.user_id);
                const { data: agentProfiles } = await (supabase.from("profiles") as any).select("user_id, status").in("user_id", agentUserIds);
                agentProfiles?.forEach((p: any) => {
                    if (p.status === 'active') agentStats.active++;
                    else if (p.status === 'pending') agentStats.pending++;
                    else if (p.status === 'suspended') agentStats.suspended++;
                });
            }

            // Count agent_publications - get ALL statuses, not just paginated
            const pubTotal = await (supabase.from("agent_publications") as any).select("id", { count: "exact", head: true });
            const { data: allPubData } = await (supabase.from("agent_publications") as any).select("status");

            const propStats = { active: 0, paused: 0, closed: 0, other: 0 };
            allPubData?.forEach((p) => {
                if (p.status === 'disponible') propStats.active++;
                else if (p.status === 'pausado') propStats.paused++;
                else if (['vendido', 'alquilado'].includes(p.status)) propStats.closed++;
                else propStats.other++;
            });

            setStats({
                properties: {
                    total: pubTotal.count || 0,
                    breakdown: [
                        { label: "Activas", count: propStats.active, color: "text-emerald-500" },
                        { label: "Pausadas", count: propStats.paused, color: "text-amber-500" },
                        { label: "Cerradas", count: propStats.closed, color: "text-blue-500" },
                        { label: "Otras", count: propStats.other, color: "text-muted-foreground" },
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
                agents: {
                    total: agentStats.total,
                    breakdown: [
                        { label: "Activos", count: agentStats.active, color: "text-emerald-500" },
                        { label: "Pendientes", count: agentStats.pending, color: "text-amber-500" },
                        { label: "Suspendidos", count: agentStats.suspended, color: "text-orange-500" },
                    ]
                },
                admins: {
                    total: adminsCount + sysAdminsCount,
                    breakdown: [
                        { label: "Admins", count: adminsCount, color: "text-amber-500" },
                        { label: "SysAdmins", count: sysAdminsCount, color: "text-red-500" },
                    ]
                },
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
            const [pubRes, ratingsRes, insightsRes, searchProfilesRes] = await Promise.all([
                (supabase.from("agent_publications") as any)
                    .select("*, properties(title, source_url, neighborhood, city, total_cost, m2_total, rooms, currency, city_id, neighborhood_id, price_amount, price_expenses), organizations(name)", { count: "exact" })
                    .order('created_at', { ascending: false })
                    .range(from, to),
                (supabase.from("property_reviews") as any).select("property_id, rating"),
                Promise.resolve({ data: [] }),
                (supabase.from("user_search_profiles") as any).select("id, user_id, operation, currency, min_budget, max_budget, min_bedrooms, city_id, neighborhood_ids, is_private, updated_at, created_at"),
            ]);
            if (pubRes.error) throw pubRes.error;
            const pubData = pubRes.data || [];
            const ratingsData: any[] = ratingsRes.data || [];
            const insightsData: { property_id: string; attribute_name: string; total_scores: number }[] = insightsRes.data || [];
            const searchProfilesData: SearchProfile[] = searchProfilesRes.data || [];

            // Obtener datos de contacto de los perfiles DIRECTAMENTE de profiles (admin puede ver todo)
            const userIds = [...new Set(searchProfilesData.map((p) => p.user_id).filter(Boolean))];
            let contactByUserId: Record<string, { display_name?: string | null; phone?: string | null }> = {};
            if (userIds.length > 0) {
                const { data: profilesData } = await (supabase
                    .from("profiles") as any)
                    .select("user_id, display_name, phone")
                    .in("user_id", userIds);
                
                if (profilesData) {
                    contactByUserId = (profilesData as any[]).reduce((acc: any, profile: any) => {
                        acc[profile.user_id] = { display_name: profile.display_name, phone: profile.phone };
                        return acc;
                    }, {});
                }
            }

            // Enriquecer perfiles con datos de contacto
            const enrichedSearchProfiles = searchProfilesData.map((profile) => ({
                ...profile,
                display_name: contactByUserId[profile.user_id]?.display_name,
                phone: contactByUserId[profile.user_id]?.phone,
            }));

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
                
                // Calcular matches para esta propiedad
                const propertyForMatch = {
                    listing_type: pub.listing_type as "rent" | "sale",
                    currency: p.currency,
                    total_cost: Number(p.total_cost || 0),
                    price_amount: Number(p.price_amount || 0),
                    price_expenses: Number(p.price_expenses || 0),
                    rooms: p.rooms || 0,
                    city_id: p.city_id,
                    neighborhood_id: p.neighborhood_id,
                };

                const matches = calculateMatches(propertyForMatch, enrichedSearchProfiles, true);
                
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
                    matchCount: matches.length,
                    matches: matches.map(m => ({
                        id: m.id,
                        user_id: m.user_id,
                        display_name: m.display_name,
                        phone: m.phone,
                        is_private: m.is_private,
                    })),
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
            const [listingsRes, ratingsRes, insightsRes, searchProfilesRes] = await Promise.all([
                (supabase.from("user_listings") as any)
                    .select("*, properties(title, source_url, neighborhood, city, total_cost, m2_total, rooms, currency, city_id, neighborhood_id, price_amount, price_expenses)", { count: "exact" })
                    .order('created_at', { ascending: false })
                    .range(from, to),
                (supabase.from("property_reviews") as any).select("property_id, rating"),
                Promise.resolve({ data: [] }),
                (supabase.from("user_search_profiles") as any).select("id, user_id, operation, currency, min_budget, max_budget, min_bedrooms, city_id, neighborhood_ids, is_private, updated_at, created_at"),
            ]);
            if (listingsRes.error) throw listingsRes.error;
            const listingsData = listingsRes.data || [];
            const ratingsData: any[] = ratingsRes.data || [];
            const insightsData: { property_id: string; attribute_name: string; total_scores: number }[] = insightsRes.data || [];
            const searchProfilesData: SearchProfile[] = searchProfilesRes.data || [];

            // Obtener datos de contacto de los perfiles DIRECTAMENTE de profiles (admin puede ver todo)
            const userIds = [...new Set(searchProfilesData.map((p) => p.user_id).filter(Boolean))];
            let contactByUserId: Record<string, { display_name?: string | null; phone?: string | null }> = {};
            if (userIds.length > 0) {
                const { data: profilesData } = await supabase
                    .from("profiles")
                    .select("user_id, display_name, phone")
                    .in("user_id", userIds);
                
                if (profilesData) {
                    contactByUserId = (profilesData as any[]).reduce((acc: any, profile: any) => {
                        acc[profile.user_id] = { display_name: profile.display_name, phone: profile.phone };
                        return acc;
                    }, {});
                }
            }

            // Enriquecer perfiles con datos de contacto
            const enrichedSearchProfiles = searchProfilesData.map((profile) => ({
                ...profile,
                display_name: contactByUserId[profile.user_id]?.display_name,
                phone: contactByUserId[profile.user_id]?.phone,
            }));

            const addedByIds = [...new Set((listingsData as { added_by?: string }[]).map((l) => l.added_by).filter(Boolean))];
            let addedByMap: Record<string, string> = {};
            if (addedByIds.length > 0) {
                const { data: profilesData } = await (supabase.from("profiles") as any).select("user_id, display_name, email").in("user_id", addedByIds);
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
                
                // Calcular matches para esta propiedad
                const propertyForMatch = {
                    listing_type: listing.listing_type as "rent" | "sale",
                    currency: p.currency,
                    total_cost: Number(p.total_cost || 0),
                    price_amount: Number(p.price_amount || 0),
                    price_expenses: Number(p.price_expenses || 0),
                    rooms: p.rooms || 0,
                    city_id: p.city_id,
                    neighborhood_id: p.neighborhood_id,
                };

                const matches = calculateMatches(propertyForMatch, enrichedSearchProfiles, true);
                
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
                    matchCount: matches.length,
                    matches: matches.map(m => ({
                        id: m.id,
                        user_id: m.user_id,
                        display_name: m.display_name,
                        phone: m.phone,
                        is_private: m.is_private,
                    })),
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

    const fetchScrapeUsage = async () => {
        setLoadingScrapeUsage(true);
        try {
            const { data, error } = await supabase
                .from("admin_scrape_usage_by_user" as any)
                .select("*")
                .order("total_token_charged", { ascending: false })
                .limit(200);
            if (error) throw error;
            setScrapeUsageRows((data || []) as unknown as ScrapeUsageRow[]);
        } catch (e: unknown) {
            toast({
                title: "Error en métricas de scraping",
                description: e instanceof Error ? e.message : "Error desconocido",
                variant: "destructive",
            });
        } finally {
            setLoadingScrapeUsage(false);
        }
    };

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
            <AdminStatsSummaryCards stats={stats} />

            <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as "interes" | "scraping")} className="space-y-4">
                <TabsList className="grid w-full max-w-[420px] grid-cols-2 rounded-xl">
                    <TabsTrigger value="interes" className="flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4" />
                        Interés
                    </TabsTrigger>
                    <TabsTrigger value="scraping" className="flex items-center gap-1.5">
                        <Bot className="w-4 h-4" />
                        Scraping
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="interes" className="space-y-4">
                    <AdminInteres />
                </TabsContent>

                <TabsContent value="scraping" className="space-y-4">
                    <AdminScrapeUsageTable
                        rows={scrapeUsageRows}
                        loading={loadingScrapeUsage}
                        onRefresh={fetchScrapeUsage}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
