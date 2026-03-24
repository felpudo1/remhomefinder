import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MarketplaceProperty } from "@/types/property";
import { resolveImages } from "@/lib/mappers/propertyMappers";

/**
 * Hook para leer publicaciones del marketplace (agent_publications + properties + organizations).
 */
export function useMarketplaceProperties() {
  return useQuery({
    queryKey: ["marketplace-properties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_publications")
        .select("*, properties(*), organizations(name, created_by)")
        .neq("status", "eliminado")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!data) return [];

      const missingOrgIds = Array.from(
        new Set(
          data
            .filter((pub: any) => !pub.organizations?.name && pub.org_id)
            .map((pub: any) => pub.org_id as string),
        ),
      );

      let fallbackOrgNameById: Record<string, string> = {};
      if (missingOrgIds.length > 0) {
        const { data: orgNames } = await supabase.rpc("get_marketplace_org_names", {
          _org_ids: missingOrgIds,
        });

        if (orgNames) {
          fallbackOrgNameById = Object.fromEntries(
            orgNames.map((org: { id: string; name: string }) => [org.id, org.name]),
          );
        }
      }

      const publisherIds = Array.from(
        new Set((data || []).map((pub: any) => pub.published_by).filter(Boolean)),
      );
      let publisherById: Record<string, { name?: string; phone?: string }> = {};
      if (publisherIds.length > 0) {
        const { data: publishers } = await supabase
          .from("profiles")
          .select("user_id, display_name, phone, email")
          .in("user_id", publisherIds);
        publisherById = Object.fromEntries(
          (publishers || []).map((p: any) => [
            p.user_id,
            { name: p.display_name || p.email || "Agente", phone: p.phone || undefined },
          ]),
        );
      }

      return data.map((pub: any): MarketplaceProperty => {
        const p = pub.properties || {};
        const publisher = pub.published_by ? publisherById[pub.published_by] : undefined;
        return {
          id: pub.id,
          propertyId: pub.property_id,
          orgId: pub.org_id,
          orgName: pub.organizations?.name || fallbackOrgNameById[pub.org_id] || "Organización",
          agentId: pub.published_by || pub.organizations?.created_by || "",
          title: p.title || pub.description || "",
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
          publishedByName: publisher?.name,
          publishedByPhone: publisher?.phone,
        };
      });
    },
  });
}
