import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";

/**
 * Componente "invisible" que rastrea referidos de agentes en la URL (?agente=ID)
 * y los persiste en sessionStorage para el proceso de registro.
 * Si el usuario ya está logueado, vincula el referido a su perfil si no lo tiene.
 * 
 * Regla 2: Arquitectura pro centralizada.
 */
export const ReferralTracker = () => {
    const location = useLocation();
    const { data: profile } = useProfile();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const agentId = params.get("agente");

        if (agentId) {
            console.log("💎 ReferralTracker: Capturado ID de agente:", agentId);

            // 1. Guardar en sesión para futuros registros
            sessionStorage.setItem("hf_referral_agent_id", agentId);

            // 2. Si ya está logueado y no tiene referido, vincularlo ahora
            if (profile && !profile.referred_by_agent_id) {
                const linkReferral = async () => {
                    try {
                        const { data: { user } } = await supabase.auth.getUser();
                        if (!user) return;

                        const { error } = await supabase
                            .from("profiles")
                            .update({ referred_by_agent_id: agentId })
                            .eq("user_id", user.id);

                        if (error) throw error;
                        console.log("💎 ReferralTracker: Perfil vinculado al agente exitosamente.");
                    } catch (err) {
                        console.error("💎 ReferralTracker: Error al vincular perfil:", err);
                    }
                };
                linkReferral();
            }
        }
    }, [location.search, profile]);

    return null; // El componente no renderiza nada visual
};
