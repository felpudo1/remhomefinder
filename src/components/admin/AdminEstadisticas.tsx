import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Home, Building2, MessageSquare, Users2, Loader2, TrendingUp } from "lucide-react";

interface Stats {
    totalProperties: number;
    totalAgencies: number;
    pendingAgencies: number;
    totalUsers: number;
}

/**
 * Sección de estadísticas generales de la plataforma.
 * Muestra métricas clave del sistema.
 */
export function AdminEstadisticas() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        setLoading(true);
        const [propertiesRes, agenciesRes, pendingRes, usersRes] = await Promise.all([
            supabase.from("properties").select("id", { count: "exact", head: true }),
            supabase.from("agencies").select("id", { count: "exact", head: true }),
            supabase
                .from("profiles")
                .select("user_id, status, user_roles!inner(role)")
                .eq("status", "pending")
                .eq("user_roles.role", "agency"),
            supabase.from("user_roles").select("user_id", { count: "exact", head: true }),
        ]);

        const pendingAgencies = pendingRes.data?.length || 0;

        setStats({
            totalProperties: propertiesRes.count || 0,
            totalAgencies: agenciesRes.count || 0,
            pendingAgencies,
            totalUsers: usersRes.count || 0,
        });
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const cards = [
        {
            label: "Propiedades totales",
            value: stats?.totalProperties ?? 0,
            icon: Home,
            color: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
        },
        {
            label: "Agencias registradas",
            value: stats?.totalAgencies ?? 0,
            icon: Building2,
            color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
        },
        {
            label: "Agencias pendientes",
            value: stats?.pendingAgencies ?? 0,
            icon: TrendingUp,
            color: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
        },
        {
            label: "Usuarios con roles",
            value: stats?.totalUsers ?? 0,
            icon: Users2,
            color: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
        },
    ];

    return (
        <div>
            <div className="grid grid-cols-2 gap-4 mb-8">
                {cards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <div key={card.label} className="rounded-xl border border-border bg-background p-5 flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${card.color}`}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">{card.value.toLocaleString("es-AR")}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <p className="text-xs text-center text-muted-foreground/60">
                Datos actualizados en tiempo real desde Supabase.
            </p>
        </div>
    );
}
