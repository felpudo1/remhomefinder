import { useInfiniteQuery, useQueryClient, InfiniteData } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/contexts/AuthProvider";
import { Property, PropertyComment, AgentPubStatus } from "@/types/property";
import { resolveImages } from "@/lib/mappers/propertyMappers";
import type { UserListingStatus } from "@/types/supabase";

/** Cantidad de listings por página. */
const PAGE_SIZE = 30;

/**
 * Mapea un listing JSON devuelto por la RPC get_user_listings_page
 * al modelo Property que consume la UI.
 */
function mapRpcListingToProperty(listing: any, userId: string | null): Property {
  const p = listing.property;
  const org = listing.organization;
  const isSharedListing = org?.is_personal === false;
  const ap = listing.agent_publication;

  // Status history lookups
  const statusHistory: any[] = listing._status_history || [];
  const changerProfiles: Record<string, string> = listing._changer_profiles || {};
  const addedByProfiles: Record<string, string> = listing._profiles || {};
  const reads: Record<string, string> = listing._reads || {};

  let contactedName: string | undefined;
  let contactedBy: string | undefined;
  let discardedReason: string | undefined;
  let discardedByEmail: string | undefined;
  let coordinatedDate: Date | undefined;
  let coordinatedBy: string | undefined;

  for (const log of statusHistory) {
    if (log.user_listing_id !== listing.id) continue;
    const meta = log.event_metadata as any;
    if (log.new_status === "contactado" && !contactedName) {
      contactedName = meta?.contacted_name || undefined;
      contactedBy = log.changed_by ? (changerProfiles[log.changed_by] || undefined) : undefined;
    } else if (log.new_status === "descartado" && !discardedReason) {
      discardedReason = meta?.reason || undefined;
      discardedByEmail = log.changed_by ? (changerProfiles[log.changed_by] || undefined) : undefined;
    } else if (log.new_status === "visita_coordinada" && !coordinatedDate) {
      if (meta?.coordinated_date) {
        const d = new Date(meta.coordinated_date);
        if (!isNaN(d.getTime())) coordinatedDate = d;
      }
      coordinatedBy = log.changed_by ? (changerProfiles[log.changed_by] || undefined) : undefined;
    }
  }

  // Marketplace contact resolution
  const contacts: Record<string, { name?: string; phone?: string }> = listing._contacts || {};
  const orgNames: Record<string, string> = listing._org_names || {};

  const pubContact = listing.source_publication_id ? contacts[listing.source_publication_id] : undefined;
  const marketplaceAgentName = pubContact?.name || undefined;
  const marketplaceAgentPhone = pubContact?.phone || undefined;
  const marketplaceOrgName = ap?.org_name || (ap?.org_id ? orgNames[ap.org_id] : undefined) || undefined;
  const agentPubStatus: AgentPubStatus | null = ap?.status || null;
  const marketplaceContactSource = !listing.source_publication_id
    ? undefined
    : (marketplaceAgentName || marketplaceAgentPhone)
      ? "publicacion_lookup" as const
      : "sin_datos" as const;

  // Comments
  const rawComments: any[] = typeof listing._comments === 'string'
    ? JSON.parse(listing._comments || '[]')
    : (listing._comments || []);
  const comments: PropertyComment[] = rawComments.map((c: any) => ({
    id: c.id,
    author: c.author || "Anónimo",
    avatar: c.avatar || "",
    text: c.text || "",
    createdAt: new Date(c.created_at),
  }));

  const unreadCommentsCount = rawComments.filter((c: any) => {
    if (!userId) return false;
    if (c.user_id === userId) return false;
    const lastReadAt = reads[listing.id];
    if (!lastReadAt) return true;
    return new Date(c.created_at).getTime() > new Date(lastReadAt).getTime();
  }).length;

  // Attachments
  const rawAttachments: string[] = typeof listing._attachments === 'string'
    ? JSON.parse(listing._attachments || '[]')
    : (listing._attachments || []);

  if (!p) {
    return {
      id: listing.id,
      propertyId: listing.property_id,
      url: "",
      title: "Sin datos",
      priceRent: 0,
      priceExpenses: 0,
      totalCost: 0,
      currency: "USD",
      neighborhood: "",
      city: "",
      sqMeters: 0,
      rooms: 0,
      status: (listing.current_status as UserListingStatus) || "ingresado",
      images: [],
      privateImages: rawAttachments,
      aiSummary: "",
      createdByEmail: addedByProfiles[listing.added_by] || "",
      comments,
      createdAt: new Date(listing.created_at),
      deletedReason: "",
      deletedByEmail: "",
      discardedReason: discardedReason || "",
      discardedByEmail: discardedByEmail || "",
      statusChangedByEmail: "",
      contactedName,
      contactedBy,
      coordinatedDate,
      coordinatedBy,
      listingType: listing.listing_type || "rent",
      ref: "",
      details: "",
      groupId: listing.org_id || null,
      sourceMarketplaceId: listing.source_publication_id || null,
      marketplaceOrgName,
      marketplaceAgentName,
      marketplaceAgentPhone,
      marketplaceContactSource,
      isSharedListing,
      marketplaceStatus: agentPubStatus,
      hasUnreadComments: unreadCommentsCount > 0,
      unreadCommentsCount,
      contactName: listing.contact_name || undefined,
      contactPhone: listing.contact_phone || undefined,
      contactSource: listing.contact_source || undefined,
    };
  }

  return {
    id: listing.id,
    propertyId: p.id,
    url: p.source_url || "",
    title: p.title,
    priceRent: Number(p.price_amount),
    priceExpenses: Number(p.price_expenses),
    totalCost: Number(p.total_cost),
    currency: p.currency || "USD",
    neighborhood: p.neighborhood || "",
    city: p.city || "",
    sqMeters: Number(p.m2_total),
    rooms: p.rooms || 0,
    status: (listing.current_status as UserListingStatus) || "ingresado",
    images: resolveImages(Array.isArray(p.images) ? p.images : null),
    privateImages: rawAttachments,
    aiSummary: p.details || "",
    createdByEmail: addedByProfiles[listing.added_by] || "",
    comments,
    createdAt: new Date(listing.created_at),
    deletedReason: "",
    deletedByEmail: "",
    discardedReason: discardedReason || "",
    discardedByEmail: discardedByEmail || "",
    statusChangedByEmail: "",
    statusChangedAt: listing.updated_at ? new Date(listing.updated_at) : null,
    contactedName,
    contactedBy,
    coordinatedDate,
    coordinatedBy,
    groupId: listing.org_id || null,
    sourceMarketplaceId: listing.source_publication_id || null,
    marketplaceOrgName,
    marketplaceAgentName,
    marketplaceAgentPhone,
    marketplaceContactSource,
    listingType: listing.listing_type || "rent",
    ref: p.ref || "",
    details: p.details || "",
    isSharedListing,
    marketplaceStatus: agentPubStatus,
    hasUnreadComments: unreadCommentsCount > 0,
    unreadCommentsCount,
    contactName: listing.contact_name || undefined,
    contactPhone: listing.contact_phone || undefined,
    contactSource: listing.contact_source || undefined,
  };
}

