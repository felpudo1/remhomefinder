import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MarketplaceProperty } from "@/types/property";
import { resolveImages } from "@/lib/mappers/propertyMappers";

const PAGE_SIZE = 50;

/**
 * Hook para leer publicaciones del marketplace usando la RPC consolidada
 * get_marketplace_publications_page. Un solo round-trip por página.
 */
export function useMarketplaceProperties() {
  const query = useInfiniteQuery({
    queryKey: ["marketplace-properties"],
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage: MarketplaceProperty[]) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      const lastItem = lastPage[lastPage.length - 1];
      return lastItem.createdAt.toISOString();
    },
    staleTime: 5 * 60_000, // 5 minutos — evitar refetch innecesario
    queryFn: async ({ pageParam }) => {
      const { data, error } = await supabase.rpc(
        "get_marketplace_publications_page" as any,
        {
          _cursor: pageParam || null,
          _page_size: PAGE_SIZE,
          _filters: {},
        }
      );

      if (error) throw error;

      const items: any[] = Array.isArray(data) ? data : (data ? JSON.parse(data as string) : []);
      if (items.length === 0) return [];

      return items.map((pub: any): MarketplaceProperty => {
        const p = pub.property || {};
        
        // Debug: verificar URLs de logos
        if (pub.org_logo_url) {
          console.log(`🔵 Property: ${p.title || pub.description}`);
          console.log(`📋 Logo URL from DB: ${pub.org_logo_url}`);
        }
        
        return {
          id: pub.id,
          propertyId: pub.property_id,
          orgId: pub.org_id,
          orgName: pub.org_name || "Organización",
          orgLogoUrl: pub.org_logo_url || undefined,
          agentId: pub.published_by || pub.org_created_by || "",
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
          status: (pub.status || "disponible") as any,
          listingType: (pub.listing_type || "rent") as any,
          createdAt: new Date(pub.created_at),
          updatedAt: new Date(pub.updated_at),
          publishedByName: pub.agent_name || undefined,
          publishedByPhone: pub.agent_phone || undefined,
          averageRating: pub.avg_rating || 0,
          totalVotes: pub.total_votes || 0,
        };
      });
    },
  });

  const data = useMemo(() => query.data?.pages.flat() ?? [], [query.data]);

  return {
    data,
    isLoading: query.isLoading,
    isError: query.isError,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: !!query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
  };
}
