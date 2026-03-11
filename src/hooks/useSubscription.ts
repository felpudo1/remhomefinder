import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useSystemConfig } from "./useSystemConfig";

import {
    FREE_PLAN_SAVE_LIMIT_KEY,
    FREE_PLAN_SAVE_LIMIT_DEFAULT
} from "@/lib/config-keys";

/**
 * Hook centralizado para gestionar la suscripción y límites del usuario.
 * @returns { isPremium, maxSaves, canSaveMore, isLoading }
 */
export function useSubscription() {
    // 1. Obtener el perfil del usuario para saber su plan
    const { data: profile, isLoading: isLoadingProfile } = useQuery({
        queryKey: ["user-profile-subscription"],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;

            const { data, error } = await supabase
                .from("profiles")
                .select("plan_type")
                .eq("user_id", user.id)
                .maybeSingle();

            if (error) throw error;
            return data;
        }
    });

    // 2. Obtener el límite dinámico desde la configuración del sistema
    const { value: saveLimitRaw, isLoading: isLoadingConfig } = useSystemConfig(
        FREE_PLAN_SAVE_LIMIT_KEY,
        FREE_PLAN_SAVE_LIMIT_DEFAULT
    );

    const isPremium = profile?.plan_type === "premium";
    const maxSaves = isPremium ? Infinity : parseInt(saveLimitRaw || FREE_PLAN_SAVE_LIMIT_DEFAULT);

    /**
     * Verifica si el usuario puede guardar una propiedad más.
     * @param currentCount El número actual de propiedades del usuario.
     */
    const canSaveMore = (currentCount: number) => {
        if (isPremium) return true;
        return currentCount < maxSaves;
    };

    return {
        plan: profile?.plan_type || "free",
        isPremium,
        maxSaves,
        canSaveMore,
        isLoading: isLoadingProfile || isLoadingConfig
    };
}
