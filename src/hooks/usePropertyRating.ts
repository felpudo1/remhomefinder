import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

/**
 * Hook para gestionar el sistema de estrellas (REGLA 2)
 * Se encarga de la persistencia en Supabase y la lógica de promedios.
 */
export function usePropertyRating(propertyId: string, groupId: string | null) {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    // 1. Obtener la calificación del usuario actual y el promedio del grupo
    const { data: ratingsData, isLoading } = useQuery({
        queryKey: ["property-rating", propertyId, groupId],
        enabled: !!propertyId && !!groupId,
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;

            // 1. Obtenemos todos los votos del grupo para esta propiedad
            const { data: ratings, error: ratingsError } = await (supabase
                .from("property_ratings" as any)
                .select("*") as any)
                .eq("property_id", propertyId)
                .eq("group_id", groupId);

            if (ratingsError) throw ratingsError;

            // 2. Obtenemos el total de integrantes del grupo
            const { count: groupMembersCount, error: groupError } = await supabase
                .from("group_members")
                .select("*", { count: 'exact', head: true })
                .eq("group_id", groupId);

            if (groupError) throw groupError;

            const userVote = ratings.find((r) => r.user_id === user.id)?.rating || 0;
            const totalVotes = ratings.length;
            const averageRating = totalVotes > 0
                ? ratings.reduce((acc, curr) => acc + curr.rating, 0) / totalVotes
                : 0;

            return {
                userVote,
                averageRating,
                totalVotes,
                totalGroupMembers: groupMembersCount || 0,
                userId: user.id
            };
        },
    });

    // 2. Mutación para guardar/actualizar el voto
    const rateMutation = useMutation({
        mutationFn: async (newRating: number) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || !groupId) throw new Error("Acceso denegado");

            // Usar upsert basado en el UNIQUE(property_id, user_id)
            const { error } = await (supabase
                .from("property_ratings" as any)
                .upsert as any)({
                    property_id: propertyId,
                    user_id: user.id,
                    group_id: groupId,
                    rating: newRating,
                });

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["property-rating", propertyId, groupId] });
            toast({ title: "¡Voto registrado!", description: "Tu familia podrá ver tu opinión. ⭐" });
        },
        onError: (error: any) => {
            toast({
                title: "Error al votar",
                description: error.message,
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
