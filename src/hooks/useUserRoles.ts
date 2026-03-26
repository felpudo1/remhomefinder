import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppRole } from "@/types/supabase";

/**
 * Hook para obtener los roles del usuario con caché de React Query.
 * Previene peticiones redundantes a la tabla user_roles en cada navegación.
 */
export function useUserRoles(userId: string | undefined) {
  return useQuery({
    queryKey: ["user_roles", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      
      if (error) throw error;
      return (data?.map(r => r.role) as AppRole[]) || [];
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutos de caché para roles
    gcTime: 30 * 60 * 1000,    // 30 minutos de garbage collection
  });
}
