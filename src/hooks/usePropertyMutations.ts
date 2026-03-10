import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Property, PropertyStatus, PropertyComment } from "@/types/property";

/**
 * Hook especializado para las mutaciones de propiedades (escritura).
 */
export function usePropertyMutations() {
    const queryClient = useQueryClient();

    // 1. Agregar Propiedad
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

            const insertData: any = {
                user_id: user.id,
                url: form.url || "",
                title: form.title,
                price_rent: form.priceRent,
                price_expenses: form.priceExpenses,
                total_cost: form.priceRent + form.priceExpenses,
                currency: form.currency,
                neighborhood: form.neighborhood,
                city: form.city || "",
                sq_meters: form.sqMeters,
                rooms: form.rooms,
                ai_summary: form.aiSummary,
                created_by_email: user.email || "",
                images: form.images || [],
                listing_type: (form.listingType as "rent" | "sale") || "rent",
                group_id: form.groupId || null,
                ref: form.ref || "",
                details: form.details || "",
            };

            const { data, error } = await supabase
                .from("properties")
                .insert(insertData)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["properties"] });
        },
    });

    // 2. Actualizar Estado de Propiedad
    const updateStatusMutation = useMutation({
        mutationFn: async ({
            id,
            status,
            deletedReason,
            coordinatedDate,
            groupId,
            contactedName
        }: {
            id: string;
            status: PropertyStatus;
            deletedReason?: string;
            coordinatedDate?: string | null;
            groupId?: string | null;
            contactedName?: string
        }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No autenticado");

            // Datos de actualización con tipado estricto
            const updateData: any = {
                status,
                status_changed_by: user.id,
                status_changed_by_email: user.email || ""
            };

            if (groupId !== undefined) updateData.group_id = groupId;
            if (status === "coordinated" && coordinatedDate) updateData.coordinated_date = coordinatedDate;
            if (status === "contacted" && contactedName !== undefined) updateData.contacted_name = contactedName;
            if (status === "eliminado") {
                updateData.deleted_reason = deletedReason || "";
                updateData.deleted_by_email = user.email || "";
            }
            if (status === "discarded") {
                updateData.discarded_reason = deletedReason || "";
                updateData.discarded_by_email = user.email || "";
            }

            const { data, error } = await supabase
                .from("properties")
                .update(updateData)
                .eq("id", id)
                .select();

            if (error) throw error;
            if (!data || data.length === 0) throw new Error("Acción no permitida");

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
        onError: (err, variables, context) => {
            if (context?.previousProperties) {
                queryClient.setQueryData(["properties"], context.previousProperties);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["properties"] });
        },
    });

    // 3. Agregar Comentario
    const addCommentMutation = useMutation({
        mutationFn: async ({
            propertyId,
            comment,
        }: {
            propertyId: string;
            comment: Omit<PropertyComment, "id" | "createdAt">;
        }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No autenticado");

            const { data, error } = await supabase.from("property_comments").insert({
                property_id: propertyId,
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
