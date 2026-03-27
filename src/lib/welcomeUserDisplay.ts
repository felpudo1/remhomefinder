import type { User } from "@supabase/supabase-js";

/**
 * Campos mínimos del perfil para armar el saludo (evita acoplar al hook useProfile).
 */
export interface WelcomeProfileSlice {
  displayName?: string | null;
  phone?: string | null;
}

function firstNonEmptyString(values: unknown[]): string {
  for (const v of values) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

/**
 * Nombre para la pantalla de bienvenida: primero `profiles`, si aún no cargó el perfil usa
 * `user.user_metadata` (lo que guarda el registro en Supabase Auth).
 */
export function resolveWelcomeDisplayName(
  profile: WelcomeProfileSlice | null | undefined,
  user: User | null | undefined
): string {
  const fromProfile = profile?.displayName?.trim();
  if (fromProfile) return fromProfile;
  const m = user?.user_metadata as Record<string, unknown> | undefined;
  if (!m) return "";
  return firstNonEmptyString([m.display_name, m.full_name, m.name]);
}

/**
 * Teléfono para la bienvenida: mismo orden (BD primero, metadata del JWT si hace falta).
 */
export function resolveWelcomePhone(
  profile: WelcomeProfileSlice | null | undefined,
  user: User | null | undefined
): string {
  const fromProfile = profile?.phone?.trim();
  if (fromProfile) return fromProfile;
  const m = user?.user_metadata as Record<string, unknown> | undefined;
  return firstNonEmptyString([m?.phone]);
}
