import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bookmark, Building2, CheckCircle, PauseCircle, Loader2, TrendingUp, Trophy, Star, Users, ExternalLink, ChevronUp, ChevronDown, BarChart3, Eye } from "lucide-react";
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
    url: string;
    listing_type: string;
}

export const AgentEstadisticas = ({ agency }: AgentEstadisticasProps) => {
    const { data: properties = [], isLoading: propsLoading } = useQuery({
        queryKey: ["agency-properties-stats", agency.id],
        enabled: !!agency,
        queryFn: async () => {
            const { data, error } = await supabase
                .from("marketplace_properties")
                .select("status, price_rent, sq_meters")
                .eq("agency_id", agency.id);
            if (error) throw error;
            return data || [];
        },
    });

    const { data: statsData, isLoading: statsLoading } = useQuery({
        queryKey: ["agency-dashboard-stats", agency.id],
        enabled: !!agency,
        queryFn: async () => {
            const { data, error } = await supabase.rpc("get_agency_dashboard_stats" as any, { p_agency_id: agency.id } as any);
            if (error) throw error;
            return (data as any) as { total_saved: number; top_properties: any[] };
        },
    });

    // Query para rendimiento detallado por aviso
    const { data: performanceData = [], isLoading: performanceLoading } = useQuery({
        queryKey: ["agency-performance-detailed", agency.id],
        enabled: !!agency,
        queryFn: async (): Promise<PropertyPerformance[]> => {
            const { data, error } = await supabase.rpc("get_agency_performance_detailed" as any, {
                p_agency_id: agency.id,
            } as any);

            if (error) throw error;
            return (data as PropertyPerformance[]) || [];
        }
    });

    const [sortConfig, setSortConfig] = useState<{ key: keyof PropertyPerformance, direction: 'asc' | 'desc' }>({
        key: 'saves',
        direction: 'desc'
    });

    if (propsLoading || statsLoading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const activeCount = properties.filter(p => p.status === "active").length;
    const pausedCount = properties.filter(p => p.status === "paused").length;
    const soldCount = properties.filter(p => p.status === "sold" || p.status === "rented").length;
    const totalSaves = statsData?.total_saved || 0;
    const topProps = statsData?.top_properties || [];

    const handleSort = (key: keyof PropertyPerformance) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const sortedPerformance = [...performanceData].sort((a, b) => {
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

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Guardados / Tasa Interes */}
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

                {/* Activas */}
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

                {/* Pausadas */}
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

                {/* Vendidas/Alquiladas */}
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-border shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-yellow-500" />
                            Top 3 Propiedades (Más guardadas)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {topProps.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-4 text-center">Todavía no tenés avisos guardados por usuarios.</p>
                        ) : (
                            <ul className="space-y-4">
                                {topProps.map((p, index) => (
                                    <li key={p.id} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs">
                                                {index + 1}
                                            </div>
                                            <span className="text-sm font-medium truncate max-w-[200px]">{p.title}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-2.5 py-1 rounded-full text-xs font-semibold">
                                            <Bookmark className="w-3.5 h-3.5" /> {p.saves}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-border shadow-sm bg-primary/5">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2 text-primary">
                            <TrendingUp className="w-5 h-5" />
                            Resumen del Mes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Las estadísticas de "Veces Guardada" te permiten evaluar si el precio y condiciones de
                            tus inmuebles resultan atractivos para los usuarios de la plataforma en relación con el mercado actual.
                        </p>
                        <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                            Te recomendamos ajustar precios o destacar en tus redes aquellas propiedades con buen volumen de guardados.
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Nueva Tabla de Rendimiento Detallado */}
            <Card className="border-border shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-primary" />
                            Rendimiento por Aviso
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">Análisis detallado de guardados y valoraciones del mercado.</p>
                    </div>
                </CardHeader>
                <CardContent>
                    {performanceLoading ? (
                        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
                    ) : performanceData.length === 0 ? (
                        <p className="text-sm text-center py-10 text-muted-foreground">No hay avisos para mostrar.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-border bg-muted/30">
                                        {[
                                            { key: 'title', label: 'Aviso', icon: Building2 },
                                            { key: 'saves', label: 'Guardados', icon: Bookmark },
                                            { key: 'views', label: 'Vistas', icon: Eye },
                                            { key: 'votes', label: 'Votantes', icon: Users },
                                            { key: 'rating', label: 'Rating', icon: Star },
                                        ].map((col) => (
                                            <th key={col.key} className="p-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                                <button
                                                    onClick={() => handleSort(col.key as keyof PropertyPerformance)}
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
                                        <th className="p-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-right">Link</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {sortedPerformance.map((p) => (
                                        <tr key={p.id} className="hover:bg-muted/30 transition-colors text-xs">
                                            <td className="p-3">
                                                <div className="font-semibold truncate max-w-[250px]">{p.title}</div>
                                                <div className="flex gap-1.5 mt-0.5">
                                                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-medium border ${p.status === 'active' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-muted text-muted-foreground border-border"
                                                        }`}>
                                                        {p.status}
                                                    </span>
                                                    <span className="text-[9px] text-muted-foreground uppercase">{p.listing_type === 'sale' ? 'Venta' : 'Alquiler'}</span>
                                                </div>
                                            </td>
                                            <td className="p-3 font-medium">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-24 bg-muted h-1.5 rounded-full overflow-hidden">
                                                        <div
                                                            className="bg-primary h-full rounded-full"
                                                            style={{ width: `${Math.min((p.saves / (totalSaves || 1)) * 100, 100)}%` }}
                                                        />
                                                    </div>
                                                    <span>{p.saves}</span>
                                                </div>
                                            </td>
                                            <td className="p-3 text-muted-foreground">
                                                {p.views || 0}
                                            </td>
                                            <td className="p-3 text-muted-foreground">
                                                {p.votes} personas
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-1.5 font-bold text-amber-500">
                                                    <Star className={`w-3 h-3 ${p.rating > 0 ? "fill-current" : ""}`} />
                                                    {p.rating > 0 ? p.rating.toFixed(1) : "—"}
                                                </div>
                                            </td>
                                            <td className="p-3 text-right">
                                                {p.url && (
                                                    <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
                                                        <ExternalLink className="w-4 h-4" />
                                                    </a>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
