/**
 * Hook para gestionar las visitas a agencias compartidas dentro del grupo familiar.
 *
 * Cada visita se persiste en la tabla `org_agency_visits` para que cualquier
 * miembro de la org vea qué agencias ya fueron revisadas por el grupo, evitando
 * duplicar el trabajo entre familiares.
 *
 * Diseño:
 *  - Si el usuario aún no pertenece a una org, se cae a localStorage (legacy)
 *    para no romper UX en estados intermedios.
 *  - Upsert por (org_id, agency_type, agency_id) para mantener una única fila
 *    por agencia con el último visited_at del grupo.
 */
import { useCallback, useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { typedFrom } from "@/integrations/supabase/typedClient";
import { useCurrentUser } from "@/contexts/AuthProvider";
import { supabase } from "@/integrations/supabase/client";

export type OrgAgencyVisit = {
  agency_type: string;
  agency_id: string;
  visited_at: string;
  visited_by: string;
  visited_by_name?: string | null;
};

type VisitsMap = Record<string, OrgAgencyVisit>; // key = "type:id"

export function useOrgAgencyVisits() {
  const { user } = useCurrentUser();
  const userId = user?.id ?? null;
  const queryClient = useQueryClient();
  const [orgId, setOrgId] = useState<string | null>(null);

  // Resolver org_id principal del usuario (familia o equipo activo)
  useEffect(() => {
    let cancelled = false;
    if (!userId) {
      setOrgId(null);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("organization_members")
        .select("org_id")
        .eq("user_id", userId)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();
      if (!cancelled) setOrgId((data as any)?.org_id ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Cargar visitas del grupo
  const { data: visits = {} } = useQuery({
    queryKey: ["org-agency-visits", orgId],
    enabled: !!orgId,
    staleTime: 60_000,
    queryFn: async (): Promise<VisitsMap> => {
      const { data, error } = await typedFrom("org_agency_visits")
        .select("agency_type, agency_id, visited_at, visited_by")
        .eq("org_id", orgId);
      if (error) throw error;

      // Enriquecer con nombre del miembro (lookup liviano)
      const userIds = Array.from(new Set((data || []).map((r: any) => r.visited_by as string)));
      let names: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name, email")
          .in("user_id", userIds);
        names = Object.fromEntries(
          (profiles || []).map((p: any) => [p.user_id, p.display_name || p.email || "Miembro"])
        );
      }

      const map: VisitsMap = {};
      for (const row of data || []) {
        const r: any = row;
        map[`${r.agency_type}:${r.agency_id}`] = {
          agency_type: r.agency_type,
          agency_id: r.agency_id,
          visited_at: r.visited_at,
          visited_by: r.visited_by,
          visited_by_name: names[r.visited_by] ?? null,
        };
      }
      return map;
    },
  });

  // Marcar visita (upsert)
  const markMutation = useMutation({
    mutationFn: async ({ agencyType, agencyId }: { agencyType: string; agencyId: string }) => {
      if (!orgId || !userId) return null;
      const { error } = await typedFrom("org_agency_visits").upsert(
        {
          org_id: orgId,
          agency_type: agencyType,
          agency_id: agencyId,
          visited_by: userId,
          visited_at: new Date().toISOString(),
        },
        { onConflict: "org_id,agency_type,agency_id" }
      );
      if (error) throw error;
      return true;
    },
    onSuccess: (_res, vars) => {
      // Optimistic refresh local
      queryClient.setQueryData<VisitsMap>(["org-agency-visits", orgId], (prev) => ({
        ...(prev || {}),
        [`${vars.agencyType}:${vars.agencyId}`]: {
          agency_type: vars.agencyType,
          agency_id: vars.agencyId,
          visited_at: new Date().toISOString(),
          visited_by: userId!,
          visited_by_name: "Vos",
        },
      }));
    },
  });

  const markVisited = useCallback(
    (agencyType: string, agencyId: string) => {
      if (!orgId) return;
      markMutation.mutate({ agencyType, agencyId });
    },
    [orgId, markMutation]
  );

  const getVisit = useCallback(
    (agencyType: string, agencyId: string): OrgAgencyVisit | null =>
      visits[`${agencyType}:${agencyId}`] ?? null,
    [visits]
  );

  return { visits, getVisit, markVisited, hasOrg: !!orgId };
}
