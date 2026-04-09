import { supabase } from "@/integrations/supabase/client";
import { normalizeWhatsAppPhone } from "@/lib/whatsapp";
import type { UserWithListing } from "@/types/duplicate-cases";

/**
 * Normaliza una URL para comparación (evitar duplicados por trailing slash, etc.)
 * Reutilizable para flujo manual, scrape y marketplace.
 */
export function normalizeUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

/** Resultado cuando la URL ya está en la familia del usuario (Caso 3 - bloquear) */

/** Publicación marketplace principal (para usuario: contactar agencia/agente) */
export type AgentMarketplaceListingForUser = {
  agencyName: string;
  agentName: string;
  /** Dígitos para wa.me; null si no hay teléfono válido en perfil */
  whatsappDigits: string | null;
};

export type InFamilyResult = {
  case: "in_family";
  addedByName: string;
  addedAt: string;
  status: string;
  userListingId: string;
  /** Si también está en marketplace, incluir datos */
  agentMarketplace?: AgentMarketplaceListingForUser;
};

/** Resultado cuando la URL existe en la app pero no en la familia (Caso 2/4) */
export type InAppResult = {
  case: "in_app";
  firstAddedAt: string;
  usersCount: number;
  /** Lista de usuarios que tienen esta property en su listing (para caso C4) */
  users?: UserWithListing[];
  /** Si hay publicación de agente, datos para cartel + WhatsApp */
  agentMarketplace?: AgentMarketplaceListingForUser;
};

export type UrlCheckResult =
  | { case: "none" }
  | InFamilyResult
  | InAppResult;

/**
 * Primera publicación activa del marketplace para la property (más antigua).
 * Consultas acotadas: agent_publications → RPC nombres org → RPC contactos (SECURITY DEFINER: nombre y teléfono del agente sin depender del RLS de profiles).
 */
export async function getPrimaryMarketplaceListingForUser(
  propertyId: string
): Promise<AgentMarketplaceListingForUser | null> {
  const { data: pub, error } = await supabase
    .from("agent_publications")
    .select("id, org_id, published_by")
    .eq("property_id", propertyId)
    .neq("status", "eliminado")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error || !pub?.id || !pub?.org_id || !pub?.published_by) {
    if (error) console.warn("getPrimaryMarketplaceListingForUser pub", error);
    return null;
  }

  const { data: orgRows, error: orgErr } = await supabase.rpc("get_marketplace_org_names", {
    _org_ids: [pub.org_id],
  });
  if (orgErr) console.warn("getPrimaryMarketplaceListingForUser org", orgErr);
  const agencyName =
    (orgRows as { name: string }[] | null)?.[0]?.name?.trim() || "una agencia";

  const { data: contactRows, error: contactErr } = await supabase.rpc(
    "get_marketplace_publication_contacts",
    { _publication_ids: [pub.id] },
  );
  if (contactErr) console.warn("getPrimaryMarketplaceListingForUser contacts", contactErr);
  const contact = (
    contactRows as
      | { agent_name: string | null; agent_phone: string | null; publication_id: string }[]
      | null
  )?.[0];

  const agentName =
    (contact?.agent_name && String(contact.agent_name).trim()) || "el agente";

  const rawPhone = (contact?.agent_phone && String(contact.agent_phone).trim()) || "";
  const digits = rawPhone ? normalizeWhatsAppPhone(rawPhone) : "";
  /** wa.me: mínimo 7 dígitos útiles tras normalizar (evita clicks vacíos) */
  const whatsappDigits = digits.length >= 7 ? digits : null;

  return { agencyName, agentName, whatsappDigits };
}

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

  // ── Buscar property por source_url normalizado ──
  const { data: prop } = await supabase
    .from("properties")
    .select("id")
    .eq("source_url", normalized)
    .limit(1)
    .maybeSingle();

  // ── Fallback: Si no encuentra por source_url exacto, buscar properties de la org que tengan URLs similares ──
  let resolvedProp: { id: string } | null = prop;
  if (!prop) {
    // Obtener TODAS las properties de la org y comparar URLs
    const { data: orgListings } = await supabase
      .from("user_listings")
      .select("id, property_id, added_by, created_at, current_status")
      .eq("org_id", resolvedOrgId)
      .limit(100);

    if (orgListings && orgListings.length > 0) {
      const propIds = orgListings.map(l => l.property_id);
      const { data: orgProperties } = await supabase
        .from("properties")
        .select("id, source_url")
        .in("id", propIds);

      // Comparar URLs normalizadas
      for (const p of (orgProperties || [])) {
        const storedNormalized = normalizeUrl(p.source_url || "");
        const searchNormalized = normalizeUrl(url);
        if (storedNormalized === searchNormalized) {
          resolvedProp = { id: p.id };
          // Also find the matching listing
          const matchingListing = orgListings.find(l => l.property_id === p.id);
          if (matchingListing) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("display_name, email")
              .eq("user_id", matchingListing.added_by)
              .maybeSingle();
            const addedByName =
              (profile?.display_name?.trim() && profile.display_name) ||
              profile?.email ||
              "Un miembro de tu familia";
            const statusLabel = getStatusLabel(matchingListing.current_status);
            return {
              case: "in_family",
              addedByName,
              addedAt: matchingListing.created_at,
              status: statusLabel,
              userListingId: matchingListing.id,
            };
          }
        }
      }
    }
  }

  if (!resolvedProp) return { case: "none" };

  // Ver si está en nuestra org (Caso 3 / Caso 2a)
  const { data: listing, error: listErr } = await supabase
    .from("user_listings")
    .select("id, added_by, created_at, current_status")
    .eq("org_id", resolvedOrgId)
    .eq("property_id", resolvedProp.id)
    .limit(1)
    .maybeSingle();

  // SIEMPRE verificar marketplace (necesario para C2a vs C3)
  const agentMarketplace = await getPrimaryMarketplaceListingForUser(resolvedProp.id);

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
      ...(agentMarketplace ? { agentMarketplace } : {}),
    };
  }

  // Caso 2/4: existe en la app, no en nuestra org.
  const { data: propMeta } = await supabase
    .from("properties")
    .select("created_at, created_by")
    .eq("id", resolvedProp.id)
    .single();

  // Contar cuántos usuarios (distintos) guardaron esta property en toda la app.
  // Se usa RPC para evitar limitaciones de visibilidad por RLS entre organizaciones.
  const { data: rpcUsersCount } = await supabase.rpc("count_property_listing_users" as any, {
    _property_id: resolvedProp.id,
  });

  // Obtener datos de los usuarios que tienen esta property (para caso C4)
  const users = await getUsersWithPropertyListing(resolvedProp.id);

  return {
    case: "in_app",
    firstAddedAt: propMeta?.created_at ?? new Date().toISOString(),
    usersCount: Math.max(typeof rpcUsersCount === "number" ? rpcUsersCount : 0, 1),
    users,
    ...(agentMarketplace ? { agentMarketplace } : {}),
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
    ingresado: "📝 Ingresado",
    contactado: "📞 Contactado",
    visita_coordinada: "🗓️ Visita coordinada",
    visitado: "Visitado",
    descartado: "❌ Descartado",
    a_analizar: "A Analizar",
    firme_candidato: "🔥 Alta prioridad",
    posible_interes: "💡 Interesado",
    meta_conseguida: "🎯 Meta conseguida",
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
  const { data } = await (supabase
    .from("properties")
    .select("id, title, price_amount, price_expenses, total_cost, currency, neighborhood, city, m2_total, rooms, images, ref, details")
    .eq("source_url", normalized)
    .maybeSingle() as any);
  return data;
}

