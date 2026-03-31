import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/contexts/AuthProvider";
import { useQuery } from "@tanstack/react-query";
import { useSystemConfig } from "./useSystemConfig";

import {
    USER_FREE_PLAN_SAVE_LIMIT_KEY,
    USER_FREE_PLAN_SAVE_LIMIT_DEFAULT,
    USER_PREMIUM_PLAN_SAVE_LIMIT_KEY,
    USER_PREMIUM_PLAN_SAVE_LIMIT_DEFAULT,
    AGENT_FREE_PLAN_PUBLISH_LIMIT_KEY,
    AGENT_FREE_PLAN_PUBLISH_LIMIT_DEFAULT,
    AGENT_REFERRAL_BONUS_SAVES_KEY,
    AGENT_REFERRAL_BONUS_SAVES_DEFAULT
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
                .select("plan_type, referred_by_id")
                .eq("user_id", authUser.id)
                .maybeSingle();

            if (error) throw error;
            return data;
        }
    });

    // 2. Verificar si el referrer del usuario es un agente (tiene organización)
    const referredById = profile?.referred_by_id ?? null;
    const { data: isReferredByAgent } = useQuery({
        queryKey: ["referrer-is-agent", referredById],
        enabled: !!referredById,
        // Esto no cambia nunca — cachear largo
        staleTime: 60 * 60 * 1000,
        queryFn: async () => {
            if (!referredById) return false;
            // Usamos un RPC para saltar el RLS de organizations
            const { data, error } = await supabase
                .rpc("is_agent_referrer", { _user_id: referredById });
            
            if (error) {
                console.error("Error al verificar referrer:", error);
                return false;
            }
            return !!data;
        }
    });

    // 2. Obtener límites dinámicos desde la configuración del sistema
    const { value: saveLimitRaw, isLoading: isLoadingSaveConfig } = useSystemConfig(
        USER_FREE_PLAN_SAVE_LIMIT_KEY,
        USER_FREE_PLAN_SAVE_LIMIT_DEFAULT
    );

    // Límite de guardado para usuarios premium (configurable desde admin)
    const { value: premiumSaveLimitRaw, isLoading: isLoadingPremiumConfig } = useSystemConfig(
        USER_PREMIUM_PLAN_SAVE_LIMIT_KEY,
        USER_PREMIUM_PLAN_SAVE_LIMIT_DEFAULT
    );

    const { value: publishLimitRaw, isLoading: isLoadingPublishConfig } = useSystemConfig(
        AGENT_FREE_PLAN_PUBLISH_LIMIT_KEY,
        AGENT_FREE_PLAN_PUBLISH_LIMIT_DEFAULT
    );

    // Bonus de referral de agente (configurable desde admin)
    const { value: referralBonusRaw, isLoading: isLoadingBonusConfig } = useSystemConfig(
        AGENT_REFERRAL_BONUS_SAVES_KEY,
        AGENT_REFERRAL_BONUS_SAVES_DEFAULT
    );

    const isPremium = profile?.plan_type === "premium";

    // Bonus por referral de agente (solo si el referrer es agente)
    const referralBonus = isReferredByAgent
        ? parseInt(referralBonusRaw || AGENT_REFERRAL_BONUS_SAVES_DEFAULT)
        : 0;

    // Límites dinámicos para usuarios (plan + bonus de referral)
    const baseSaves = isPremium
        ? parseInt(premiumSaveLimitRaw || USER_PREMIUM_PLAN_SAVE_LIMIT_DEFAULT)
        : parseInt(saveLimitRaw || USER_FREE_PLAN_SAVE_LIMIT_DEFAULT);
    const maxSaves = baseSaves + referralBonus;

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
        referralBonus,
        isLoading: isLoadingProfile || isLoadingSaveConfig || isLoadingPremiumConfig || isLoadingPublishConfig || isLoadingBonusConfig
    };
}
