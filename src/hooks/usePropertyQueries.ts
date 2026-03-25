import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Property, PropertyComment } from "@/types/property";
import { resolveImages } from "@/lib/mappers/propertyMappers";
import type { UserListingStatus, DbListingType } from "@/types/supabase";

/**
 * Hook para leer user_listings + properties + family_comments del usuario autenticado.
 * Adaptado al nuevo esquema (organizations + user_listings).
 */
export function usePropertyQueries() {
    const queryClient = useQueryClient();

    // Obtener userId actual para usar como dependencia en la query key
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useEffect(() => {
        // Obtener userId inicial
        supabase.auth.getUser().then(({ data: { user } }) => {
            setCurrentUserId(user?.id || null);
        });

        // Suscribirse a cambios de auth para actualizar userId
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setCurrentUserId(session?.user.id || null);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    useEffect(() => {
        const onCommentsChange = () => queryClient.refetchQueries({ queryKey: ["properties", currentUserId] });

        const channelListings = supabase
            .channel("properties_realtime_listings")
            .on("postgres_changes", { event: "*", schema: "public", table: "user_listings" }, onCommentsChange)
            .on("postgres_changes", { event: "*", schema: "public", table: "properties" }, onCommentsChange)
            .on("postgres_changes", { event: "*", schema: "public", table: "user_listing_attachments" }, onCommentsChange)
            .subscribe();

        const channelComments = supabase
            .channel("properties_realtime_comments")
            .on("postgres_changes", { event: "*", schema: "public", table: "family_comments" }, onCommentsChange)
            .on("postgres_changes", { event: "*", schema: "public", table: "user_listing_comment_reads" }, onCommentsChange)
            .subscribe();

        return () => {
            supabase.removeChannel(channelListings);
            supabase.removeChannel(channelComments);
        };
    }, [queryClient, currentUserId]);

    const query = useQuery({
        queryKey: ["properties", currentUserId],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            const currentUserId = user?.id || null;

            // 1. Get user listings (includes org_id filter via RLS)
            const { data: listings, error: listingsError } = await (supabase
                .from("user_listings")
                .select("*, properties(*), organizations(type, is_personal), agent_publications!user_listings_source_publication_id_fkey(id, org_id, published_by, organizations(name))") as any)
                .eq("admin_hidden", false)
                .order("created_at", { ascending: false });

            if (listingsError) throw listingsError;
            if (!listings || listings.length === 0) return [];

            const listingIds = listings.map((l) => l.id);
            const addedByIds: string[] = [...new Set(listings.map((l: any) => l.added_by).filter(Boolean))] as string[];
            const contactadoListingIds = listings.filter((l) => l.current_status === "contactado").map((l) => l.id);
            const descartadoListingIds = listings.filter((l) => l.current_status === "descartado").map((l) => l.id);
            const coordinadaListingIds = listings.filter((l) => l.current_status === "visita_coordinada").map((l) => l.id);
            const sourcePublicationIds = Array.from(new Set(listings.map((l: any) => l.source_publication_id).filter(Boolean))) as string[];

            // 1.1 Iniciar todas las consultas adicionales en paralelo para evitar el efecto cascada (Senior Performance Opt)
            const [
                readsResult,
                profilesResult,
                contactadoResult,
                descartadoResult,
                coordinadaResult,
                commentsResult,
                attachmentsResult,
                contactsResult,
                orgNamesResult
            ] = await Promise.all([
                // Lectura de comentarios
                (currentUserId && listingIds.length > 0) 
                    ? (supabase as any).from("user_listing_comment_reads").select("user_listing_id, last_read_at").eq("user_id", currentUserId).in("user_listing_id", listingIds)
                    : Promise.resolve({ data: [] }),
                
                // Perfiles de quienes agregaron los listings
                addedByIds.length > 0 
                  ? supabase.from("profiles").select("user_id, email, display_name").in("user_id", addedByIds)
                  : Promise.resolve({ data: [] }),
                
                // Logs de estado: Contactado
                contactadoListingIds.length > 0
                  ? supabase.from("status_history_log").select("user_listing_id, event_metadata, changed_by, created_at").in("user_listing_id", contactadoListingIds).eq("new_status", "contactado").order("created_at", { ascending: false })
                  : Promise.resolve({ data: [] }),

                // Logs de estado: Descartado
                descartadoListingIds.length > 0
                  ? supabase.from("status_history_log").select("user_listing_id, changed_by, event_metadata").in("user_listing_id", descartadoListingIds).eq("new_status", "descartado").order("created_at", { ascending: false })
                  : Promise.resolve({ data: [] }),

                // Logs de estado: Visita Coordinada
                coordinadaListingIds.length > 0
                  ? supabase.from("status_history_log").select("user_listing_id, event_metadata, changed_by, created_at").in("user_listing_id", coordinadaListingIds).eq("new_status", "visita_coordinada").order("created_at", { ascending: false })
                  : Promise.resolve({ data: [] }),

                // Comentarios
                listingIds.length > 0
                  ? supabase.from("family_comments").select("*").in("user_listing_id", listingIds).order("created_at", { ascending: true })
                  : Promise.resolve({ data: [] }),

                // Adjuntos privados
                listingIds.length > 0
                  ? supabase.from("user_listing_attachments").select("user_listing_id, image_url").in("user_listing_id", listingIds)
                  : Promise.resolve({ data: [] }),

                // Contactos de marketplace
                sourcePublicationIds.length > 0
                  ? supabase.rpc("get_marketplace_publication_contacts" as any, { _publication_ids: sourcePublicationIds })
                  : Promise.resolve({ data: [] }),

                // Nombres de organizaciones para publicaciones de marketplace (fallback con SECURITY DEFINER)
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

            // 2. Mapeo de lecturas de comentarios
            const commentReadAtByListing: Record<string, string> = {};
            if (readsResult.data) {
                readsResult.data.forEach((row: any) => {
                    commentReadAtByListing[row.user_listing_id] = row.last_read_at;
                });
            }

            // 3. Mapeo de perfiles (added_by)
            const addedByMap: Record<string, string> = {};
            profilesResult.data?.forEach((pr: any) => {
                addedByMap[pr.user_id] = pr.display_name || pr.email || "Usuario";
            });

            // 4. Mapeo de logs de estado: Contactado
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

            // 5. Mapeo de logs de estado: Descartado
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

            // 6. Mapeo de logs de estado: Visita Coordinada
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

            // 7. Resolver nombres de quienes hicieron cambios de estado (Segunda fase de hidratación)
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

                // Actualizar los mapas con nombres reales
                Object.keys(contactedByMap).forEach(id => contactedByMap[id] = changerNameByUserId[contactedByMap[id]] || contactedByMap[id]);
                Object.keys(discardedByMap).forEach(id => discardedByMap[id] = changerNameByUserId[discardedByMap[id]] || discardedByMap[id]);
                Object.keys(coordinatedByMap).forEach(id => coordinatedByMap[id] = changerNameByUserId[coordinatedByMap[id]] || coordinatedByMap[id]);
            }

            // 8. Mapeo de comentarios — pre-indexar con Map para evitar O(N×M) en el .map posterior (Punto 4)
            const commentsByListingId = new Map<string, typeof commentsResult.data>();
            (commentsResult.data || []).forEach((c: any) => {
                const arr = commentsByListingId.get(c.user_listing_id) || [];
                arr.push(c);
                commentsByListingId.set(c.user_listing_id, arr);
            });

            // 9. Mapeo de adjuntos
            const attachmentsByListing: Record<string, string[]> = {};
            attachmentsResult.data?.forEach((a: any) => {
                if (!attachmentsByListing[a.user_listing_id]) attachmentsByListing[a.user_listing_id] = [];
                attachmentsByListing[a.user_listing_id].push(a.image_url);
            });

            // 10. Mapeo de contactos de marketplace
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

            // 11. Eliminar estados no usados (Legacy compatibility)
            const deletedByMap: Record<string, string> = {};
            const deletedReasonMap: Record<string, string> = {};

            // 9. Map to UI model
            return listings.map((listing): Property => {
                const p = listing.properties as any;
                const org = Array.isArray(listing.organizations) ? listing.organizations[0] : listing.organizations;
                const isSharedListing = org?.is_personal === false;
                if (!p) {
                    const relationName = undefined;
                    const relationPhone = undefined;
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
                    const marketplaceAgentName = relationName || publicationName;
                    const marketplaceAgentPhone = relationPhone || publicationPhone;
                    const marketplaceContactSource = !listing.source_publication_id
                        ? undefined
                        : relationName || relationPhone
                            ? "relacion_publicacion"
                            : publicationName || publicationPhone
                                ? "publicacion_lookup"
                                : "sin_datos";
                    // Fallback if join fails
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
                        marketplaceOrgName,
                        marketplaceAgentName,
                        marketplaceAgentPhone,
                        marketplaceContactSource,
                        isSharedListing,
                        hasUnreadComments: false,
                        unreadCommentsCount: 0,
                        // Columnas en user_listings (texto plano), no JSON embebido
                        contactName: listing.contact_name || undefined,
                        contactPhone: listing.contact_phone || undefined,
                        contactSource: listing.contact_source || undefined,
                    };
                }

                const listingCommentsRaw = commentsByListingId.get(listing.id) || [];

                const comments = listingCommentsRaw
                    .map((c): PropertyComment => ({
                        id: c.id,
                        author: c.author || "Anónimo",
                        avatar: c.avatar || "",
                        text: c.text || "",
                        createdAt: new Date(c.created_at),
                    }));

                const unreadCommentsCount = listingCommentsRaw.filter((c: any) => {
                    if (!currentUserId) return false;
                    const isFromAnotherMember = c.user_id !== currentUserId;
                    if (!isFromAnotherMember) return false;

                    const lastReadAt = commentReadAtByListing[listing.id];
                    // Si nunca abrió el detalle, consideramos no leídos todos los comentarios ajenos.
                    if (!lastReadAt) return true;

                    return new Date(c.created_at).getTime() > new Date(lastReadAt).getTime();
                }).length;

                const relationName = undefined;
                const relationPhone = undefined;
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
                const marketplaceAgentName = relationName || publicationName;
                const marketplaceAgentPhone = relationPhone || publicationPhone;
                const marketplaceContactSource = !listing.source_publication_id
                    ? undefined
                    : relationName || relationPhone
                        ? "relacion_publicacion"
                        : publicationName || publicationPhone
                            ? "publicacion_lookup"
                            : "sin_datos";

                return {
                    id: listing.id, // Use listing ID as the main ID for UI operations
                    propertyId: p.id, // Real property UUID for property_reviews FK
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
                    marketplaceOrgName,
                    marketplaceAgentName,
                    marketplaceAgentPhone,
                    marketplaceContactSource,
                    listingType: (listing.listing_type as DbListingType) || "rent",
                    ref: p.ref || "",
                    details: p.details || "",
                    isSharedListing,
                    hasUnreadComments: unreadCommentsCount > 0,
                    unreadCommentsCount,
                    // Columnas en user_listings (texto plano), no JSON embebido
                    contactName: listing.contact_name || undefined,
                    contactPhone: listing.contact_phone || undefined,
                    contactSource: listing.contact_source || undefined,
                };
            });
        },
    });

    return {
        properties: query.data || [],
        loading: query.isLoading,
        error: query.error,
        refetch: () => queryClient.invalidateQueries({ queryKey: ["properties"] }),
    };
}
