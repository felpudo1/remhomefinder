import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MarketplaceProperty } from "@/types/property";

interface SharedPropertyRow {
  id: string;
  marketplace_property_id: string;
  group_id: string;
  shared_by: string;
  created_at: string;
}

export interface SharedMarketplaceProperty extends MarketplaceProperty {
  sharedByName: string;
  sharedByUserId: string;
  sharedAt: string;
}

export function useAgencySharedProperties(groupId: string | null) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const queryKey = ["agency-shared-properties", groupId];

  const { data: sharedProperties = [], isLoading } = useQuery({
    queryKey,
    enabled: !!groupId,
    queryFn: async () => {
      if (!groupId) return [];

      // Step 1: Get shared records for this group
      const { data: sharedRows, error: sharedErr } = await supabase
        .from("agency_shared_properties")
        .select("*")
        .eq("group_id", groupId);

      if (sharedErr) throw sharedErr;
      if (!sharedRows || sharedRows.length === 0) return [];

      const rows = sharedRows as SharedPropertyRow[];
      const propIds = rows.map((r) => r.marketplace_property_id);
      const userIds = [...new Set(rows.map((r) => r.shared_by))];

      // Step 2: Fetch marketplace properties + profiles in parallel
      const [propsRes, profilesRes] = await Promise.all([
        supabase
          .from("marketplace_properties")
          .select("*")
          .in("id", propIds),
        supabase
          .from("profiles")
          .select("user_id, display_name")
          .in("user_id", userIds),
      ]);

      if (propsRes.error) throw propsRes.error;

      const profileMap = new Map(
        (profilesRes.data || []).map((p) => [p.user_id, p.display_name])
      );

      const propsMap = new Map(
        (propsRes.data || []).map((p) => [p.id, p])
      );

      // Step 3: Combine
      return rows
        .map((row): SharedMarketplaceProperty | null => {
          const p = propsMap.get(row.marketplace_property_id);
          if (!p) return null;
          return {
            id: p.id,
            agencyId: p.agency_id,
            agencyName: "",
            agentId: row.shared_by,
            title: p.title,
            description: p.description,
            url: p.url,
            priceRent: Number(p.price_rent),
            priceExpenses: Number(p.price_expenses),
            totalCost: Number(p.total_cost),
            currency: p.currency,
            neighborhood: p.neighborhood,
            city: p.city || "",
            sqMeters: Number(p.sq_meters),
            rooms: p.rooms,
            images: p.images || [],
            status: p.status,
            listingType: p.listing_type || "rent",
            createdAt: new Date(p.created_at),
            updatedAt: new Date(p.updated_at),
            sharedByName: profileMap.get(row.shared_by) || "Agente",
            sharedByUserId: row.shared_by,
            sharedAt: row.created_at,
          };
        })
        .filter(Boolean) as SharedMarketplaceProperty[];
    },
  });

  const shareMutation = useMutation({
    mutationFn: async ({
      marketplacePropertyId,
      groupId: gId,
    }: {
      marketplacePropertyId: string;
      groupId: string;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const { error } = await supabase
        .from("agency_shared_properties")
        .insert({
          marketplace_property_id: marketplacePropertyId,
          group_id: gId,
          shared_by: user.id,
        } as any);

      if (error) {
        if (error.code === "23505") throw new Error("Ya está compartida en este grupo");
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({ title: "Propiedad compartida con el equipo ✅" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const unshareMutation = useMutation({
    mutationFn: async ({
      marketplacePropertyId,
      groupId: gId,
    }: {
      marketplacePropertyId: string;
      groupId: string;
    }) => {
      const { error } = await supabase
        .from("agency_shared_properties")
        .delete()
        .eq("marketplace_property_id", marketplacePropertyId)
        .eq("group_id", gId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({ title: "Propiedad removida del equipo" });
    },
  });

  // Check which of the given property IDs are already shared in a group
  const useSharedStatus = (propertyIds: string[], gId: string | null) => {
    return useQuery({
      queryKey: ["agency-shared-status", gId, propertyIds],
      enabled: !!gId && propertyIds.length > 0,
      queryFn: async () => {
        if (!gId) return new Set<string>();
        const { data, error } = await supabase
          .from("agency_shared_properties")
          .select("marketplace_property_id")
          .eq("group_id", gId)
          .in("marketplace_property_id", propertyIds);

        if (error) throw error;
        return new Set((data || []).map((r: any) => r.marketplace_property_id));
      },
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
