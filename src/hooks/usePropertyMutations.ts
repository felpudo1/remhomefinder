import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { normalizeUrl } from "@/lib/duplicateCheck";
import { Property, PropertyStatus, PropertyComment } from "@/types/property";
import type { CurrencyCode, UserListingStatus } from "@/types/supabase";

/** Inserta una nueva property y devuelve su id */
async function insertNewProperty(
    form: { url?: string; title: string; priceRent: number; priceExpenses: number; currency: string; neighborhood: string; city: string; sqMeters: number; rooms: number; images?: string[]; ref?: string; aiSummary?: string; details?: string },
    userId: string
) {
    const { data: prop, error: propError } = await supabase
        .from("properties")
        .insert({
            source_url: form.url || null,
            title: form.title,
            price_amount: form.priceRent,
            price_expenses: form.priceExpenses,
            total_cost: form.priceRent + form.priceExpenses,
            currency: form.currency as CurrencyCode,
            neighborhood: form.neighborhood,
            city: form.city || "",
            m2_total: form.sqMeters,
            rooms: form.rooms,
            images: form.images || [],
            created_by: userId,
            ref: form.ref || "",
            details: form.aiSummary || form.details || "",
        })
        .select("id")
        .single();
    if (propError) {
        const msg = propError.message || "Error al guardar la propiedad";
        const isUniqueUrl = String(propError.code) === "23505" && /source_url|unique/i.test(msg);
        throw new Error(isUniqueUrl ? "Esta URL ya existe en el sistema (agregada por otra familia)." : msg);
    }
    return prop?.id;
}

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
            privateImages?: string[];
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

            const normalizedUrl = form.url ? normalizeUrl(form.url) : null;

            // Buscar si existe property con esa URL (otra familia ya la ingresó)
            let propId: string;
            if (normalizedUrl) {
                const { data: existing, error: existingErr } = await supabase
                    .from("properties")
                    .select("id")
                    .eq("source_url", normalizedUrl)
                    .limit(1)
                    .maybeSingle();
                if (!existingErr && existing) {
                    propId = existing.id;
                } else {
                    propId = (await insertNewProperty(form, user.id)) as string;
                }
            } else {
                propId = (await insertNewProperty(form, user.id)) as string;
            }

            // Insert into user_listings (tracking)
            const { data: listing, error: listingError } = await supabase
                .from("user_listings")
                .insert({
                    property_id: propId,
                    org_id: orgId,
                    listing_type: (form.listingType as "rent" | "sale") || "rent",
                    added_by: user.id,
                })
                .select()
                .single();

            if (listingError) {
                const msg = listingError.message || "Error al guardar el listado";
                throw new Error(msg);
            }

            // Insertar fotos privadas (user_listing_attachments)
            if (form.privateImages?.length && listing) {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const rows = form.privateImages.map((image_url) => ({
                        user_listing_id: listing.id,
                        image_url,
                        added_by: user.id,
                    }));
                    await supabase.from("user_listing_attachments").insert(rows);
                }
            }
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
            discardedAttributeIds,
            prosAndCons,
            contactedFeedback,
        }: {
            id: string;
            status: PropertyStatus;
            deletedReason?: string;
            coordinatedDate?: string | null;
            groupId?: string | null;
            contactedName?: string;
            discardedAttributeIds?: string[];
            prosAndCons?: { positiveIds: string[]; negativeIds: string[] };
            contactedFeedback?: { interest: number; urgency: number };
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
            if (contactedFeedback) {
                eventMetadata.contacted_interest = contactedFeedback.interest;
                eventMetadata.contacted_urgency = contactedFeedback.urgency;
            }

            // Insert into status_history_log (trigger auto-updates user_listings.current_status)
            const { data: insertedLog, error } = await supabase
                .from("status_history_log")
                .insert({
                    user_listing_id: id,
                    old_status: listing?.current_status || null,
                    new_status: newStatus as UserListingStatus,
                    changed_by: user.id,
                    event_metadata: eventMetadata,
                })
                .select("id")
                .single();

            if (error) throw error;

            // Si hay motivos de descarte, insertar en attribute_scores (score=1 indica motivo seleccionado)
            if (insertedLog?.id && discardedAttributeIds?.length) {
                const rows = discardedAttributeIds.map((attribute_id) => ({
                    history_log_id: insertedLog.id,
                    attribute_id,
                    score: 1,
                }));
                const { error: scoresError } = await supabase.from("attribute_scores").insert(rows);
                if (scoresError) throw scoresError;
            }

            // Si hay pros/contras (firme_candidato, posible_interes): score 5 = positivo, score 1 = negativo
            if (insertedLog?.id && prosAndCons) {
                const positiveRows = prosAndCons.positiveIds.map((attribute_id) => ({
                    history_log_id: insertedLog.id,
                    attribute_id,
                    score: 5,
                }));
                const negativeRows = prosAndCons.negativeIds.map((attribute_id) => ({
                    history_log_id: insertedLog.id,
                    attribute_id,
                    score: 1,
                }));
                const allRows = [...positiveRows, ...negativeRows];
                if (allRows.length > 0) {
                    const { error: scoresError } = await supabase.from("attribute_scores").insert(allRows);
                    if (scoresError) throw scoresError;
                }
            }

            // Update org if groupId changed
            if (groupId !== undefined) {
                await supabase
                    .from("user_listings")
                    .update({ org_id: groupId })
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
        onSuccess: () => {
            queryClient.refetchQueries({ queryKey: ["properties"] });
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
