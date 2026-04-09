/**
 * ============================================================================
 * 🔀 DUPLICATE ROUTER
 * ============================================================================
 * 
 * Responsabilidad ÚNICA:
 * - Determinar qué caso de duplicado es según los datos crudos de la BD
 * - Retornar el caso identificado (C1, C2a, C2b, C3, C4, C5)
 * 
 * NO debería:
 * - Hacer queries a la BD (eso es trabajo de duplicateCheck.ts)
 * - Saber nada sobre la UI
 * 
 * Entrada: Datos crudos desde duplicateCheck.ts
 * Salida: Caso identificado con datos enriquecidos
 * ============================================================================
 */

import type {
  DuplicateCase1,
  DuplicateCase2a,
  DuplicateCase2b,
  DuplicateCase3,
  DuplicateCase4,
} from "@/types/duplicate-cases";
import type {
  AgentMarketplaceListingForUser,
} from "@/lib/duplicateCheck";

/**
 * Datos crudos que vienen de la BD (desde duplicateCheck.ts)
 */
interface DuplicateRawData {
  /** Si la property existe en el listado de la org del usuario */
  inFamily: {
    addedByName: string;
    addedAt: string;
    status: string;
    userListingId: string;
  } | null;
  /** Si la property tiene publicación de agente en marketplace */
  inMarketplace: AgentMarketplaceListingForUser | null;
  /** Si la property existe en la app (fuera de la org del usuario) */
  inApp: {
    firstAddedAt: string;
    usersCount: number;
    users?: import("@/types/duplicate-cases").UserWithListing[];
  } | null;
  /** Si la org ya tiene una publicación de agente para esta property (para agentes) */
  agentOwnPublication: {
    id: string;
    publishedByName: string;
    createdAt: string;
  } | null;
}

/**
 * Resultado del ruteo de casos
 */
export type DuplicateRoutedResult =
  | DuplicateCase1
  | DuplicateCase2a
  | DuplicateCase2b
  | DuplicateCase3
  | DuplicateCase4
  | { case: "none" };

/**
 * ============================================================================
 * ROUTER PRINCIPAL
 * ============================================================================
 * 
 * Determina qué caso de duplicado es según los datos crudos.
 * 
 * Orden de prioridad:
 * 1. C1: Agente repite su propia publicación
 * 2. C2a: Usuario tiene en su listado + está en marketplace
 * 3. C2b: Usuario NO tiene en su listado + está en marketplace
 * 4. C3: Usuario tiene en su listado (sin marketplace)
 * 5. C4: Property en app pero no en marketplace ni en listado propio
 * 
 * @param rawData - Datos crudos desde duplicateCheck.ts
 * @param isAgent - Si el usuario actual es un agente
 * @returns Caso identificado o "none" si no hay duplicado
 */
export function determineDuplicateCase(
  rawData: DuplicateRawData,
  isAgent: boolean
): DuplicateRoutedResult {
  const { inFamily, inMarketplace, inApp, agentOwnPublication } = rawData;

  // ── C1: Agente repite su propia publicación ──
  if (isAgent && agentOwnPublication) {
    return {
      case: "C1",
      publishedByName: agentOwnPublication.publishedByName,
      createdAt: agentOwnPublication.createdAt,
      agentPublicationId: agentOwnPublication.id,
    } as DuplicateCase1;
  }

  // ── C2a: Usuario tiene en su listado + está en marketplace ──
  if (inFamily && inMarketplace && !isAgent) {
    return {
      case: "C2a",
      agencyName: inMarketplace.agencyName,
      agentName: inMarketplace.agentName,
      whatsappDigits: inMarketplace.whatsappDigits,
      listingUrl: "", // Se completa desde el componente
      userListingId: inFamily.userListingId,
    } as DuplicateCase2a;
  }

  // ── C2b: Usuario NO tiene en su listado + está en marketplace ──
  if (!inFamily && inMarketplace && inApp && !isAgent) {
    return {
      case: "C2b",
      agencyName: inMarketplace.agencyName,
      agentName: inMarketplace.agentName,
      whatsappDigits: inMarketplace.whatsappDigits,
      listingUrl: "", // Se completa desde el componente
    } as DuplicateCase2b;
  }

  // ── C3: Usuario tiene en su listado (sin marketplace) ──
  if (inFamily && !inMarketplace && !isAgent) {
    return {
      case: "C3",
      addedByName: inFamily.addedByName,
      addedAt: inFamily.addedAt,
      status: inFamily.status,
      userListingId: inFamily.userListingId,
    } as DuplicateCase3;
  }

  // ── C4: Agente intenta ingresar aviso que ya está en listado de usuarios ──
  if (isAgent && !inFamily && !inMarketplace && inApp) {
    return {
      case: "C4",
      usersCount: inApp.usersCount,
      users: inApp.users || [],
      onAddExisting: () => {}, // Se completa desde el componente
      isAdding: false,
    } as DuplicateCase4;
  }

  // ── Sin duplicado ──
  return { case: "none" };
}

/**
 * ============================================================================
 * HELPER: Obtener datos crudos desde la BD
 * ============================================================================
 * 
 * Este helper encapsula las llamadas a duplicateCheck.ts
 * para facilitar el uso desde los hooks.
 */
import {
  checkUrlStatus,
  getActiveAgentPublicationForOrg,
  hasActiveAgentPublicationForOrg,
} from "@/lib/duplicateCheck";

export async function fetchDuplicateData(
  url: string,
  orgId: string | null,
  isAgent: boolean
): Promise<{
  duplicateCase: DuplicateRoutedResult;
}> {
  // Obtener datos crudos
  const urlStatus = await checkUrlStatus(url, orgId);

  // Preparar datos para el router
  const rawData: DuplicateRawData = {
    inFamily: urlStatus.case === "in_family"
      ? {
          addedByName: urlStatus.addedByName,
          addedAt: urlStatus.addedAt,
          status: urlStatus.status,
          userListingId: urlStatus.userListingId,
        }
      : null,
    inMarketplace: urlStatus.case === "in_family"
      ? urlStatus.agentMarketplace || null
      : urlStatus.case === "in_app"
      ? urlStatus.agentMarketplace || null
      : null,
    inApp: urlStatus.case === "in_app"
      ? {
          firstAddedAt: urlStatus.firstAddedAt,
          usersCount: urlStatus.usersCount,
        }
      : null,
    agentOwnPublication: null, // Se obtiene solo para agentes
  };

  // Si es agente, verificar si ya tiene publicación propia
  if (isAgent && urlStatus.case !== "none") {
    const { normalizeUrl } = await import("@/lib/duplicateCheck");
    const normalized = normalizeUrl(url);
    const { supabase } = await import("@/integrations/supabase/client");
    const { data: prop } = await supabase
      .from("properties")
      .select("id")
      .eq("source_url", normalized)
      .limit(1)
      .maybeSingle();

    if (prop?.id && orgId) {
      try {
        const hasOwn = await hasActiveAgentPublicationForOrg(prop.id, orgId);
        if (hasOwn) {
          const summary = await getActiveAgentPublicationForOrg(prop.id, orgId);
          rawData.agentOwnPublication = summary;
        }
      } catch (err) {
        console.warn("Error verificando publicación de agente:", err);
        // Si falla, continuar sin agentOwnPublication
      }
    }
  }

  // Determinar caso
  const duplicateCase = determineDuplicateCase(rawData, isAgent);

  return { duplicateCase };
}
