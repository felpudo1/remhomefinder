import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bookmark, Building2, CheckCircle, PauseCircle, Loader2, TrendingUp, Trophy } from "lucide-react";
import { Agency } from "./AgentProfile";

interface AgentEstadisticasProps {
    agency: Agency;
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
        </div>
    );
};
