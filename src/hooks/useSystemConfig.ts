import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook genérico para leer y escribir configuraciones del sistema desde Supabase.
 * La tabla `system_config` tiene estructura simple: key (PK) + value (texto).
 *
 * Mientras la primera carga no termina, `value` es "" para no mostrar el
 * default del código como si ya viniera de la BD. Tras la respuesta: valor de
 * la fila o `defaultValue` si no hay fila / está vacío. Si hay error de red,
 * se usa `defaultValue`.
 *
 * Ejemplo de uso:
 *   const { value, setValue } = useSystemConfig("add_button_config", "blue");
 */
export function useSystemConfig(key: string, defaultValue: string) {
    const queryClient = useQueryClient();
    const queryKey = ["system_config", key];

    const { data, isPending, isError } = useQuery({
        queryKey,
        queryFn: async (): Promise<string | null> => {
            const { data, error } = await supabase
                .from("system_config")
                .select("value")
                .eq("key", key)
                .maybeSingle();

            if (error) throw error;
            const raw = data?.value;
            if (raw == null || String(raw).trim() === "") return null;
            return String(raw).trim();
        },
        // Config estable: evitar reconsultas frecuentes en navegación y foco.
        // Se refresca explícitamente cuando el admin guarda (invalidateQueries).
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    });

    const value: string = isError
        ? defaultValue
        : isPending
          ? ""
          : data != null
            ? data
            : defaultValue;

    const { mutateAsync: setValue, isPending: isSaving } = useMutation({
        mutationFn: async (newValue: string) => {
            const { error } = await supabase
                .from("system_config")
                .upsert({ key, value: newValue }, { onConflict: "key" });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });

    return {
        value,
        isLoading: isPending,
        setValue,
        isSaving,
    };
}
