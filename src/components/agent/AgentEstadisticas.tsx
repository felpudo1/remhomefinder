/**
 * AgentEstadisticas - Panel de estadísticas del agente.
 * Adaptado al nuevo esquema (agent_publications + user_listings).
 */
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bookmark, Building2, CheckCircle, PauseCircle, Loader2, TrendingUp, Trophy, Star, Users, ExternalLink, ChevronUp, ChevronDown, BarChart3, Eye, Percent, Calendar } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Agency } from "./AgentProfile";

interface AgentEstadisticasProps {
    agency: Agency;
}

interface PropertyPerformance {
    id: string;
    title: string;
    status: string;
    saves: number;
    rating: number;
    views: number;
    votes: number;
    url: string;
    listing_type: string;
}

export const AgentEstadisticas = ({ agency }: AgentEstadisticasProps) => {
    const { data: properties = [], isLoading: propsLoading } = useQuery({
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

    const { data: statsData, isLoading: statsLoading } = useQuery({
        queryKey: ["agency-dashboard-stats", agency.id],
        enabled: !!agency,
        queryFn: async () => {
            // Count saves: user_listings with source_publication_id pointing to our publications
            const pubIds = properties.map((p: any) => p.id || "").filter(Boolean);
            if (pubIds.length === 0) return { total_saved: 0, top_properties: [] };

            const { data: saves, error } = await supabase
                .from("user_listings")
                .select("source_publication_id")
                .in("source_publication_id", pubIds);

            if (error) return { total_saved: 0, top_properties: [] };

            const saveCountMap: Record<string, number> = {};
            (saves || []).forEach(s => {
                if (s.source_publication_id) {
                    saveCountMap[s.source_publication_id] = (saveCountMap[s.source_publication_id] || 0) + 1;
                }
            });

            const total_saved = Object.values(saveCountMap).reduce((a, b) => a + b, 0);
            return { total_saved, top_properties: [] };
        },
    });

    const { data: chartData = [], isLoading: chartLoading } = useQuery({
        queryKey: ["agency-historical-stats", agency.id],
        enabled: !!agency,
        queryFn: async () => {
            const { data: viewsData } = await supabase
                .from("property_views_log")
                .select("created_at")
                .gte("created_at", subDays(new Date(), 14).toISOString());

            const last14Days = Array.from({ length: 14 }, (_, i) => {
                const date = subDays(new Date(), 13 - i);
                return { dateLabel: format(date, 'dd MMM', { locale: es }), _idDate: date, saves: 0, views: 0 };
            });

            viewsData?.forEach((v: any) => {
                const day = last14Days.find(d => isSameDay(d._idDate, parseISO(v.created_at)));
                if (day) day.views++;
            });

            return last14Days.map(({ _idDate, ...rest }) => rest);
        }
    });

    const [sortConfig, setSortConfig] = useState<{ key: keyof PropertyPerformance, direction: 'asc' | 'desc' }>({
        key: 'saves', direction: 'desc'
    });

    if (propsLoading || statsLoading) {
        return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    }

    const activeCount = properties.filter((p: any) => p.status === "disponible").length;
    const pausedCount = properties.filter((p: any) => p.status === "pausado").length;
    const soldCount = properties.filter((p: any) => p.status === "vendido" || p.status === "alquilado").length;
    const totalSaves = statsData?.total_saved || 0;

    return (
        <div className="space-y-6">
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
        </div>
    );
};
