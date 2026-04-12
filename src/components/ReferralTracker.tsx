import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/contexts/AuthProvider";

const REFERRAL_KEY = "hf_referral_id";

/**
 * Componente "invisible" que rastrea referidos de agentes en la URL (?agente=ID)
 * y los persiste en localStorage para el proceso de registro.
 *
 * Post-login: si el usuario ya está autenticado y su perfil no tiene referred_by_id,
 * vincula el referido desde localStorage. Esto cubre el caso donde AuthCallback
 * no monta (ej. Supabase ignora redirectTo y manda directo al dashboard).
 *
 * Regla 2: Arquitectura pro centralizada.
 */
export const ReferralTracker = () => {
  const queryClient = useQueryClient();
  const location = useLocation();
  const { user } = useCurrentUser();
  const linkingRef = useRef(false);

  // 1. Capturar ?ref= / ?agente= desde la URL y guardar en localStorage
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const refId = params.get("ref") || params.get("agente");

    if (refId) {
      console.log("💎 ReferralTracker: Capturado ID de referido:", refId);
      localStorage.setItem(REFERRAL_KEY, refId);
    }
  }, [location.search]);

  // 2. Post-login: vincular referido si el perfil no lo tiene
  useEffect(() => {
    if (!user) return;

    const storedRef = localStorage.getItem(REFERRAL_KEY);
    if (!storedRef) return;

    // Evitar auto-referencia
    if (storedRef === user.id) {
      console.log("💎 ReferralTracker: Referral ID es el mismo usuario, limpiando.");
      localStorage.removeItem(REFERRAL_KEY);
      return;
    }

    // Evitar ejecuciones concurrentes
    if (linkingRef.current) return;
    linkingRef.current = true;

    const linkReferral = async () => {
      try {
        // Retry: el trigger handle_new_user_profile puede no haber creado el perfil aún
        for (let attempt = 1; attempt <= 5; attempt++) {
          const { data: profile, error: selectErr } = await (supabase
            .from("profiles") as any)
            .select("referred_by_id")
            .eq("user_id", user.id)
            .maybeSingle();

          if (selectErr) {
            console.error("💎 ReferralTracker: Error leyendo perfil:", selectErr);
            break;
          }

          if (!profile) {
            console.log(`💎 ReferralTracker: Perfil aún no existe, reintento ${attempt}/5...`);
            await new Promise(r => setTimeout(r, 800));
            continue;
          }

          // Ya tiene referido → no pisar, limpiar storage
          if (profile.referred_by_id) {
            console.log("💎 ReferralTracker: Perfil ya tiene referido, limpiando storage.");
            localStorage.removeItem(REFERRAL_KEY);
            break;
          }

          // Vincular
          console.log("💎 ReferralTracker: Vinculando referido:", storedRef);
          const { error: updErr } = await (supabase
            .from("profiles") as any)
            .update({ referred_by_id: storedRef })
            .eq("user_id", user.id);

          if (updErr) {
            console.error("💎 ReferralTracker: ❌ Error al vincular referido:", updErr);
          } else {
            console.log("💎 ReferralTracker: ✅ Referido vinculado exitosamente.");
            await queryClient.invalidateQueries({ queryKey: ["profile", "current", user.id] });
            localStorage.removeItem(REFERRAL_KEY);
          }
          break;
        }
      } catch (err) {
        console.error("💎 ReferralTracker: Error inesperado:", err);
      } finally {
        linkingRef.current = false;
      }
    };

    linkReferral();
  }, [user, queryClient]);

  return null;
};
