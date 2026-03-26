import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/contexts/AuthProvider";
import { useQuery } from "@tanstack/react-query";
import { useSystemConfig } from "./useSystemConfig";

import {
    USER_FREE_PLAN_SAVE_LIMIT_KEY,
    USER_FREE_PLAN_SAVE_LIMIT_DEFAULT,
    AGENT_FREE_PLAN_PUBLISH_LIMIT_KEY,
    AGENT_FREE_PLAN_PUBLISH_LIMIT_DEFAULT
} from "@/lib/config-keys";

/**
 * Hook centralizado para gestionar la suscripción y límites del usuario.
 * @returns { isPremium, maxSaves, canSaveMore, maxAgentPublishes, canAgentPublishMore, isLoading }
 */
export function useSubscription() {
    // Leer userId del AuthProvider centralizado (0 auth requests HTTP)
    const { user: authUser } = useCurrentUser();

    // 1. Obtener el perfil del usuario para saber su plan
    const { data: profile, isLoading: isLoadingProfile } = useQuery({
        queryKey: ["user-profile-subscription", authUser?.id],
        enabled: !!authUser,
        // Plan del usuario cambia rara vez (admin) — cachear 10 min
        staleTime: 10 * 60 * 1000,
        queryFn: async () => {
            // El user ya viene del AuthProvider — no necesitamos llamar a getUser()
            if (!authUser) return null;

            const { data, error } = await supabase
                .from("profiles")
                .select("plan_type")
                .eq("user_id", authUser.id)
                .maybeSingle();

            if (error) throw error;
            return data;
        }
    });

    // 2. Obtener límites dinámicos desde la configuración del sistema
    const { value: saveLimitRaw, isLoading: isLoadingSaveConfig } = useSystemConfig(
        USER_FREE_PLAN_SAVE_LIMIT_KEY,
        USER_FREE_PLAN_SAVE_LIMIT_DEFAULT
    );

    const { value: publishLimitRaw, isLoading: isLoadingPublishConfig } = useSystemConfig(
        AGENT_FREE_PLAN_PUBLISH_LIMIT_KEY,
        AGENT_FREE_PLAN_PUBLISH_LIMIT_DEFAULT
    );

    const isPremium = profile?.plan_type === "premium";

    // Límites para usuarios regulares
    const maxSaves = isPremium ? Infinity : parseInt(saveLimitRaw || USER_FREE_PLAN_SAVE_LIMIT_DEFAULT);

    // Límites para agentes/agencias
    const maxAgentPublishes = isPremium ? Infinity : parseInt(publishLimitRaw || AGENT_FREE_PLAN_PUBLISH_LIMIT_DEFAULT);

    /**
     * Verifica si el usuario puede guardar una propiedad más. (Para usuarios regulares)
     */
    const canSaveMore = (currentCount: number) => {
        if (isPremium) return true;
        return currentCount < maxSaves;
    };

    /**
     * Verifica si el agente puede publicar una propiedad más en el marketplace.
     */
    const canAgentPublishMore = (currentCount: number) => {
        if (isPremium) return true;
        return currentCount < maxAgentPublishes;
    };

    return {
        plan: profile?.plan_type || "free",
        isPremium,
        maxSaves,
        canSaveMore,
        maxAgentPublishes,
        canAgentPublishMore,
        isLoading: isLoadingProfile || isLoadingSaveConfig || isLoadingPublishConfig
    };
}
