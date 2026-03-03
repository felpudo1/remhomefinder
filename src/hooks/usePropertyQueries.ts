import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { mapDbToProperty } from "@/lib/mappers/propertyMappers";

/**
 * Hook especializado para la lectura de propiedades.
 * Maneja la subscripción en tiempo real y la cache de TanStack Query.
 */
export function usePropertyQueries() {
    const queryClient = useQueryClient();

    // Suscripción en tiempo real (Real-time)
    useEffect(() => {
        const channel = supabase
            .channel("properties_queries_realtime")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "property_comments" },
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
            // 1. Obtener propiedades
            const { data: props, error: propsError } = await supabase
                .from("properties")
                .select("*")
                .order("created_at", { ascending: false });

            if (propsError) throw propsError;
            if (!props) return [];

            const propertyIds = props.map((p) => p.id);

            // 2. Obtener comentarios asociados
            let allComments: any[] = [];
            if (propertyIds.length > 0) {
                const { data: commentsData, error: commentsError } = await supabase
                    .from("property_comments")
                    .select("*")
                    .in("property_id", propertyIds)
                    .order("created_at", { ascending: true });

                if (commentsError) throw commentsError;
                allComments = commentsData || [];
            }

            // 3. Mapear datos a modelo UI
            return props.map((p) =>
                mapDbToProperty(p, allComments.filter((c) => c.property_id === p.id))
            );
        },
    });

    return {
        properties: query.data || [],
        loading: query.isLoading,
        error: query.error,
        refetch: () => queryClient.invalidateQueries({ queryKey: ["properties"] }),
    };
}
