import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

/**
 * Hook para gestionar el sistema de estrellas (property_reviews).
 * Usa organizations + organization_members en lugar de groups.
 * Realtime: invalida la query cuando otro miembro vota.
 */
export function usePropertyRating(propertyId: string, groupId: string | null) {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    useEffect(() => {
        if (!propertyId || !groupId) return;
        const channel = supabase
            .channel(`property-rating-${propertyId}-${groupId}`)
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "property_reviews", filter: `property_id=eq.${propertyId}` },
                () => queryClient.invalidateQueries({ queryKey: ["property-rating", propertyId, groupId] })
            )
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [propertyId, groupId, queryClient]);

    const { data: ratingsData, isLoading } = useQuery({
        queryKey: ["property-rating", propertyId, groupId],
        enabled: !!propertyId && !!groupId,
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;

            // We need the actual property_id (not listing ID). 
            // If propertyId is a listing ID, we need to resolve it.
            // For now, query property_reviews by property_id and org_id
            const { data: ratings, error: ratingsError } = await supabase
                .from("property_reviews")
                .select("*")
                .eq("property_id", propertyId)
                .eq("org_id", groupId);

            if (ratingsError) throw ratingsError;

            const { count: groupMembersCount, error: groupError } = await supabase
                .from("organization_members")
                .select("*", { count: 'exact', head: true })
                .eq("org_id", groupId);

            if (groupError) throw groupError;

            const userVote = ratings?.find((r) => r.user_id === user.id)?.rating || 0;
            const totalVotes = ratings?.length || 0;
            const averageRating = totalVotes > 0
                ? ratings!.reduce((acc, curr) => acc + curr.rating, 0) / totalVotes
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

    const rateMutation = useMutation({
        mutationFn: async (newRating: number) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || !groupId) throw new Error("Acceso denegado");

            const { error } = await supabase
                .from("property_reviews")
                .upsert({
                    property_id: propertyId,
                    user_id: user.id,
                    org_id: groupId,
                    rating: newRating,
                }, { onConflict: "property_id,user_id" });

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["property-rating", propertyId, groupId] });
            toast({ title: "¡Voto registrado!", description: "Tu familia podrá ver tu opinión. ⭐" });
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
