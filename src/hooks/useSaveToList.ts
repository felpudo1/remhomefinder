import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/contexts/AuthProvider";
import { useSubscription } from "@/hooks/useSubscription";
import { useSystemConfig } from "@/hooks/useSystemConfig";
import { LIMIT_INCLUDES_MARKETPLACE_KEY, LIMIT_INCLUDES_MARKETPLACE_DEFAULT } from "@/lib/config-keys";
import { MarketplaceProperty } from "@/types/property";

/** Error especial para señalizar que se alcanzó el límite del plan */
export class PlanLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlanLimitError";
  }
}

/**
 * Hook para guardar una propiedad del marketplace al listado personal del usuario.
 * Crea un user_listing apuntando al mismo property_id con source_publication_id.
 *
 * Incluye validación de límite de guardado según plan del usuario.
 * Si la config `limit_includes_marketplace` está en "false", no se aplica límite desde marketplace.
 */
export function useSaveToList() {
  const queryClient = useQueryClient();
  const { user: authUser } = useCurrentUser();
  const { canSaveMore, maxSaves } = useSubscription();
  const { value: limitIncludesMarketplace } = useSystemConfig(
    LIMIT_INCLUDES_MARKETPLACE_KEY,
    LIMIT_INCLUDES_MARKETPLACE_DEFAULT
  );

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

      // Solo validar límite si la config incluye marketplace
      if (limitIncludesMarketplace === "true") {
        const { count, error: countError } = await supabase
          .from("user_listings")
          .select("id", { count: "exact", head: true })
          .eq("org_id", finalOrgId);

        if (countError) throw countError;

        const currentCount = count ?? 0;
        if (!canSaveMore(currentCount)) {
          throw new PlanLimitError(`Alcanzaste el límite de ${maxSaves} avisos guardados en tu plan. Mejorá tu plan para guardar más.`);
        }
      }

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
