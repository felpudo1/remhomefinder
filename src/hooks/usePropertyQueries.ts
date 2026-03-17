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
                .select("*, properties(*), organizations(type, is_personal)") as any)
                .eq("admin_hidden", false)
                .order("created_at", { ascending: false });

            if (listingsError) throw listingsError;
            if (!listings || listings.length === 0) return [];

            const listingIds = listings.map((l) => l.id);
            const addedByIds: string[] = [...new Set(listings.map((l: any) => l.added_by).filter(Boolean))] as string[];
            const commentReadAtByListing: Record<string, string> = {};

            // 1.1 Obtener última lectura de comentarios por listing para el usuario actual
            // Si la tabla aún no existe en la BD del entorno, seguimos sin romper el flujo.
            if (currentUserId && listingIds.length > 0) {
                try {
                    const { data: readRows, error: readsError } = await (supabase as any)
                        .from("user_listing_comment_reads")
                        .select("user_listing_id, last_read_at")
                        .eq("user_id", currentUserId)
                        .in("user_listing_id", listingIds);

                    if (!readsError && readRows) {
                        readRows.forEach((row: { user_listing_id: string; last_read_at: string }) => {
                            commentReadAtByListing[row.user_listing_id] = row.last_read_at;
                        });
                    }
                } catch (error) {
                    console.warn("No se pudo leer user_listing_comment_reads:", error);
                }
            }

            // 2. Obtener emails/nombres de quienes ingresaron cada listing (added_by -> profiles)
            let addedByMap: Record<string, string> = {};
            if (addedByIds.length > 0) {
                const { data: profilesData } = await supabase
                    .from("profiles")
                    .select("user_id, email, display_name")
                    .in("user_id", addedByIds);
                profilesData?.forEach((pr) => {
                    addedByMap[pr.user_id] = pr.display_name || pr.email || "Usuario";
                });
            }

            // 3. Obtener contacted_name y changed_by de status_history_log para listings en estado "contactado"
            const contactadoListingIds = listings.filter((l) => l.current_status === "contactado").map((l) => l.id);
            let contactedNameMap: Record<string, string> = {};
            let contactedByMap: Record<string, string> = {};
            if (contactadoListingIds.length > 0) {
                const { data: contactadoLogs } = await supabase
                    .from("status_history_log")
                    .select("user_listing_id, event_metadata, changed_by, created_at")
                    .in("user_listing_id", contactadoListingIds)
                    .eq("new_status", "contactado")
                    .order("created_at", { ascending: false });
                const seen = new Set<string>();
                const changedByIds: string[] = [];
                contactadoLogs?.forEach((log) => {
                    if (seen.has(log.user_listing_id)) return;
                    seen.add(log.user_listing_id);
                    const meta = log.event_metadata as { contacted_name?: string } | null;
                    if (meta?.contacted_name) contactedNameMap[log.user_listing_id] = meta.contacted_name;
                    if (log.changed_by) {
                        contactedByMap[log.user_listing_id] = log.changed_by;
                        changedByIds.push(log.changed_by);
                    }
                });
                // Obtener display_name de quienes hicieron el cambio
                const uniqueChangedByIds = [...new Set(changedByIds)];
                if (uniqueChangedByIds.length > 0) {
                    const { data: changerProfiles } = await supabase
                        .from("profiles")
                        .select("user_id, display_name")
                        .in("user_id", uniqueChangedByIds);
                    const changerNameByUserId: Record<string, string> = {};
                    changerProfiles?.forEach((pr) => {
                        changerNameByUserId[pr.user_id] = pr.display_name || "Usuario";
                    });
                    Object.keys(contactedByMap).forEach((listingId) => {
                        const userId = contactedByMap[listingId];
                        contactedByMap[listingId] = changerNameByUserId[userId] || userId;
                    });
                }
            }

            // 4. Obtener changed_by de status_history_log para listings en estado "descartado"
            const descartadoListingIds = listings.filter((l) => l.current_status === "descartado").map((l) => l.id);
            let discardedByMap: Record<string, string> = {};
            if (descartadoListingIds.length > 0) {
                const { data: descartadoLogs } = await supabase
                    .from("status_history_log")
                    .select("user_listing_id, changed_by")
                    .in("user_listing_id", descartadoListingIds)
                    .eq("new_status", "descartado")
                    .order("created_at", { ascending: false });
                const seen = new Set<string>();
                const changedByIds: string[] = [];
                descartadoLogs?.forEach((log) => {
                    if (seen.has(log.user_listing_id)) return;
                    seen.add(log.user_listing_id);
                    if (log.changed_by) {
                        discardedByMap[log.user_listing_id] = log.changed_by;
                        changedByIds.push(log.changed_by);
                    }
                });
                const uniqueChangedByIds = [...new Set(changedByIds)];
                if (uniqueChangedByIds.length > 0) {
                    const { data: changerProfiles } = await supabase
                        .from("profiles")
                        .select("user_id, display_name")
                        .in("user_id", uniqueChangedByIds);
                    const changerNameByUserId: Record<string, string> = {};
                    changerProfiles?.forEach((pr) => {
                        changerNameByUserId[pr.user_id] = pr.display_name || "Usuario";
                    });
                    Object.keys(discardedByMap).forEach((listingId) => {
                        const userId = discardedByMap[listingId];
                        discardedByMap[listingId] = changerNameByUserId[userId] || userId;
                    });
                }
            }

            // 5. Estado "eliminado" no existe en user_listing_status (tabla status_history_log).
            // Se mantienen estos maps para compatibilidad con la UI (quedan vacíos en listados personales).
            const deletedByMap: Record<string, string> = {};
            const deletedReasonMap: Record<string, string> = {};

            // 6. Obtener coordinated_date y changed_by de status_history_log para listings en estado "visita_coordinada"
            const coordinadaListingIds = listings.filter((l) => l.current_status === "visita_coordinada").map((l) => l.id);
            let coordinatedDateMap: Record<string, Date> = {};
            let coordinatedByMap: Record<string, string> = {};
            if (coordinadaListingIds.length > 0) {
                const { data: coordinadaLogs } = await supabase
                    .from("status_history_log")
                    .select("user_listing_id, event_metadata, changed_by, created_at")
                    .in("user_listing_id", coordinadaListingIds)
                    .eq("new_status", "visita_coordinada")
                    .order("created_at", { ascending: false });
                const seen = new Set<string>();
                const changedByIds: string[] = [];
                coordinadaLogs?.forEach((log) => {
                    if (seen.has(log.user_listing_id)) return;
                    seen.add(log.user_listing_id);
                    const meta = log.event_metadata as { coordinated_date?: string } | null;
                    if (meta?.coordinated_date) {
                        const d = new Date(meta.coordinated_date);
                        if (!isNaN(d.getTime())) coordinatedDateMap[log.user_listing_id] = d;
                    }
                    if (log.changed_by) {
                        coordinatedByMap[log.user_listing_id] = log.changed_by;
                        changedByIds.push(log.changed_by);
                    }
                });
                const uniqueChangedByIds = [...new Set(changedByIds)];
                if (uniqueChangedByIds.length > 0) {
                    const { data: changerProfiles } = await supabase
                        .from("profiles")
                        .select("user_id, display_name")
                        .in("user_id", uniqueChangedByIds);
                    const changerNameByUserId: Record<string, string> = {};
                    changerProfiles?.forEach((pr) => {
                        changerNameByUserId[pr.user_id] = pr.display_name || "Usuario";
                    });
                    Object.keys(coordinatedByMap).forEach((listingId) => {
                        const userId = coordinatedByMap[listingId];
                        coordinatedByMap[listingId] = changerNameByUserId[userId] || userId;
                    });
                }
            }

            // 7. Get family comments for these listings
            let allComments: any[] = [];
            if (listingIds.length > 0) {
                const { data: commentsData, error: commentsError } = await supabase
                    .from("family_comments")
                    .select("*")
                    .in("user_listing_id", listingIds)
                    .order("created_at", { ascending: true });

                if (commentsError) throw commentsError;
                allComments = commentsData || [];
            }

            // 8. Get private attachments (fotos privadas por familia)
            let attachmentsByListing: Record<string, string[]> = {};
            const { data: attachmentsData } = await supabase
                .from("user_listing_attachments")
                .select("user_listing_id, image_url")
                .in("user_listing_id", listingIds);
            attachmentsData?.forEach((a) => {
                if (!attachmentsByListing[a.user_listing_id]) attachmentsByListing[a.user_listing_id] = [];
                attachmentsByListing[a.user_listing_id].push(a.image_url);
            });

            // 9. Map to UI model
            return listings.map((listing): Property => {
                const p = listing.properties as any;
                const org = Array.isArray(listing.organizations) ? listing.organizations[0] : listing.organizations;
                const isSharedListing = org?.is_personal === false;
                if (!p) {
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
                        discardedReason: "",
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
                        isSharedListing,
                        hasUnreadComments: false,
                        unreadCommentsCount: 0,
                    };
                }

                const listingCommentsRaw = allComments.filter((c) => c.user_listing_id === listing.id);

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
                    discardedReason: "",
                    discardedByEmail: discardedByMap[listing.id] || "",
                    statusChangedByEmail: "",
                    statusChangedAt: listing.updated_at ? new Date(listing.updated_at) : null,
                    contactedName: contactedNameMap[listing.id] || undefined,
                    contactedBy: contactedByMap[listing.id] || undefined,
                    coordinatedDate: coordinatedDateMap[listing.id] || undefined,
                    coordinatedBy: coordinatedByMap[listing.id] || undefined,
                    groupId: listing.org_id || null,
                    sourceMarketplaceId: listing.source_publication_id || null,
                    listingType: (listing.listing_type as DbListingType) || "rent",
                    ref: p.ref || "",
                    details: p.details || "",
                    isSharedListing,
                    hasUnreadComments: unreadCommentsCount > 0,
                    unreadCommentsCount,
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
