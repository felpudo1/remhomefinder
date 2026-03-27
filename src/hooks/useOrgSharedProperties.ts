import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MarketplaceProperty } from "@/types/property";
import { resolveImages } from "@/lib/mappers/propertyMappers";

export interface SharedMarketplaceProperty extends MarketplaceProperty {
  sharedByName: string;
  sharedByUserId: string;
  sharedAt: string;
}

/**
 * Hook para ver las publicaciones del equipo de la organización.
 * En el nuevo esquema, las publicaciones son de la org (agent_publications).
 */
export function useOrgSharedProperties(orgId: string | null) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const queryKey = ["agency-shared-properties", orgId];

  const { data: sharedProperties = [], isLoading } = useQuery({
    queryKey,
    enabled: !!orgId,
    queryFn: async () => {
      if (!orgId) return [];

      const { data, error } = await supabase
        .from("agent_publications")
        .select(`
          id, property_id, org_id, published_by, status, listing_type, description, created_at, updated_at,
          properties (id, title, source_url, price_amount, price_expenses, total_cost, currency, neighborhood, city, m2_total, rooms, images, ref),
          organizations (name)
        `)
        .eq("org_id", orgId)
        .neq("status", "eliminado")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get publisher profiles
      const publisherIds = [...new Set((data || []).map((d) => d.published_by))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", publisherIds);

      const profileMap = new Map((profiles || []).map((p) => [p.user_id, p.display_name]));

      return (data || []).map((pub: any): SharedMarketplaceProperty => {
        const p = pub.properties || {};
        return {
          id: pub.id,
          orgId: pub.org_id,
          orgName: pub.organizations?.name || "",
          agentId: pub.published_by,
          title: p.title || "",
          description: pub.description || "",
          url: p.source_url || "",
          priceRent: Number(p.price_amount || 0),
          priceExpenses: Number(p.price_expenses || 0),
          totalCost: Number(p.total_cost || 0),
          currency: p.currency || "USD",
          neighborhood: p.neighborhood || "",
          city: p.city || "",
          sqMeters: Number(p.m2_total || 0),
          rooms: p.rooms || 0,
          images: resolveImages(p.images || []),
          status: pub.status,
          listingType: pub.listing_type || "rent",
          createdAt: new Date(pub.created_at),
          updatedAt: new Date(pub.updated_at),
          sharedByName: profileMap.get(pub.published_by) || "Agente",
          sharedByUserId: pub.published_by,
          sharedAt: pub.created_at,
          ref: p.ref || "",
        };
      });
    },
  });

  const shareMutation = useMutation({
    mutationFn: async (_params: { marketplacePropertyId: string; groupId: string }) => {
      // In the new schema, publications belong to the org directly
      // This is a no-op since agent_publications already have org_id
      toast({ title: "Esta funcionalidad cambió con el nuevo esquema" });
    },
  });

  const unshareMutation = useMutation({
    mutationFn: async (_params: { marketplacePropertyId: string; groupId: string }) => {
      toast({ title: "Esta funcionalidad cambió con el nuevo esquema" });
    },
  });

  const useSharedStatus = (_propertyIds: string[], _gId: string | null) => {
    return useQuery({
      queryKey: ["agency-shared-status", _gId, _propertyIds],
      enabled: false,
      queryFn: async () => new Set<string>(),
    });
  };

  return {
    sharedProperties,
    isLoading,
    share: shareMutation.mutateAsync,
    unshare: unshareMutation.mutateAsync,
    isSharing: shareMutation.isPending,
    useSharedStatus,
  };
}
