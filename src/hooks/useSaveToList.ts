import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/contexts/AuthProvider";
import { MarketplaceProperty } from "@/types/property";

/**
 * Hook para guardar una propiedad del marketplace al listado personal del usuario.
 * Crea un user_listing apuntando al mismo property_id con source_publication_id.
 *
 * OPTIMIZACIÓN: Usa AuthProvider en lugar de supabase.auth.getUser() (1 auth request eliminado).
 */
export function useSaveToList() {
  const queryClient = useQueryClient();
  const { user: authUser } = useCurrentUser();

  return useMutation({
    mutationFn: async ({ property, groupId }: { property: MarketplaceProperty; groupId?: string | null }) => {
      if (!authUser) throw new Error("No autenticado");

      // Get user's org
      let finalOrgId = groupId;
      if (!finalOrgId) {
        const { data: membership } = await supabase
          .from("organization_members")
          .select("org_id")
          .eq("user_id", authUser.id)
          .limit(1)
          .maybeSingle();

        finalOrgId = membership?.org_id || null;
      }

      if (!finalOrgId) throw new Error("No pertenecés a ninguna organización");

      const { data: pub, error: pubError } = await supabase
        .from("agent_publications")
        .select("property_id")
        .eq("id", property.id)
        .single();

      if (pubError) throw pubError;

      const { data, error } = await supabase
        .from("user_listings")
        .insert({
          property_id: pub.property_id,
          org_id: finalOrgId,
          listing_type: property.listingType || "rent",
          source_publication_id: property.id,
          added_by: authUser.id,
        })
        .select("id")
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
  });
}
