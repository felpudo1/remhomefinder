import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
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

    useEffect(() => {
        const channel = supabase
            .channel("properties_queries_realtime")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "family_comments" },
                () => queryClient.invalidateQueries({ queryKey: ["properties"] })
            )
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "user_listings" },
                () => queryClient.invalidateQueries({ queryKey: ["properties"] })
            )
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "properties" },
                () => queryClient.invalidateQueries({ queryKey: ["properties"] })
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [queryClient]);

    const query = useQuery({
        queryKey: ["properties"],
        queryFn: async () => {
            // 1. Get user listings (includes org_id filter via RLS)
            const { data: listings, error: listingsError } = await (supabase
                .from("user_listings")
                .select("*, properties(*)") as any)
                .eq("admin_hidden", false)
                .order("created_at", { ascending: false });

            if (listingsError) throw listingsError;
            if (!listings || listings.length === 0) return [];

            const listingIds = listings.map((l) => l.id);

            // 2. Get family comments for these listings
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

            // 3. Map to UI model
            return listings.map((listing): Property => {
                const p = listing.properties as any;
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
                        aiSummary: "",
                        createdByEmail: "",
                        comments: [],
                        createdAt: new Date(listing.created_at),
                        deletedReason: "",
                        deletedByEmail: "",
                        discardedReason: "",
                        discardedByEmail: "",
                        statusChangedByEmail: "",
                        listingType: listing.listing_type || "rent",
                        ref: "",
                        details: "",
                        sourceMarketplaceId: listing.source_publication_id || null,
                    };
                }

                const comments = allComments
                    .filter((c) => c.user_listing_id === listing.id)
                    .map((c): PropertyComment => ({
                        id: c.id,
                        author: c.author || "Anónimo",
                        avatar: c.avatar || "",
                        text: c.text || "",
                        createdAt: new Date(c.created_at),
                    }));

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
                    aiSummary: p.details || "",
                    createdByEmail: "",
                    comments,
                    createdAt: new Date(listing.created_at),
                    deletedReason: "",
                    deletedByEmail: "",
                    discardedReason: "",
                    discardedByEmail: "",
                    statusChangedByEmail: "",
                    statusChangedAt: listing.updated_at ? new Date(listing.updated_at) : null,
                    groupId: listing.org_id || null,
                    sourceMarketplaceId: listing.source_publication_id || null,
                    listingType: (listing.listing_type as DbListingType) || "rent",
                    ref: p.ref || "",
                    details: p.details || "",
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
