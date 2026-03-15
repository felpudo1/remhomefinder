import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MarketplaceProperty } from "@/types/property";

/**
 * Hook para guardar una propiedad del marketplace al listado personal del usuario.
 * Crea un user_listing apuntando al mismo property_id con source_publication_id.
 */
export function useSaveToList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ property, groupId }: { property: MarketplaceProperty; groupId?: string | null }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      // Get user's org
      let finalOrgId = groupId;
      if (!finalOrgId) {
        const { data: membership } = await supabase
          .from("organization_members")
          .select("org_id")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();

        finalOrgId = membership?.org_id || null;
      }

      if (!finalOrgId) throw new Error("No pertenecés a ninguna organización");

      // We need the property_id from the agent_publication
      // The property.id is the agent_publication ID
      const { data: pub, error: pubError } = await supabase
        .from("agent_publications")
        .select("property_id")
        .eq("id", property.id)
        .single();

      if (pubError) throw pubError;

      // Insert user_listing pointing to the same property
      const { data, error } = await supabase
        .from("user_listings")
        .insert({
          property_id: pub.property_id,
          org_id: finalOrgId,
          listing_type: property.listingType || "rent",
          source_publication_id: property.id,
          added_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
  });
}
