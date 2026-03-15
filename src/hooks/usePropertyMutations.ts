import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Property, PropertyStatus, PropertyComment } from "@/types/property";

/**
 * Hook para mutaciones: insertar propiedades + user_listings,
 * cambiar estado via status_history_log, agregar family_comments.
 */
export function usePropertyMutations() {
    const queryClient = useQueryClient();

    // 1. Agregar Propiedad (properties + user_listings)
    const addPropertyMutation = useMutation({
        mutationFn: async (form: {
            url: string;
            title: string;
            priceRent: number;
            priceExpenses: number;
            currency: string;
            neighborhood: string;
            city: string;
            sqMeters: number;
            rooms: number;
            aiSummary: string;
            images?: string[];
            groupId?: string | null;
            listingType?: string;
            ref?: string;
            details?: string;
        }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No autenticado");

            // Get user's org
            let orgId = form.groupId;
            if (!orgId) {
                const { data: membership } = await supabase
                    .from("organization_members")
                    .select("org_id")
                    .eq("user_id", user.id)
                    .limit(1)
                    .maybeSingle();
                orgId = membership?.org_id || null;
            }
            if (!orgId) throw new Error("No pertenecés a ninguna organización");

            // Insert into properties (physical metadata)
            const { data: prop, error: propError } = await supabase
                .from("properties")
                .insert({
                    source_url: form.url || null,
                    title: form.title,
                    price_amount: form.priceRent,
                    price_expenses: form.priceExpenses,
                    total_cost: form.priceRent + form.priceExpenses,
                    currency: form.currency as any,
                    neighborhood: form.neighborhood,
                    city: form.city || "",
                    m2_total: form.sqMeters,
                    rooms: form.rooms,
                    images: form.images || [],
                    created_by: user.id,
                    ref: form.ref || "",
                    details: form.aiSummary || form.details || "",
                })
                .select()
                .single();

            if (propError) throw propError;

            // Insert into user_listings (tracking)
            const { data: listing, error: listingError } = await supabase
                .from("user_listings")
                .insert({
                    property_id: prop.id,
                    org_id: orgId,
                    listing_type: (form.listingType as "rent" | "sale") || "rent",
                    added_by: user.id,
                })
                .select()
                .single();

            if (listingError) throw listingError;
            return listing;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["properties"] });
        },
    });

    // 2. Actualizar Estado via status_history_log
    const updateStatusMutation = useMutation({
        mutationFn: async ({
            id, // This is now the user_listing ID
            status,
            deletedReason,
            coordinatedDate,
            groupId,
            contactedName,
        }: {
            id: string;
            status: PropertyStatus;
            deletedReason?: string;
            coordinatedDate?: string | null;
            groupId?: string | null;
            contactedName?: string;
        }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No autenticado");

            // Map old status names to new enum values
            const statusMap: Record<string, string> = {
                ingresado: "ingresado",
                contacted: "contactado",
                coordinated: "visita_coordinada",
                visited: "visitado",
                discarded: "descartado",
                a_analizar: "a_analizar",
            };

            const newStatus = statusMap[status] || status;

            // Get current status
            const { data: listing } = await supabase
                .from("user_listings")
                .select("current_status")
                .eq("id", id)
                .single();

            // Build event metadata
            const eventMetadata: any = {};
            if (deletedReason) eventMetadata.reason = deletedReason;
            if (coordinatedDate) eventMetadata.coordinated_date = coordinatedDate;
            if (contactedName) eventMetadata.contacted_name = contactedName;

            // Insert into status_history_log (trigger auto-updates user_listings.current_status)
            const { error } = await supabase
                .from("status_history_log")
                .insert({
                    user_listing_id: id,
                    old_status: listing?.current_status || null,
                    new_status: newStatus as any,
                    changed_by: user.id,
                    event_metadata: eventMetadata,
                });

            if (error) throw error;

            // Update org if groupId changed
            if (groupId !== undefined) {
                await supabase
                    .from("user_listings")
                    .update({ org_id: groupId } as any)
                    .eq("id", id);
            }

            return { id, status };
        },
        onMutate: async ({ id, status }) => {
            await queryClient.cancelQueries({ queryKey: ["properties"] });
            const previousProperties = queryClient.getQueryData<Property[]>(["properties"]);
            if (previousProperties) {
                queryClient.setQueryData<Property[]>(
                    ["properties"],
                    previousProperties.map((p) => (p.id === id ? { ...p, status } : p))
                );
            }
            return { previousProperties };
        },
        onError: (_err, _variables, context) => {
            if (context?.previousProperties) {
                queryClient.setQueryData(["properties"], context.previousProperties);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["properties"] });
        },
    });

    // 3. Agregar Comentario (family_comments)
    const addCommentMutation = useMutation({
        mutationFn: async ({
            propertyId, // This is actually the user_listing ID now
            comment,
        }: {
            propertyId: string;
            comment: Omit<PropertyComment, "id" | "createdAt">;
        }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No autenticado");

            const { data, error } = await supabase.from("family_comments").insert({
                user_listing_id: propertyId,
                user_id: user.id,
                author: comment.author,
                avatar: comment.avatar,
                text: comment.text,
            }).select();

            if (error) throw error;
            if (!data || data.length === 0) throw new Error("Acción no permitida");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["properties"] });
        },
    });

    return {
        addProperty: addPropertyMutation.mutateAsync,
        updateStatus: updateStatusMutation.mutateAsync,
        addComment: addCommentMutation.mutateAsync,
    };
}
