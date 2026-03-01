import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MarketplaceProperty } from "@/types/property";

export function useSaveToList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ property, groupId }: { property: MarketplaceProperty; groupId?: string | null }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const insertData: any = {
        user_id: user.id,
        url: property.url,
        title: property.title,
        price_rent: property.priceRent,
        price_expenses: property.priceExpenses,
        total_cost: property.totalCost,
        currency: property.currency,
        neighborhood: property.neighborhood,
        sq_meters: property.sqMeters,
        rooms: property.rooms,
        ai_summary: property.description,
        created_by_email: user.email || "",
        images: property.images,
        source_marketplace_id: property.id,
        listing_type: property.listingType || "rent",
      };

      if (groupId) {
        insertData.group_id = groupId;
      }

      const { data, error } = await supabase
        .from("properties")
        .insert(insertData)
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
