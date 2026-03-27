import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/contexts/AuthProvider";

/**
 * Hook para gestionar el sistema de estrellas (property_reviews).
 * Usa organizations + organization_members en lugar de groups.
 * 
 * NOTA: Se eliminó el canal Realtime dinámico que creaba 1 WebSocket
 * por cada propiedad abierta (escalabilidad). La mutation ya refetchea
 * vía invalidateQueries al votar. Si otro usuario vota, se actualiza
 * al reabrir el modal.
 */
export function usePropertyRating(propertyId: string, groupId: string | null) {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const { user: authUser } = useCurrentUser();

    const { data: ratingsData, isLoading } = useQuery({
        queryKey: ["property-rating", propertyId, groupId],
        enabled: !!propertyId && !!groupId && !!authUser,
        queryFn: async () => {
            if (!authUser) return null;

            // Proyectar solo las columnas necesarias (evitar traer campos pesados)
            const { data: ratings, error: ratingsError } = await supabase
                .from("property_reviews")
                .select("user_id, rating")
                .eq("property_id", propertyId)
                .eq("org_id", groupId);

            if (ratingsError) throw ratingsError;

            const { count: groupMembersCount, error: groupError } = await supabase
                .from("organization_members")
                .select("*", { count: 'exact', head: true })
                .eq("org_id", groupId);

            if (groupError) throw groupError;

            const userVote = ratings?.find((r) => r.user_id === authUser.id)?.rating || 0;
            const totalVotes = ratings?.length || 0;
            const averageRating = totalVotes > 0
                ? ratings!.reduce((acc, curr) => acc + curr.rating, 0) / totalVotes
                : 0;

            return {
                userVote,
                averageRating,
                totalVotes,
                totalGroupMembers: groupMembersCount || 0,
                userId: authUser.id
            };
        },
    });

    const rateMutation = useMutation({
        mutationFn: async (newRating: number) => {
            if (!authUser || !groupId) throw new Error("Acceso denegado");

            const { error } = await supabase
                .from("property_reviews")
                .upsert({
                    property_id: propertyId,
                    user_id: authUser.id,
                    org_id: groupId,
                    rating: newRating,
                }, { onConflict: "property_id,user_id" });

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["property-rating", propertyId, groupId] });
            const hasFamilyGroup = (ratingsData?.totalGroupMembers || 0) > 1;
            toast({
                title: "¡Voto registrado!",
                description: hasFamilyGroup
                    ? "Tu grupo familiar podrá ver tu calificación. ⭐"
                    : "Tu calificación se guardó correctamente. ⭐",
            });
        },
        onError: (error: any) => {
            const isDuplicate = error.code === "23505" ||
                error.message?.includes("unique constraint");

            toast({
                title: "Error al votar",
                description: isDuplicate ? "Este aviso ya fue puntuado." : error.message,
                variant: "destructive"
            });
        },
    });

    return {
        userVote: ratingsData?.userVote || 0,
        averageRating: ratingsData?.averageRating || 0,
        totalVotes: ratingsData?.totalVotes || 0,
        totalGroupMembers: ratingsData?.totalGroupMembers || 0,
        isLoading,
        rate: (val: number) => rateMutation.mutate(val),
    };
}
