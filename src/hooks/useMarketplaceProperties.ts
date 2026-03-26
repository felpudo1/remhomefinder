import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MarketplaceProperty } from "@/types/property";
import { resolveImages } from "@/lib/mappers/propertyMappers";

const PAGE_SIZE = 50;

/**
 * Hook para leer publicaciones del marketplace (agent_publications + properties + organizations).
 * Refactorizado para REGLA 6: Select proyectado y paginación cursor-based para evitar saturación de I/O.
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
    queryFn: async ({ pageParam }) => {
      // ✅ SELECT PROYECTADO (Punto 1 y 6 de la REGLA 6)
      // Evitamos el '*' y solo pedimos columnas necesarias. 
      // Excluimos explícitamente raw_ai_data y status_history de la tabla properties.
      const query = supabase
        .from("agent_publications")
        .select(`
          id,
          property_id,
          org_id,
          published_by,
          status,
          listing_type,
          description,
          created_at,
          updated_at,
          properties (
            id,
            title,
            source_url,
            price_amount,
            price_expenses,
            total_cost,
            currency,
            neighborhood,
            city,
            m2_total,
            rooms,
            images,
            ref
          ),
          organizations (
            name,
            created_by
          )
        `)
        .neq("status", "eliminado")
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE);

      if (pageParam) {
        query.lt("created_at", pageParam);
      }

      const { data, error } = await query;

      if (error) throw error;
      if (!data) return [];

      // Resolución de nombres de organizaciones faltantes (manteniendo lógica original)
      const missingOrgIds = Array.from(
        new Set(
          data
            .filter((pub: any) => !pub.organizations?.name && pub.org_id)
            .map((pub: any) => pub.org_id as string),
        ),
      );

      let fallbackOrgNameById: Record<string, string> = {};
      if (missingOrgIds.length > 0) {
        const { data: orgNames } = await supabase.rpc("get_marketplace_org_names" as any, {
          _org_ids: missingOrgIds,
        });

        if (orgNames) {
          fallbackOrgNameById = Object.fromEntries(
            orgNames.map((org: { id: string; name: string }) => [org.id, org.name]),
          );
        }
      }

      // Resolución de perfiles de agentes publicadores
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
          status: pub.status as any,
          listingType: (pub.listing_type || "rent") as any,
          createdAt: new Date(pub.created_at),
          updatedAt: new Date(pub.updated_at),
          publishedByName: publisher?.name,
          publishedByPhone: publisher?.phone,
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
