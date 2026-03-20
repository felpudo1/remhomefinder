import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook genérico para leer y escribir configuraciones del sistema desde Supabase.
 * La tabla `system_config` tiene estructura simple: key (PK) + value (texto).
 *
 * Ejemplo de uso:
 *   const { value, setValue } = useSystemConfig("add_button_config", "blue");
 */
export function useSystemConfig(key: string, defaultValue: string) {
    const queryClient = useQueryClient();
    const queryKey = ["system_config", key];

    // Leer el valor desde Supabase
    const { data: value, isLoading } = useQuery({
        queryKey,
        queryFn: async () => {
            const { data, error } = await supabase
                .from("system_config")
                .select("value")
                .eq("key", key)
                .maybeSingle();

            if (error) throw error;
            // Si no existe la fila, retornar el valor por defecto
            return data?.value ?? defaultValue;
        },
        // Config estable: evitar reconsultas frecuentes en navegación y foco.
        // Se refresca explícitamente cuando el admin guarda (invalidateQueries).
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    });

    // Guardar (upsert) el valor en Supabase
    const { mutateAsync: setValue, isPending: isSaving } = useMutation({
        mutationFn: async (newValue: string) => {
            const { error } = await supabase
                .from("system_config")
                .upsert({ key, value: newValue }, { onConflict: "key" });
            if (error) throw error;
        },
        onSuccess: () => {
            // Invalidar el cache para que se re-lea desde Supabase
            queryClient.invalidateQueries({ queryKey });
        },
    });

    return {
        value: value ?? defaultValue,
        isLoading,
        setValue,
        isSaving,
    };
}
