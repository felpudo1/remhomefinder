import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
    return useQuery({
        queryKey: ["profile", "current"],
        queryFn: async (): Promise<UserProfile | null> => {
            // Obtener el usuario autenticado primero
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;

            const { data, error } = await supabase
                .from("profiles")
                .select("user_id, display_name, avatar_url, phone, status, referred_by_id, email, approved_at")
                .eq("user_id", user.id)
                .single();

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
        // Refrescar cuando el componente monta — status puede cambiar desde el admin
        staleTime: 0,
    });
}