/**
 * Hook para leer user_listings + datos asociados del usuario autenticado.
 * Usa una única RPC get_user_listings_page para obtener todo en un round-trip.
 *
 * Mantiene: enabled guard, debounce Realtime 800ms, paginación cursor-based.
 */
export function usePropertyQueries() {
  const queryClient = useQueryClient();
  // Leer userId del AuthProvider centralizado (0 auth requests HTTP)
  const { user: authUser } = useCurrentUser();
  const currentUserId = authUser?.id ?? null;

  // Debounce para Realtime — evitar tormenta de refetch
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleRealtimeEvent = useCallback((_payload: any) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ["properties", currentUserId] });
    }, 2000); // 2 segundos de calma antes del refetch
  }, [queryClient, currentUserId]);

  useEffect(() => {
    if (!currentUserId) return;

    // Canal único: escucha user_listings (incluye cambios por trigger de comentarios)
    // y attachments. El canal de family_comments ya NO es necesario porque el trigger
    // trg_comment_updates_listing actualiza updated_at del listing automáticamente.
    // Solo escuchamos user_listings filtrado por added_by.
    // Los adjuntos ya actualizan updated_at del listing via trigger trg_attachment_updates_listing.
    const channelListings = supabase
      .channel("properties_realtime_listings")
      .on("postgres_changes", { event: "*", schema: "public", table: "user_listings", filter: `added_by=eq.${currentUserId}` }, handleRealtimeEvent)
      .subscribe();
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      supabase.removeChannel(channelListings);
    };
  }, [queryClient, currentUserId, handleRealtimeEvent]);

  const query = useInfiniteQuery({
    queryKey: ["properties", currentUserId],
    enabled: !!currentUserId,
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage: Property[]) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      const lastItem = lastPage[lastPage.length - 1];
      return lastItem?.createdAt?.toISOString() ?? undefined;
    },
    queryFn: async ({ pageParam }) => {
      const userId = currentUserId;

      const { data, error } = await supabase.rpc("get_user_listings_page" as any, {
        _cursor: pageParam || null,
        _page_size: PAGE_SIZE,
      });

      if (error) throw error;

      const listings: any[] = Array.isArray(data) ? data : (data || []);
      if (listings.length === 0) return [];

      return listings.map((listing: any) => mapRpcListingToProperty(listing, userId));
    },
  });

  // Aplanar todas las páginas en un array único
  const properties = useMemo(() => {
    return query.data?.pages.flat() ?? [];
  }, [query.data]);

  return {
    properties,
    loading: query.isLoading,
    error: query.error,
    refetch: () => queryClient.invalidateQueries({ queryKey: ["properties"] }),
    fetchNextPage: query.fetchNextPage,
    hasNextPage: !!query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
  };
}
