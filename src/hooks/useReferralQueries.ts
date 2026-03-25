import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Cuenta cuántos perfiles tienen referred_by_id === referrerUserId (personas que referenciaste).
 */
export function useReferralCountForUser(referrerUserId: string | null | undefined) {
  return useQuery({
    queryKey: ["referral-count", referrerUserId],
    queryFn: async () => {
      if (!referrerUserId) return 0;
      // RPC SECURITY DEFINER: el SELECT directo a profiles devolvía 0 por RLS (referidos fuera de la org del agente).
      const { data, error } = await supabase.rpc("count_profiles_referred_by", {
        _referrer_user_id: referrerUserId,
      });
      if (error) throw error;
      return typeof data === "number" ? data : Number(data) || 0;
    },
    enabled: !!referrerUserId,
  });
}

/**
 * Nombre del usuario que refirió al perfil actual (vía RPC SECURITY DEFINER: evita bloqueos RLS si no comparten org).
 *
 * @param referredById - Si es null, no se llama a la RPC.
 * @param currentUserId - **Obligatorio para la queryKey:** sin esto, React Query cachea un solo resultado para todos los usuarios (bug: todos veían el mismo "Referido por").
 */
export function useReferrerDisplayName(
  referredById: string | null | undefined,
  currentUserId: string | null | undefined
) {
  return useQuery({
    queryKey: ["my-referrer-display-name", currentUserId, referredById],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_my_referrer_display_name");
      if (error) throw error;
      const s = typeof data === "string" ? data.trim() : "";
      return s || null;
    },
    enabled: !!referredById && !!currentUserId,
  });
}
