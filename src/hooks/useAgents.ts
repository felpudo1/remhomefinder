
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AgentProfile = {
  id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  org_id: string | null;
};

/**
 * Hook para obtener la lista de agentes (usuarios con rol agency o agencymember)
 * Solo debe usarse por administradores.
 */
export function useAgents() {
  return useQuery({
    queryKey: ["agents-list"],
    queryFn: async (): Promise<AgentProfile[]> => {
      // 1. Obtener todos los user_ids que tienen roles de agencia
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .in("role", ["agency", "agencymember"]);

      if (rolesError) throw rolesError;
      if (!roles || roles.length === 0) return [];

      const userIds = roles.map(r => r.user_id);

      // 2. Obtener los perfiles y su organización primaria
      // Nota: Asumimos que un agente pertenece a una organización en organization_members
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select(`
          id,
          display_name,
          email,
          avatar_url,
          organization_members(org_id)
        `)
        .in("id", userIds);

      if (profilesError) throw profilesError;

      return (profiles || []).map(p => ({
        id: p.id,
        display_name: p.display_name,
        email: p.email,
        avatar_url: p.avatar_url,
        org_id: (p.organization_members as any)?.[0]?.org_id || null
      }));
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}
