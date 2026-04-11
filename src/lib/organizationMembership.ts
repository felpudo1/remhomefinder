import { supabase } from "@/integrations/supabase/client";

/**
 * Busca la primera organización activa del usuario con reintentos exponenciales.
 * Útil en flujos post-registro donde los triggers pueden tardar unos segundos.
 */
export async function getUserOrgIdWithRetry(userId: string, attempts = 6): Promise<string | null> {
  for (let attempt = 0; attempt < attempts; attempt++) {
    const { data: membership } = await supabase
      .from("organization_members")
      .select("org_id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    if (membership?.org_id) {
      return membership.org_id;
    }

    await new Promise((resolve) => setTimeout(resolve, 500 * Math.pow(2, attempt)));
  }

  return null;
}