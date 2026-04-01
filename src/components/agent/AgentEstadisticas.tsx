/**
 * AgentEstadisticas - Panel de estadísticas del agente.
 * Adaptado al nuevo esquema (agent_publications + user_listings).
 * Incluye tabla de auditoría similar al admin, filtrada por propiedades del agente.
 */
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  Bookmark,
  Building2,
  CheckCircle,
  DollarSign,
  Eye,
  Loader2,
  MapPin,
  Maximize2,
  MessageSquare,
  PauseCircle,
  Star,
  Users,
} from "lucide-react";
import { format, isSameDay, parseISO, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { Agency } from "./AgentProfile";
import { StatProperty } from "@/types/admin-publications";
import { AgentInterestChart } from "./estadisticas/AgentInterestChart";
import { AgentMarketAuditTable } from "./estadisticas/AgentMarketAuditTable";
import { AgentStatsSummaryCards } from "./estadisticas/AgentStatsSummaryCards";
import type {
  AgentStatsColumn,
  AgentSummaryCardData,
} from "./estadisticas/agentEstadisticasTypes";
import { useAgentEstadisticasController } from "./estadisticas/useAgentEstadisticasController";

interface AgentEstadisticasProps {
    agency: Agency;
}

const PAGE_SIZE = 50;
const AGENT_STATS_COLS: AgentStatsColumn[] = [
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
    const [statsPage, setStatsPage] = useState(0);
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
                Promise.resolve({ data: [] }),
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
    const {
        sortConfig,
        sortedStats,
        handleSort,
    } = useAgentEstadisticasController(statProps);

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
    const summaryCards: AgentSummaryCardData[] = [
        {
            title: "Veces Guardada",
            value: totalSaves,
            description: "Interés total en tus avisos",
            icon: Bookmark,
            iconClassName: "text-primary",
        },
        {
            title: "Propiedades Activas",
            value: activeCount,
            description: "Publicadas en Marketplace",
            icon: CheckCircle,
            iconClassName: "text-green-500",
        },
        {
            title: "En Pausa",
            value: pausedCount,
            description: "Requieren atención",
            icon: PauseCircle,
            iconClassName: "text-yellow-500",
        },
        {
            title: "Vendidas/Alquiladas",
            value: soldCount,
            description: "Operaciones cerradas",
            icon: Building2,
            iconClassName: "text-primary/60",
        },
    ];

    return (
        <div className="space-y-6 flex flex-col">
            <AgentMarketAuditTable
                columns={AGENT_STATS_COLS}
                sortedStats={sortedStats}
                totalStatsCount={totalStatsCount}
                statsPage={statsPage}
                pageSize={PAGE_SIZE}
                sortConfig={sortConfig}
                isLoading={loadingStats}
                isRefreshing={isRefreshingTab}
                isDisabled={isRefreshingTab || statsLoading || propsLoading || chartLoading || loadingStats}
                onSort={handleSort}
                onRefresh={handleRefreshTab}
                onPreviousPage={() => setStatsPage((page) => Math.max(0, page - 1))}
                onNextPage={() => setStatsPage((page) => page + 1)}
            />

            <AgentStatsSummaryCards cards={summaryCards} />

            <AgentInterestChart chartData={chartData} isLoading={chartLoading} />
        </div>
    );
};
