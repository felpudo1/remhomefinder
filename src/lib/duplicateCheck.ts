import { supabase } from "@/integrations/supabase/client";

/**
 * Normaliza una URL para comparación (evitar duplicados por trailing slash, etc.)
 * Reutilizable para flujo manual, scrape y marketplace.
 */
export function normalizeUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

/** Resultado cuando la URL ya está en la familia del usuario (Caso 1 - bloquear) */
export type InFamilyResult = {
  case: "in_family";
  addedByName: string;
  addedAt: string;
  status: string;
  userListingId: string;
};

/** Resultado cuando la URL existe en la app pero no en la familia (Caso 2) */
export type InAppResult = {
  case: "in_app";
  firstAddedAt: string;
  usersCount: number;
};

export type UrlCheckResult =
  | { case: "none" }
  | InFamilyResult
  | InAppResult;

/**
 * Verifica si una URL ya existe y en qué contexto.
 * Caso 1: en tu familia → bloquear. Caso 2: en la app (otra familia) → permitir con mensaje.
 */
export async function checkUrlStatus(
  url: string,
  orgId: string | null
): Promise<UrlCheckResult> {
  const normalized = normalizeUrl(url);
  if (!normalized) return { case: "none" };

  let resolvedOrgId = orgId;
  if (!resolvedOrgId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { case: "none" };
    const { data: membership } = await supabase
      .from("organization_members")
      .select("org_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();
    resolvedOrgId = membership?.org_id ?? null;
  }
  if (!resolvedOrgId) return { case: "none" };

  const { data: prop, error: propErr } = await supabase
    .from("properties")
    .select("id")
    .eq("source_url", normalized)
    .limit(1)
    .maybeSingle();

  if (propErr || !prop) return { case: "none" };

  // Ver si está en nuestra org (Caso 1)
  const { data: listing, error: listErr } = await supabase
    .from("user_listings")
    .select("id, added_by, created_at, current_status")
    .eq("org_id", resolvedOrgId)
    .eq("property_id", prop.id)
    .limit(1)
    .maybeSingle();

  if (!listErr && listing) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, email")
      .eq("user_id", listing.added_by)
      .maybeSingle();
    const addedByName =
      (profile?.display_name?.trim() && profile.display_name) ||
      profile?.email ||
      "Un miembro de tu familia";
    const statusLabel = getStatusLabel(listing.current_status);
    return {
      case: "in_family",
      addedByName,
      addedAt: listing.created_at,
      status: statusLabel,
      userListingId: listing.id,
    };
  }

  // Caso 2: existe en la app, no en nuestra org.
  const { data: propMeta } = await supabase
    .from("properties")
    .select("created_at, created_by")
    .eq("id", prop.id)
    .single();

  // Contar cuántos user_listings tienen esta property
  const { count: listingsCount } = await supabase
    .from("user_listings")
    .select("id", { count: "exact", head: true })
    .eq("property_id", prop.id);

  return {
    case: "in_app",
    firstAddedAt: propMeta?.created_at ?? new Date().toISOString(),
    usersCount: listingsCount ?? 1,
  };
}

/** Compatibilidad: mantiene la API anterior */
export async function checkDuplicateUrlInOrg(
  url: string,
  orgId: string | null
): Promise<{ isDuplicate: boolean; addedByName?: string }> {
  const r = await checkUrlStatus(url, orgId);
  if (r.case === "in_family") return { isDuplicate: true, addedByName: r.addedByName };
  return { isDuplicate: false };
}

function getStatusLabel(status: string | null): string {
  const labels: Record<string, string> = {
    ingresado: "Ingresado",
    contactado: "Contactado",
    visita_coordinada: "Visita Coordinada",
    visitado: "Visitado",
    descartado: "Descartado",
    a_analizar: "A Analizar",
    firme_candidato: "Firme Candidato",
    posible_interes: "Posible Interés",
    eliminado: "Eliminado",
    eliminado_agencia: "Aviso Finalizado",
  };
  return status ? (labels[status] || status) : "Ingresado";
}

/** Formatea "hace X días" para mostrar antigüedad */
export function formatDaysAgo(isoDate: string): string {
  const d = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (days === 0) return "hoy";
  if (days === 1) return "hace 1 día";
  if (days < 7) return `hace ${days} días`;
  if (days < 30) return `hace ${Math.floor(days / 7)} semana${Math.floor(days / 7) > 1 ? "s" : ""}`;
  if (days < 365) return `hace ${Math.floor(days / 30)} mes${Math.floor(days / 30) > 1 ? "es" : ""}`;
  return `hace ${Math.floor(days / 365)} año${Math.floor(days / 365) > 1 ? "s" : ""}`;
}

/**
 * Obtiene la property existente por URL (si otra familia ya la ingresó).
 * Reutilizable para pre-llenar el formulario sin scrapear.
 */
export async function getExistingPropertyByUrl(url: string) {
  const normalized = normalizeUrl(url);
  if (!normalized) return null;
  const { data } = await supabase
    .from("properties")
    .select("id, title, price_amount, price_expenses, total_cost, currency, neighborhood, city, m2_total, rooms, images, ref, details")
    .eq("source_url", normalized)
    .maybeSingle();
  return data;
}
