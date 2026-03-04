import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserStatus } from "@/types/property";

/**
 * Perfil del usuario actual, leído desde la tabla `profiles`.
 * Incluye el status centralizado para controlar el acceso a la plataforma.
 */
export interface UserProfile {
    userId: string;
    displayName: string;
    avatarUrl: string;
    phone: string;
    status: UserStatus;
}

/**
 * Hook centralizado para leer el perfil del usuario autenticado.
 * Reemplaza los múltiples `useEffect + supabase.from("profiles")` dispersos.
 *
 * Ejemplo de uso:
 *   const { profile, isLoading } = useProfile();
 *   if (profile?.status !== "active") return <UserStatusBanner status={profile.status} />;
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
                .select("user_id, display_name, avatar_url, phone, status")
                .eq("user_id", user.id)
                .single();

            if (error) throw error;
            if (!data) return null;

            return {
                userId: data.user_id,
                displayName: data.display_name || "",
                avatarUrl: data.avatar_url || "",
                phone: data.phone || "",
                status: (data.status as UserStatus) || "active",
            };
        },
        // Refrescar cuando el componente monta — status puede cambiar desde el admin
        staleTime: 0,
    });
}