/**
 * True si la org ya tiene una publicación de agente activa (no eliminada) para esa property.
 * Evita duplicar el mismo aviso en el marketplace de la agencia.
 */
export async function hasActiveAgentPublicationForOrg(
  propertyId: string,
  orgId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("agent_publications")
    .select("id")
    .eq("property_id", propertyId)
    .eq("org_id", orgId)
    .neq("status", "eliminado")
    .limit(1)
    .maybeSingle();
  if (error) {
    console.warn("hasActiveAgentPublicationForOrg", error);
    return false;
  }
  return !!data;
}

/** Datos de la publicación de agencia ya existente (misma org + property), para cartel sin duplicar filas */
export type ActiveAgentPublicationSummary = {
  id: string;
  publishedByName: string;
  createdAt: string;
};

/**
 * Obtiene la publicación activa de la agencia para esa property (la más antigua si hubiera varias).
 * Dos round-trips: agent_publications + profiles (nombre quien publicó).
 */
export async function getActiveAgentPublicationForOrg(
  propertyId: string,
  orgId: string
): Promise<ActiveAgentPublicationSummary | null> {
  const { data: pub, error } = await supabase
    .from("agent_publications")
    .select("id, published_by, created_at")
    .eq("property_id", propertyId)
    .eq("org_id", orgId)
    .neq("status", "eliminado")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error || !pub) {
    if (error) console.warn("getActiveAgentPublicationForOrg", error);
    return null;
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, email")
    .eq("user_id", pub.published_by)
    .maybeSingle();
  const publishedByName =
    (profile?.display_name?.trim() && profile.display_name) ||
    profile?.email ||
    "Un agente";
  return {
    id: pub.id,
    publishedByName,
    createdAt: pub.created_at,
  };
}

/**
 * Obtiene los usuarios que tienen una property en su user_listings.
 * Usado para el caso C4: agente necesita contactar a usuarios que ya tienen el aviso.
 */
export async function getUsersWithPropertyListing(propertyId: string): Promise<UserWithListing[]> {
  // Obtener todos los user_listings para esta property
  const { data: listings, error } = await supabase
    .from("user_listings")
    .select("id, added_by, created_at, current_status")
    .eq("property_id", propertyId)
    .limit(50);

  if (error || !listings || listings.length === 0) {
    if (error) console.warn("getUsersWithPropertyListing", error);
    return [];
  }

  // Obtener perfiles de todos los usuarios
  const userIds = listings.map(l => l.added_by);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, display_name, email, phone")
    .in("user_id", userIds);

  const profileMap = new Map();
  for (const p of (profiles || [])) {
    profileMap.set(p.user_id, p);
  }

  return listings.map(listing => {
    const profile = profileMap.get(listing.added_by);
    const name =
      (profile?.display_name?.trim() && profile.display_name) ||
      profile?.email ||
      "Usuario";
    return {
      userListingId: listing.id,
      name,
      phone: profile?.phone || null,
      status: getStatusLabel(listing.current_status),
      addedAt: listing.created_at,
    };
  });
}
