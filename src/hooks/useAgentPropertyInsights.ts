import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useMemo } from "react";
import { parseCoordinatedVisitDateFromMetadata } from "@/lib/date-utils";
import {
  computeCredibilityScore,
  type CredibilityScore,
  type UserPropertyInteraction,
} from "@/lib/credibilityScore";

/** Rating keys extracted from event_metadata per status */
export interface ContactadoRatings {
  contacted_interest: number;
  contacted_urgency: number;
  contacted_name?: string;
}

export interface VisitaRatings {
  coordinated_agent_response_speed: number;
  coordinated_attention_quality: number;
  coordinated_app_help_score?: number;
  coordinated_date?: string;
}

export interface ClosingRatings {
  close_price_score: number;
  close_condition_score: number;
  close_security_score: number;
  close_guarantee_score: number;
  close_moving_score: number;
}

export interface MetaRatings {
  meta_agent_punctuality: number;
  meta_agent_attention: number;
  meta_app_performance: number;
  meta_app_support: number;
  meta_app_price: number;
}

export interface DescartadoRatings {
  reason?: string;
  discarded_overall_condition: number;
  discarded_surroundings: number;
  discarded_house_security: number;
  discarded_expected_size: number;
  discarded_photos_reality: number;
  discarded_price_value?: number;
}

export interface AgentUserInsight {
  userId: string;
  displayName: string;
  emailMasked: string;
  phone: string;
  currentStatus: string;
  updatedAt: string;
  updatedAtRelative: string;
  coordinatedDate?: Date;
  userListingId: string;
  ratingsByStatus: Record<string, any>;
  personalRating?: number;
  familyRating?: number;
  matchScore?: number;
  /** Desglose del matchScore para mostrar en popover explicativo */
  matchScoreBreakdown?: MatchScoreBreakdown;
  orgId: string;
  /** Coeficiente de credibilidad calculado cross-property */
  credibilityScore?: CredibilityScore;
}

/**
 * Desglose de cada componente del Match Score.
 * Compara características de la propiedad vs perfil de búsqueda del usuario.
 */
export interface MatchScoreBreakdown {
  // --- Operación (alquiler / compra) ---
  operationScore: number;           // Puntos obtenidos
  operationMax: number;             // Máximo posible
  operationMatch: boolean;          // ¿Coincide?
  propertyOperationLabel: string;   // Ej: "Alquiler"
  userOperationLabel: string;       // Ej: "Busca alquiler"

  // --- Presupuesto ---
  budgetScore: number;
  budgetMax: number;
  budgetMatch: 'full' | 'partial' | 'none' | 'unknown';
  propertyPriceLabel: string;       // Ej: "USD 1.200"
  userBudgetLabel: string;          // Ej: "USD 800 – 1.500"

  // --- Barrio ---
  neighborhoodScore: number;
  neighborhoodMax: number;
  neighborhoodMatch: boolean;
  propertyNeighborhoodLabel: string;
  userNeighborhoodsLabel: string;   // Ej: "Pocitos, Punta Carretas"

  // --- Ambientes ---
  roomsScore: number;
  roomsMax: number;
  roomsMatch: boolean;
  propertyRoomsLabel: string;       // Ej: "3 amb."
  userRoomsLabel: string;           // Ej: "Mín. 2 amb."
}

export interface AgentPropertyInsight {
  publicationId: string;
  propertyId: string;
  title: string;
  neighborhood: string;
  ref?: string;
  usersSaved: number;
  publishedAt: string;
  publishedAtRelative: string;
  avgContactedInterest: number;
  avgContactedUrgency: number;
  /** Sentiment Analytics */
  avgEstructural: number;
  avgEntorno: number;
  avgSeguridad: number;
  avgEspacios: number;
  avgPrecio: number;
  totalVotes: number;
  statusBreakdown: string;
  users: AgentUserInsight[];
  debug_keys?: string[];
  /** Campos internos para match_score — no usados en UI directamente */
  _listingType?: string;
  _price?: number;
  _currency?: string;
  _rooms?: number;
}

function maskEmail(email: string | null): string {
  if (!email) return "";
  const [local, domain] = email.split("@");
  if (!domain) return email;
  return `${local.slice(0, 3)}***@${domain}`;
}

