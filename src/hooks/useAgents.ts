
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

      // 2. Obtener los perfiles (profiles usa user_id como FK, no id)
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, display_name, email, avatar_url")
        .in("user_id", userIds);

      if (profilesError) throw profilesError;

      // 3. Obtener org_id de organization_members por separado
      const { data: orgMembers } = await supabase
        .from("organization_members")
        .select("user_id, org_id")
        .in("user_id", userIds);

      const orgMap: Record<string, string> = {};
      for (const om of orgMembers || []) {
        orgMap[om.user_id] = om.org_id;
      }

      return (profiles || []).map(p => ({
        id: p.user_id,
        display_name: p.display_name,
        email: p.email,
        avatar_url: p.avatar_url,
        org_id: orgMap[p.user_id] || null
      }));
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}
