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
        const refId = params.get("ref") || params.get("agente");

        if (refId) {
            console.log("💎 ReferralTracker: Capturado ID de referido:", refId);

            // 1. Guardar en sesión para futuros registros
            sessionStorage.setItem("hf_referral_id", refId);

            // 2. Si ya está logueado y no tiene referido, vincularlo ahora (evitar auto-referencia)
            if (profile && !profile.referredById && refId !== profile.userId) {
                const linkReferral = async () => {
                    try {
                        const { data: { user } } = await supabase.auth.getUser();
                        if (!user) return;

                        const { error } = await (supabase
                            .from("profiles") as any)
                            .update({ referred_by_id: refId })
                            .eq("user_id", user.id);

                        if (error) throw error;
                        console.log("💎 ReferralTracker: Perfil vinculado exitosamente.");
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