function safeNum(val: unknown): number {
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

const PAGE_SIZE = 30;

/** Forma cruda de cada fila retornada por la RPC */
interface RpcRow {
  publication_id: string;
  property_id: string;
  property_title: string;
  property_ref: string | null;
  property_neighborhood: string;
  property_price: number;
  property_currency: string;
  property_rooms: number;
  listing_type: string;
  pub_status: string;
  pub_created_at: string;
  user_listing_id: string | null;
  user_id: string | null;
  user_display_name: string;
  user_email: string | null;
  user_phone: string;
  current_status: string | null;
  user_updated_at: string | null;
  user_org_id: string | null;
  status_counts: Record<string, number>;
  ratings_by_status: Record<string, any>;
}

function parseJsonIfNeeded(val: any): Record<string, any> {
  if (typeof val === "string") {
    try {
      return JSON.parse(val);
    } catch {
      return {};
    }
  }
  return val || {};
}

/**
 * Agrupa filas planas de la RPC en la estructura jerárquica AgentPropertyInsight[].
 */
function groupRpcRows(rows: RpcRow[]): AgentPropertyInsight[] {
  const pubMap = new Map<string, AgentPropertyInsight>();
  const pubOrder: string[] = [];

  for (const row of rows) {
    let pub = pubMap.get(row.publication_id);
    if (!pub) {
      let publishedAtRelative = "";
      try {
        publishedAtRelative = formatDistanceToNow(parseISO(row.pub_created_at), { addSuffix: true, locale: es });
      } catch {
        publishedAtRelative = row.pub_created_at || "";
      }

      pub = {
        publicationId: row.publication_id,
        propertyId: row.property_id,
        title: row.property_title || "",
        neighborhood: row.property_neighborhood || "",
        ref: row.property_ref || undefined,
        usersSaved: 0,
        publishedAt: row.pub_created_at || "",
        publishedAtRelative,
        avgContactedInterest: 0,
        avgContactedUrgency: 0,
        avgEstructural: 0,
        avgEntorno: 0,
        avgSeguridad: 0,
        avgEspacios: 0,
        avgPrecio: 0,
        totalVotes: 0,
        statusBreakdown: "",
        users: [],
        _listingType: row.listing_type,
        _price: row.property_price,
        _currency: row.property_currency,
        _rooms: row.property_rooms,
      };
      pubMap.set(row.publication_id, pub);
      pubOrder.push(row.publication_id);
    }

    // Si hay user_listing_id, agregar el usuario
    if (row.user_listing_id && row.user_id) {
      // Asegurar que parseamos los ratings si vienen como string
      const ratingsByStatus = parseJsonIfNeeded(row.ratings_by_status);

      // Fecha de visita desde metadata
      const visitaMeta = ratingsByStatus["visita_coordinada"];
      const coordinatedDate = parseCoordinatedVisitDateFromMetadata(visitaMeta);

      let updatedAtRelative = "";
      try {
        if (row.user_updated_at) {
          updatedAtRelative = formatDistanceToNow(parseISO(row.user_updated_at), { addSuffix: true, locale: es });
        }
      } catch {
        updatedAtRelative = row.user_updated_at || "";
      }

      pub.users.push({
        userId: row.user_id,
        displayName: row.user_display_name || "Usuario",
        emailMasked: maskEmail(row.user_email),
        phone: row.user_phone || "",
        currentStatus: row.current_status || "ingresado",
        updatedAt: row.user_updated_at || "",
        updatedAtRelative,
        coordinatedDate,
        userListingId: row.user_listing_id,
        ratingsByStatus,
        orgId: row.user_org_id || "",
      });
    }
  }

  // Calcular campos derivados
  for (const pub of pubMap.values()) {
    pub.usersSaved = pub.users.length;

    // Promedios y Sentiment
    let totalInterest = 0, totalUrgency = 0, interestCount = 0;
    let t_est = 0, c_est = 0;
    let t_ent = 0, c_ent = 0;
    let t_seg = 0, c_seg = 0;
    let t_esp = 0, c_esp = 0;
    let t_pre = 0, c_pre = 0;
    const distinctVoters = new Set<string>();

    const statusCounts: Record<string, number> = {};

    pub.users.forEach((user) => {
      statusCounts[user.currentStatus] = (statusCounts[user.currentStatus] || 0) + 1;
      const allRatings = user.ratingsByStatus || {};

      Object.keys(allRatings).forEach(statusName => {
        const meta = allRatings[statusName];
        if (!meta || typeof meta !== 'object') return;

        // 1. Estructura (🏗️)
        const est = safeNum(meta.altaPrioridad || meta['posib inter estruc'] || meta.descateestriculta);
        if (est > 0) { t_est += est; c_est++; }

        // 2. Entorno (🌳)
        const ent = safeNum(meta.altaPrioridadEntorno || meta['pos inte enton'] || meta.descatado);
        if (ent > 0) { t_ent += ent; c_ent++; }

        // 3. Seguridad (🛡️)
        const seg = safeNum(meta.AltaPrioSegurudad || meta['pos int seg'] || meta.desc_seg);
        if (seg > 0) { t_seg += seg; c_seg++; }

        // 4. Espacios (📐)
        const esp = safeNum(meta.PrioridadTamano || meta['pod inter'] || meta['desc espeaios']);
        if (esp > 0) { t_esp += esp; c_esp++; }

        // 5. Precio (💰)
        const pre = safeNum(meta['Alta´PriorPrecio'] || meta['pos int precio'] || meta['desc precio']);
        if (pre > 0) { t_pre += pre; c_pre++; }

        // Identificar si este usuario emitió algún voto válido
        const values = Object.values(meta);
        if (values.some(v => typeof v === 'number' && v >= 1 && v <= 5)) {
          distinctVoters.add(user.userId);
        }
      });

      // Contactado original (para compatibilidad)
      const contactadoMeta = allRatings["contactado"];
      if (contactadoMeta) {
        totalInterest += safeNum(contactadoMeta.contacted_interest || contactadoMeta.contact_price);
        totalUrgency += safeNum(contactadoMeta.contacted_urgency || contactadoMeta.contact_urgency);
        if (safeNum(contactadoMeta.contacted_interest || contactadoMeta.contact_price) > 0) interestCount++;
      }
    });

    pub.avgContactedInterest = interestCount > 0 ? totalInterest / interestCount : 0;
    pub.avgContactedUrgency = interestCount > 0 ? totalUrgency / interestCount : 0;
    
    // Asignar Sentiment analytics
    pub.avgEstructural = c_est > 0 ? t_est / c_est : 0;
    pub.avgEntorno = c_ent > 0 ? t_ent / c_ent : 0;
    pub.avgEspacios = c_esp > 0 ? t_esp / c_esp : 0;
    pub.avgPrecio = c_pre > 0 ? t_pre / c_pre : 0;
    pub.totalVotes = distinctVoters.size;

    const breakdownParts = Object.entries(statusCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([status, count]) => `${count} ${status.replace("_", " ")}`);
    pub.statusBreakdown = breakdownParts.join(" · ");
  }

  return pubOrder.map((id) => pubMap.get(id)!);
}

/**
 * Fetches agent property insights using a single RPC with pagination.
 * match_score, personalRating, familyRating are computed client-side.
 */
export function useAgentPropertyInsights(agencyOrgId: string | undefined) {
  const infiniteQuery = useInfiniteQuery({
    queryKey: ["agent-property-insights", agencyOrgId],
    enabled: !!agencyOrgId,
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }): Promise<AgentPropertyInsight[]> => {
      if (!agencyOrgId) return [];

      const { data, error } = await supabase.rpc("get_agent_property_insights", {
        p_org_id: agencyOrgId,
        p_limit: PAGE_SIZE,
        p_offset: pageParam,
      } as any);

      if (error) throw error;
      return groupRpcRows((data as unknown as RpcRow[]) || []);
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return allPages.reduce((acc, page) => acc + page.length, 0);
    },
    staleTime: 5 * 60 * 1000,
  });

  const allInsights = useMemo(() => {
    if (!infiniteQuery.data?.pages) return [];
    return infiniteQuery.data.pages.flat();
  }, [infiniteQuery.data?.pages]);

  const userIds = useMemo(() => {
    const ids = new Set<string>();
    allInsights.forEach((pub) => pub.users.forEach((u) => ids.add(u.userId)));
    return [...ids];
  }, [allInsights]);

  const propertyIds = useMemo(() => {
    return [...new Set(allInsights.map((pub) => pub.propertyId))];
  }, [allInsights]);

  const { data: reviews } = useQuery({
    queryKey: ["agent-insights-reviews", propertyIds],
    enabled: propertyIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("property_reviews")
        .select("property_id, user_id, org_id, rating")
        .in("property_id", propertyIds);
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: searchProfiles } = useQuery({
    queryKey: ["agent-insights-search-profiles", userIds],
    enabled: userIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("user_search_profiles")
        .select("*")
        .in("user_id", userIds);
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: matchWeightsConfig } = useQuery({
    queryKey: ["agent-insights-match-weights"],
    queryFn: async () => {
      const { data } = await supabase
        .from("system_config")
        .select("value")
        .eq("key", "match_score_weights")
        .maybeSingle();
      if (data?.value) {
        try { return JSON.parse(data.value); } catch { }
      }
      return { operation_weight: 30, budget_weight: 40, neighborhood_weight: 20, rooms_weight: 10 };
    },
    staleTime: Infinity,
  });

  const { data: neighborhoods } = useQuery({
    queryKey: ["geography", "neighborhoods"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("neighborhoods")
        .select("id, name, city_id")
        .order("name");
      if (error) throw error;
      return data || [];
    },
    staleTime: Infinity,
  });

  const enrichedInsights = useMemo(() => {
    if (!allInsights.length) return allInsights;

    const neighborhoodMap: Record<string, string> = {};
    (neighborhoods || []).forEach((n) => { neighborhoodMap[n.id] = n.name; });

    const searchProfileMap: Record<string, any> = {};
    (searchProfiles || []).forEach((sp) => { searchProfileMap[sp.user_id] = sp; });

    const userReviewMap: Record<string, number> = {};
    const familyReviewAcc: Record<string, { sum: number; count: number }> = {};
    (reviews || []).forEach((r: any) => {
      userReviewMap[`${r.property_id}_${r.user_id}`] = r.rating;
      const orgKey = `${r.property_id}_${r.org_id}`;
      if (!familyReviewAcc[orgKey]) familyReviewAcc[orgKey] = { sum: 0, count: 0 };
      familyReviewAcc[orgKey].sum += r.rating;
      familyReviewAcc[orgKey].count += 1;
    });

    const matchWeights = matchWeightsConfig || { operation_weight: 30, budget_weight: 40, neighborhood_weight: 20, rooms_weight: 10 };

    // ── CREDIBILIDAD: Construir mapa cross-property por usuario ──────────────
    // Para cada usuario, recolectar sus interacciones en TODAS las propiedades.
    // Esto permite detectar inconsistencias en campos estables (urgencia, agenda, etc.)
    const userInteractionsMap = new Map<string, UserPropertyInteraction[]>();

    allInsights.forEach((pub) => {
      pub.users.forEach((user) => {
        const interaction: UserPropertyInteraction = {
          ratingsByStatus: user.ratingsByStatus,
          currentStatus: user.currentStatus,
          hasPhone: !!user.phone,
          hasSearchProfile: !!searchProfileMap[user.userId],
        };
        if (!userInteractionsMap.has(user.userId)) {
          userInteractionsMap.set(user.userId, []);
        }
        userInteractionsMap.get(user.userId)!.push(interaction);
      });
    });

    // Pre-computar el score de credibilidad por usuario (una sola vez, eficiente)
    const userCredibilityMap = new Map<string, CredibilityScore | null>();
    userInteractionsMap.forEach((interactions, userId) => {
      userCredibilityMap.set(userId, computeCredibilityScore(interactions));
    });
    // ─────────────────────────────────────────────────────────────────────────

    return allInsights.map((pub) => ({
      ...pub,
      users: pub.users.map((user) => {
        const personalRating = userReviewMap[`${pub.propertyId}_${user.userId}`];
        const famRev = familyReviewAcc[`${pub.propertyId}_${user.orgId}`];
        const familyRating = famRev && famRev.count > 0 ? famRev.sum / famRev.count : undefined;


        // Adjuntar el score de credibilidad pre-calculado
        const credibilityScore = userCredibilityMap.get(user.userId) ?? undefined;



        // ── MATCH SCORE + BREAKDOWN ───────────────────────────────────────────
        // Compara características de la propiedad vs perfil de búsqueda del usuario.
        let matchScore: number | undefined = undefined;
        let matchScoreBreakdown: MatchScoreBreakdown | undefined = undefined;
        const userSearch = searchProfileMap[user.userId];

        if (userSearch) {
          const { operation_weight = 30, budget_weight = 40, neighborhood_weight = 20, rooms_weight = 10 } = matchWeights;

          // 1. Operación
          const op = String(userSearch.operation || "").trim().toLowerCase();
          const wantRent = op === "rent" || op === "alquilar";
          const wantBuy  = op === "buy"  || op === "comprar";
          const wantBoth = op === "all"  || op === "ambas" || !op;
          const isRent = pub._listingType === "rent";
          const isSale = pub._listingType === "sale";
          const operationMatch = wantBoth || (wantRent && isRent) || (wantBuy && isSale);
          const operationScore = operationMatch ? operation_weight : 0;

          // 2. Presupuesto
          const min_b = userSearch.min_budget || 0;
          const max_b = userSearch.max_budget || 999999999;
          const pubPrice = Number(pub._price || 0);
          const userCurrency = userSearch.currency === "$" ? "UYU" : "USD";
          const pubCurrency  = pub._currency || "USD";

          let budgetMatch: MatchScoreBreakdown['budgetMatch'] = 'unknown';
          let budgetScore = 0;
          if (pubPrice > 0 && userCurrency === pubCurrency) {
            if      (pubPrice >= min_b && pubPrice <= max_b)                         { budgetMatch = 'full';    budgetScore = budget_weight; }
            else if (pubPrice >= min_b * 0.85 && pubPrice <= max_b * 1.15)           { budgetMatch = 'partial'; budgetScore = budget_weight * 0.5; }
            else                                                                      { budgetMatch = 'none';    budgetScore = 0; }
          }

          // 3. Barrio
          let selectedIdList: string[] = [];
          if (Array.isArray(userSearch.neighborhood_ids)) selectedIdList = userSearch.neighborhood_ids;
          else if (typeof userSearch.neighborhood_ids === "string") selectedIdList = [userSearch.neighborhood_ids];
          const pubNeighborhood = pub.neighborhood;
          const userNeighborhoodNames = selectedIdList.map((id: string) => neighborhoodMap[id] || "").filter(Boolean);
          let neighborhoodMatch = selectedIdList.length === 0; // sin preferencia = match automático
          if (!neighborhoodMatch) neighborhoodMatch = userNeighborhoodNames.includes(pubNeighborhood);
          const neighborhoodScore = neighborhoodMatch ? neighborhood_weight : 0;

          // 4. Ambientes
          const minRooms = userSearch.min_bedrooms || 0;
          const pubRooms = pub._rooms || 0;
          const roomsMatch = minRooms === 0 || pubRooms >= minRooms;
          const roomsScore = roomsMatch ? rooms_weight : 0;

          matchScore = Math.floor(Math.min(100, Math.max(0, operationScore + budgetScore + neighborhoodScore + roomsScore)));

          // Labels legibles para mostrar en el popover
          matchScoreBreakdown = {
            operationScore, operationMax: operation_weight, operationMatch,
            propertyOperationLabel: isRent ? "Alquiler" : isSale ? "Compra/Venta" : "Sin dato",
            userOperationLabel: wantBoth ? "Indiferente (alquiler o compra)" : wantRent ? "Alquiler" : "Compra",

            budgetScore, budgetMax: budget_weight, budgetMatch,
            propertyPriceLabel: pubPrice > 0 ? `${pubCurrency} ${pubPrice.toLocaleString("es-UY")}` : "Sin precio",
            userBudgetLabel: (min_b > 0 || max_b < 999999999)
              ? `${userCurrency} ${min_b.toLocaleString("es-UY")} – ${max_b < 999999999 ? max_b.toLocaleString("es-UY") : "sin máx"}`
              : "Sin rango definido",

            neighborhoodScore, neighborhoodMax: neighborhood_weight, neighborhoodMatch,
            propertyNeighborhoodLabel: pubNeighborhood || "Sin barrio",
            userNeighborhoodsLabel: userNeighborhoodNames.length > 0
              ? userNeighborhoodNames.slice(0, 3).join(", ") + (userNeighborhoodNames.length > 3 ? ` +${userNeighborhoodNames.length - 3}` : "")
              : "Sin preferencia de barrio",

            roomsScore, roomsMax: rooms_weight, roomsMatch,
            propertyRoomsLabel: pubRooms > 0 ? `${pubRooms} amb.` : "Sin dato",
            userRoomsLabel: minRooms > 0 ? `Mín. ${minRooms} amb.` : "Sin preferencia",
          };
        }
        // ─────────────────────────────────────────────────────────────────────

        return { ...user, personalRating, familyRating, matchScore, matchScoreBreakdown, credibilityScore };
      }),
    }));
  }, [allInsights, reviews, searchProfiles, matchWeightsConfig, neighborhoods]);

  return {
    data: enrichedInsights,
    isLoading: infiniteQuery.isLoading,
    isFetchingNextPage: infiniteQuery.isFetchingNextPage,
    hasNextPage: infiniteQuery.hasNextPage,
    fetchNextPage: infiniteQuery.fetchNextPage,
  };
}
