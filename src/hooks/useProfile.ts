import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/contexts/AuthProvider";
import { UserStatus } from "@/types/property";

/**
 * Perfil del usuario actual, leído desde la tabla `profiles`.
 * Incluye el status centralizado (active | pending | suspended | rejected) para controlar el acceso a la plataforma.
 */
export interface UserProfile {
    userId: string;
    displayName: string;
    avatarUrl: string;
    phone: string;
    email: string | null;
    status: UserStatus;
    referredById: string | null;
    /** Fecha de aprobación (cuenta activa); null si aún no aplica o datos viejos */
    approvedAt: string | null;
}

/**
 * Hook centralizado para leer el perfil del usuario autenticado desde la tabla `profiles`.
 * Usa TanStack Query; el status (active | pending | suspended | rejected) es el source of truth para acceso a la app.
 *
 * @returns Resultado de useQuery: data = UserProfile | null, isLoading, error, refetch, etc.
 *   - profile (data): null si no hay usuario o no se pudo cargar; incluye userId, displayName, avatarUrl, phone, email, status, referredById.
 *   - staleTime: 0 para refrescar al montar y poder ver cambios hechos desde el admin (ej. aprobación de agente).
 *
 * @example
 * const { data: profile, isLoading } = useProfile();
 * if (profile?.status !== "active") return <UserStatusBanner status={profile.status} />;
 */
export function useProfile() {
    // Leer userId desde el AuthProvider centralizado (0 auth requests HTTP)
    const { user: authUser } = useCurrentUser();

    return useQuery({
        queryKey: ["profile", "current", authUser?.id],
        enabled: !!authUser,
        queryFn: async (): Promise<UserProfile | null> => {
            // El user ya viene del AuthProvider — no necesitamos llamar a getUser()
            if (!authUser) return null;

            // approved_at and logo_url added via migration; types.ts may lag behind
            const { data, error } = await supabase
                .from("profiles")
                .select("user_id, display_name, avatar_url, phone, status, referred_by_id, email, approved_at")
                .eq("user_id", authUser.id)
                .single() as { data: any; error: any };

            if (error) throw error;
            if (!data) return null;

            return {
                userId: data.user_id,
                displayName: data.display_name || "",
                avatarUrl: data.avatar_url || "",
                phone: data.phone || "",
                email: data.email || null,
                status: (data.status as UserStatus) || "active",
                referredById: data.referred_by_id || null,
                approvedAt: data.approved_at ?? null,
            };
        },
        // Cachear perfil 5 minutos — evita auth requests excesivas en cada mount.
        // Los cambios desde el admin (ej. aprobación) se reflejan con delay máximo de 5 min.
        staleTime: 5 * 60 * 1000,
    });
}
