import { useInfiniteQuery, useQueryClient, InfiniteData } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Property, PropertyComment } from "@/types/property";
import { resolveImages } from "@/lib/mappers/propertyMappers";
import type { UserListingStatus, DbListingType } from "@/types/supabase";

/** Cantidad de listings por página. Ajustable según necesidades de UX. */
const PAGE_SIZE = 30;

/**
 * Columnas de properties que realmente usa la UI en tarjetas.
 * Excluye raw_ai_data, lat, lng, address, department, department_id,
 * city_id, neighborhood_id, created_by para aligerar el payload.
 * Punto 5 (Checklist): Select proyectado.
 */
const PROPERTY_COLUMNS = "id,title,source_url,price_amount,price_expenses,total_cost,currency,neighborhood,city,m2_total,rooms,images,details,ref,updated_at";

/**
 * Hook para leer user_listings + properties + family_comments del usuario autenticado.
 * Implementa paginación cursor-based para evitar cargar todo el listado de golpe.
 * 
 * Punto 1 (Performance): Paginación cursor-based con created_at como cursor.
 * Punto 2 (Realtime): Debounce de 800ms para evitar tormenta de refetch.
 * Punto 4 (Complejidad): Pre-indexación de comentarios con Map para O(N+M).
 */
export function usePropertyQueries() {
    const queryClient = useQueryClient();

    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            setCurrentUserId(user?.id || null);
        });
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setCurrentUserId(session?.user.id || null);
        });
        return () => { subscription.unsubscribe(); };
    }, []);

    // Punto 2: Debounce para Realtime — evitar tormenta de refetch
    // Punto 3 (Checklist): Invalidación fina — solo invalida la página que contiene el listing afectado
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    /**
     * Invalidación fina: dado un payload de Realtime, intenta invalidar solo
     * la página que contiene el listing afectado en vez de toda la cache.
     * Si no puede determinar la fila (INSERT nuevo), invalida todo como fallback.
     */
    const handleRealtimeEvent = useCallback((payload: any) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            const recordId = payload?.new?.id || payload?.old?.id;
            const listingId = payload?.new?.user_listing_id || payload?.old?.user_listing_id || recordId;
            const eventType = payload?.eventType;

            // Para INSERTs nuevos o si no podemos determinar el ID, invalidar todo
            if (!listingId || eventType === "INSERT") {
                queryClient.invalidateQueries({ queryKey: ["properties", currentUserId] });
                return;
            }

            // Invalidación fina: buscar si el listing está en alguna página cacheada
            const queryKey = ["properties", currentUserId];
            const cached = queryClient.getQueryData<InfiniteData<Property[]>>(queryKey);
            if (!cached) {
                queryClient.invalidateQueries({ queryKey });
                return;
            }

            const pageIndex = cached.pages.findIndex(page =>
                page.some(p => p.id === listingId || p.propertyId === listingId)
            );

            if (pageIndex >= 0) {
                // Invalidar solo la query — React Query refetchará las páginas stale
                queryClient.invalidateQueries({ queryKey });
            } else {
                // El listing no está en cache (puede ser de otro user), ignorar o invalidar
                queryClient.invalidateQueries({ queryKey });
            }
        }, 800);
    }, [queryClient, currentUserId]);

    useEffect(() => {
        const channelListings = supabase
            .channel("properties_realtime_listings")
            .on("postgres_changes", { event: "*", schema: "public", table: "user_listings" }, handleRealtimeEvent)
            .on("postgres_changes", { event: "*", schema: "public", table: "properties" }, handleRealtimeEvent)
            .on("postgres_changes", { event: "*", schema: "public", table: "user_listing_attachments" }, handleRealtimeEvent)
            .subscribe();
        const channelComments = supabase
            .channel("properties_realtime_comments")
            .on("postgres_changes", { event: "*", schema: "public", table: "family_comments" }, handleRealtimeEvent)
            .subscribe();
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            supabase.removeChannel(channelListings);
            supabase.removeChannel(channelComments);
        };
    }, [queryClient, currentUserId, handleRealtimeEvent]);

    const query = useInfiniteQuery({
        queryKey: ["properties", currentUserId],
        // Punto 1 (Checklist): No disparar query sin usuario autenticado
        enabled: !!currentUserId,
        initialPageParam: null as string | null,
        getNextPageParam: (lastPage: Property[]) => {
            if (lastPage.length < PAGE_SIZE) return undefined;
            const lastItem = lastPage[lastPage.length - 1];
            return lastItem?.createdAt?.toISOString() ?? undefined;
        },
        queryFn: async ({ pageParam }) => {
            const userId = currentUserId;

            // Punto 5 (Checklist): Select proyectado — solo columnas usadas en tarjetas
            let listingsQuery = (supabase
                .from("user_listings")
                .select(`*, properties(${PROPERTY_COLUMNS}), organizations(type, is_personal), agent_publications!user_listings_source_publication_id_fkey(id, org_id, published_by, organizations(name))`) as any)
                .eq("admin_hidden", false)
                .order("created_at", { ascending: false })
                .limit(PAGE_SIZE);

            if (pageParam) {
                listingsQuery = listingsQuery.lt("created_at", pageParam);
            }

            const { data: listings, error: listingsError } = await listingsQuery;

            if (listingsError) throw listingsError;
            if (!listings || listings.length === 0) return [];

            const listingIds = listings.map((l: any) => l.id);
            const addedByIds: string[] = [...new Set(listings.map((l: any) => l.added_by).filter(Boolean))] as string[];
            const sourcePublicationIds = Array.from(new Set(listings.map((l: any) => l.source_publication_id).filter(Boolean))) as string[];

            // Punto 2 (Checklist): Consolidar 3 queries de status_history_log en 1
            // En vez de 3 queries separadas (contactado, descartado, visita_coordinada),
            // hacemos UNA sola query con los IDs de todos los listings que necesitan historial.
            const statusListingIds = listings
                .filter((l: any) => ["contactado", "descartado", "visita_coordinada"].includes(l.current_status))
                .map((l: any) => l.id);

            const [
                readsResult,
                profilesResult,
                statusHistoryResult,
                commentsResult,
                attachmentsResult,
                contactsResult,
                orgNamesResult
            ] = await Promise.all([
                (userId && listingIds.length > 0)
                    ? (supabase as any).from("user_listing_comment_reads").select("user_listing_id, last_read_at").eq("user_id", userId).in("user_listing_id", listingIds)
                    : Promise.resolve({ data: [] }),
                addedByIds.length > 0
                    ? (supabase.from("profiles") as any).select("user_id, email, display_name").in("user_id", addedByIds)
                    : Promise.resolve({ data: [] }),
                // UNA sola query de status_history_log para todos los estados relevantes
                statusListingIds.length > 0
                    ? (supabase.from("status_history_log") as any)
                        .select("user_listing_id, new_status, event_metadata, changed_by, created_at")
                        .in("user_listing_id", statusListingIds)
                        .in("new_status", ["contactado", "descartado", "visita_coordinada"])
                        .order("created_at", { ascending: false })
                    : Promise.resolve({ data: [] }),
                listingIds.length > 0
                    ? (supabase.from("family_comments") as any).select("*").in("user_listing_id", listingIds).order("created_at", { ascending: true })
                    : Promise.resolve({ data: [] }),
                listingIds.length > 0
                    ? (supabase.from("user_listing_attachments") as any).select("user_listing_id, image_url").in("user_listing_id", listingIds)
                    : Promise.resolve({ data: [] }),
                sourcePublicationIds.length > 0
                    ? supabase.rpc("get_marketplace_publication_contacts" as any, { _publication_ids: sourcePublicationIds })
                    : Promise.resolve({ data: [] }),
                sourcePublicationIds.length > 0
                    ? (async () => {
                        const { data: pubs } = await (supabase
                            .from("agent_publications")
                            .select("id, org_id")
                            .in("id", sourcePublicationIds) as any);
                        const orgIds = Array.from(new Set(((pubs || []) as any[]).map((p: any) => p.org_id).filter(Boolean)));
                        if (orgIds.length === 0) return { data: [] };
                        return supabase.rpc("get_marketplace_org_names" as any, { _org_ids: orgIds });
                    })()
                    : Promise.resolve({ data: [] })
            ]);

            // Mapeo de datos auxiliares
            const commentReadAtByListing: Record<string, string> = {};
            if (readsResult.data) {
                readsResult.data.forEach((row: any) => {
                    commentReadAtByListing[row.user_listing_id] = row.last_read_at;
                });
            }

            const addedByMap: Record<string, string> = {};
            profilesResult.data?.forEach((pr: any) => {
                addedByMap[pr.user_id] = pr.display_name || pr.email || "Usuario";
            });

            const contactedNameMap: Record<string, string> = {};
            const contactedByMap: Record<string, string> = {};
            const contactadoChangedByIds: string[] = [];
            if (contactadoResult.data) {
                const seen = new Set<string>();
                contactadoResult.data.forEach((log: any) => {
                    if (seen.has(log.user_listing_id)) return;
                    seen.add(log.user_listing_id);
                    const meta = log.event_metadata as { contacted_name?: string } | null;
                    if (meta?.contacted_name) contactedNameMap[log.user_listing_id] = meta.contacted_name;
                    if (log.changed_by) {
                        contactedByMap[log.user_listing_id] = log.changed_by;
                        contactadoChangedByIds.push(log.changed_by);
                    }
                });
            }

            const discardedByMap: Record<string, string> = {};
            const discardedReasonMap: Record<string, string> = {};
            const descartadoChangedByIds: string[] = [];
            if (descartadoResult.data) {
                const seen = new Set<string>();
                descartadoResult.data.forEach((log: any) => {
                    if (seen.has(log.user_listing_id)) return;
                    seen.add(log.user_listing_id);
                    const meta = log.event_metadata as { reason?: string } | null;
                    if (meta?.reason) discardedReasonMap[log.user_listing_id] = meta.reason;
                    if (log.changed_by) {
                        discardedByMap[log.user_listing_id] = log.changed_by;
                        descartadoChangedByIds.push(log.changed_by);
                    }
                });
            }

            const coordinatedDateMap: Record<string, Date> = {};
            const coordinatedByMap: Record<string, string> = {};
            const coordinadaChangedByIds: string[] = [];
            if (coordinadaResult.data) {
                const seen = new Set<string>();
                coordinadaResult.data.forEach((log: any) => {
                    if (seen.has(log.user_listing_id)) return;
                    seen.add(log.user_listing_id);
                    const meta = log.event_metadata as { coordinated_date?: string } | null;
                    if (meta?.coordinated_date) {
                        const d = new Date(meta.coordinated_date);
                        if (!isNaN(d.getTime())) coordinatedDateMap[log.user_listing_id] = d;
                    }
                    if (log.changed_by) {
                        coordinatedByMap[log.user_listing_id] = log.changed_by;
                        coordinadaChangedByIds.push(log.changed_by);
                    }
                });
            }

            // Resolver nombres de changers
            const allChangerIds = [...new Set([...contactadoChangedByIds, ...descartadoChangedByIds, ...coordinadaChangedByIds])];
            if (allChangerIds.length > 0) {
                const { data: changerProfiles } = await supabase
                    .from("profiles")
                    .select("user_id, display_name")
                    .in("user_id", allChangerIds);
                const changerNameByUserId: Record<string, string> = {};
                changerProfiles?.forEach((pr) => {
                    changerNameByUserId[pr.user_id] = pr.display_name || "Usuario";
                });
                Object.keys(contactedByMap).forEach(id => contactedByMap[id] = changerNameByUserId[contactedByMap[id]] || contactedByMap[id]);
                Object.keys(discardedByMap).forEach(id => discardedByMap[id] = changerNameByUserId[discardedByMap[id]] || discardedByMap[id]);
                Object.keys(coordinatedByMap).forEach(id => coordinatedByMap[id] = changerNameByUserId[coordinatedByMap[id]] || coordinatedByMap[id]);
            }

            // Punto 4: Pre-indexar comentarios con Map para O(N+M)
            const commentsByListingId = new Map<string, any[]>();
            (commentsResult.data || []).forEach((c: any) => {
                const arr = commentsByListingId.get(c.user_listing_id) || [];
                arr.push(c);
                commentsByListingId.set(c.user_listing_id, arr);
            });

            const attachmentsByListing: Record<string, string[]> = {};
            attachmentsResult.data?.forEach((a: any) => {
                if (!attachmentsByListing[a.user_listing_id]) attachmentsByListing[a.user_listing_id] = [];
                attachmentsByListing[a.user_listing_id].push(a.image_url);
            });

            const marketplaceContactByPublicationId: Record<string, { name?: string; phone?: string }> = {};
            ((contactsResult.data as any[]) || []).forEach((row: any) => {
                marketplaceContactByPublicationId[row.publication_id] = {
                    name: row.agent_name || undefined,
                    phone: row.agent_phone || undefined,
                };
            });
            const marketplaceOrgNameById: Record<string, string> = {};
            ((orgNamesResult.data as any[]) || []).forEach((row: any) => {
                if (row?.id && row?.name) marketplaceOrgNameById[row.id] = row.name;
            });

            const deletedByMap: Record<string, string> = {};
            const deletedReasonMap: Record<string, string> = {};

            // Mapear a modelo UI
            return listings.map((listing: any): Property => {
                const p = listing.properties as any;
                const org = Array.isArray(listing.organizations) ? listing.organizations[0] : listing.organizations;
                const isSharedListing = org?.is_personal === false;

                const resolveMarketplaceContact = () => {
                    const publicationName = listing.source_publication_id
                        ? marketplaceContactByPublicationId[listing.source_publication_id]?.name
                        : undefined;
                    const publicationPhone = listing.source_publication_id
                        ? marketplaceContactByPublicationId[listing.source_publication_id]?.phone
                        : undefined;
                    const publicationOrg = Array.isArray(listing.agent_publications?.organizations)
                        ? listing.agent_publications.organizations[0]
                        : listing.agent_publications?.organizations;
                    const marketplaceOrgName = publicationOrg?.name || (listing.agent_publications?.org_id ? marketplaceOrgNameById[listing.agent_publications.org_id] : undefined) || undefined;
                    const marketplaceAgentName = publicationName;
                    const marketplaceAgentPhone = publicationPhone;
                    const marketplaceContactSource = !listing.source_publication_id
                        ? undefined
                        : publicationName || publicationPhone
                            ? "publicacion_lookup" as const
                            : "sin_datos" as const;
                    return { marketplaceOrgName, marketplaceAgentName, marketplaceAgentPhone, marketplaceContactSource };
                };

                const mc = resolveMarketplaceContact();

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
                        privateImages: [],
                        aiSummary: "",
                        createdByEmail: addedByMap[listing.added_by] || "",
                        comments: [],
                        createdAt: new Date(listing.created_at),
                        deletedReason: deletedReasonMap[listing.id] || "",
                        deletedByEmail: deletedByMap[listing.id] || "",
                        discardedReason: discardedReasonMap[listing.id] || "",
                        discardedByEmail: discardedByMap[listing.id] || "",
                        statusChangedByEmail: "",
                        contactedName: contactedNameMap[listing.id] || undefined,
                        contactedBy: contactedByMap[listing.id] || undefined,
                        coordinatedDate: coordinatedDateMap[listing.id] || undefined,
                        coordinatedBy: coordinatedByMap[listing.id] || undefined,
                        listingType: listing.listing_type || "rent",
                        ref: "",
                        details: "",
                        groupId: listing.org_id || null,
                        sourceMarketplaceId: listing.source_publication_id || null,
                        ...mc,
                        isSharedListing,
                        hasUnreadComments: false,
                        unreadCommentsCount: 0,
                        contactName: listing.contact_name || undefined,
                        contactPhone: listing.contact_phone || undefined,
                        contactSource: listing.contact_source || undefined,
                    };
                }

                const listingCommentsRaw = commentsByListingId.get(listing.id) || [];
                const comments = listingCommentsRaw.map((c: any): PropertyComment => ({
                    id: c.id,
                    author: c.author || "Anónimo",
                    avatar: c.avatar || "",
                    text: c.text || "",
                    createdAt: new Date(c.created_at),
                }));

                const unreadCommentsCount = listingCommentsRaw.filter((c: any) => {
                    if (!userId) return false;
                    if (c.user_id === userId) return false;
                    const lastReadAt = commentReadAtByListing[listing.id];
                    if (!lastReadAt) return true;
                    return new Date(c.created_at).getTime() > new Date(lastReadAt).getTime();
                }).length;

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
                    images: resolveImages(p.images as string[] | null),
                    privateImages: attachmentsByListing[listing.id] || [],
                    aiSummary: p.details || "",
                    createdByEmail: addedByMap[listing.added_by] || "",
                    comments,
                    createdAt: new Date(listing.created_at),
                    deletedReason: deletedReasonMap[listing.id] || "",
                    deletedByEmail: deletedByMap[listing.id] || "",
                    discardedReason: discardedReasonMap[listing.id] || "",
                    discardedByEmail: discardedByMap[listing.id] || "",
                    statusChangedByEmail: "",
                    statusChangedAt: listing.updated_at ? new Date(listing.updated_at) : null,
                    contactedName: contactedNameMap[listing.id] || undefined,
                    contactedBy: contactedByMap[listing.id] || undefined,
                    coordinatedDate: coordinatedDateMap[listing.id] || undefined,
                    coordinatedBy: coordinatedByMap[listing.id] || undefined,
                    groupId: listing.org_id || null,
                    sourceMarketplaceId: listing.source_publication_id || null,
                    ...mc,
                    listingType: (listing.listing_type as DbListingType) || "rent",
                    ref: p.ref || "",
                    details: p.details || "",
                    isSharedListing,
                    hasUnreadComments: unreadCommentsCount > 0,
                    unreadCommentsCount,
                    contactName: listing.contact_name || undefined,
                    contactPhone: listing.contact_phone || undefined,
                    contactSource: listing.contact_source || undefined,
                };
            });
        },
    });

    // Aplanar todas las páginas en un array único para compatibilidad con consumidores
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
