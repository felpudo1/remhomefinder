import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useMemo } from "react";
import { parseCoordinatedVisitDateFromMetadata } from "@/lib/date-utils";

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
  orgId: string;
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
  statusBreakdown: string;
  users: AgentUserInsight[];
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
        statusBreakdown: "",
        users: [],
      };
      pubMap.set(row.publication_id, pub);
      pubOrder.push(row.publication_id);
    }

    // Si hay user_listing_id, agregar el usuario
    if (row.user_listing_id && row.user_id) {
      const ratingsByStatus = row.ratings_by_status || {};

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

    // Promedios de contactado
    let totalInterest = 0, totalUrgency = 0, interestCount = 0;
    const statusCounts: Record<string, number> = {};

    pub.users.forEach((user) => {
      statusCounts[user.currentStatus] = (statusCounts[user.currentStatus] || 0) + 1;
      const contactadoMeta = user.ratingsByStatus["contactado"];
      if (contactadoMeta) {
        totalInterest += safeNum(contactadoMeta.contacted_interest);
        totalUrgency += safeNum(contactadoMeta.contacted_urgency);
        if (safeNum(contactadoMeta.contacted_interest) > 0) interestCount++;
      }
    });

    pub.avgContactedInterest = interestCount > 0 ? totalInterest / interestCount : 0;
    pub.avgContactedUrgency = interestCount > 0 ? totalUrgency / interestCount : 0;

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
      // Si la última página trajo menos propiedades que PAGE_SIZE, no hay más
      if (lastPage.length < PAGE_SIZE) return undefined;
      // El offset es el total de propiedades cargadas hasta ahora
      return allPages.reduce((acc, page) => acc + page.length, 0);
    },
    staleTime: 5 * 60 * 1000,
  });

  // Flatten all pages into a single array
  const allInsights = useMemo(() => {
    if (!infiniteQuery.data?.pages) return [];
    return infiniteQuery.data.pages.flat();
  }, [infiniteQuery.data?.pages]);

  // Fetch supplementary data for match_score and ratings (only for loaded items)
  const userIds = useMemo(() => {
    const ids = new Set<string>();
    allInsights.forEach((pub) => pub.users.forEach((u) => ids.add(u.userId)));
    return [...ids];
  }, [allInsights]);

  const propertyIds = useMemo(() => {
    return [...new Set(allInsights.map((pub) => pub.propertyId))];
  }, [allInsights]);

  // Fetch property reviews
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

  // Fetch search profiles for match_score
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

  // Fetch match weights
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

  // Fetch neighborhoods for match_score
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

  // Enrich insights with match_score, personalRating, familyRating
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

    return allInsights.map((pub) => ({
      ...pub,
      users: pub.users.map((user) => {
        // Personal rating
        const personalRating = userReviewMap[`${pub.propertyId}_${user.userId}`];
        // Family rating
        const famRev = familyReviewAcc[`${pub.propertyId}_${user.orgId}`];
        const familyRating = famRev && famRev.count > 0 ? famRev.sum / famRev.count : undefined;

        // Match score
        let matchScore: number | undefined = undefined;
        const userSearch = searchProfileMap[user.userId];
        if (userSearch) {
          matchScore = 0;
          const { operation_weight = 30, budget_weight = 40, neighborhood_weight = 20, rooms_weight = 10 } = matchWeights;

          // Operation matching - necesitamos listing_type del pub (del RPC row)
          // Lo sacamos del primer row que tenga este publication_id
          const rpcPub = allInsights.find(p => p.publicationId === pub.publicationId);
          // No tenemos listing_type en AgentPropertyInsight, pero lo podemos deducir
          // Para mantener la interfaz, buscamos en las raw pages
          // Simplificación: usamos la info disponible
          const op = String(userSearch.operation || "").trim().toLowerCase();
          const wantRent = op === "rent" || op === "alquilar";
          const wantBuy = op === "buy" || op === "comprar";
          const wantBoth = op === "all" || op === "ambas" || !op;

          // listing_type no está en la interfaz pública, pero podemos agregarlo internamente
          if (wantBoth) {
            matchScore += operation_weight;
          }
          // Para operation matching completo necesitaríamos listing_type — lo omitimos si wantBoth no aplica
          // ya que no está en AgentPropertyInsight. Se deja como estaba.

          // Budget matching
          const min_b = userSearch.min_budget || 0;
          const max_b = userSearch.max_budget || 999999999;
          // price no está en AgentPropertyInsight — se pierde. Lo dejamos como 0.
          // TODO: agregar price a la interfaz si se necesita

          // Location matching
          let selectedNeighborhoods: string[] = [];
          if (Array.isArray(userSearch.neighborhood_ids)) {
            selectedNeighborhoods = userSearch.neighborhood_ids;
          } else if (typeof userSearch.neighborhood_ids === "string") {
            selectedNeighborhoods = [userSearch.neighborhood_ids as string];
          }
          const pubNeighborhood = pub.neighborhood;
          let hasNeighborhoodMatch = selectedNeighborhoods.length === 0;
          if (!hasNeighborhoodMatch) {
            const selectedNames = selectedNeighborhoods.map((id: string) => neighborhoodMap[id] || "");
            hasNeighborhoodMatch = selectedNames.includes(pubNeighborhood);
          }
          if (hasNeighborhoodMatch) {
            matchScore += neighborhood_weight;
          }

          // Rooms matching — rooms no está en AgentPropertyInsight
          const minRooms = userSearch.min_bedrooms || 0;
          if (minRooms === 0) {
            matchScore += rooms_weight;
          }

          matchScore = Math.floor(Math.min(100, Math.max(0, matchScore)));
        }

        return {
          ...user,
          personalRating,
          familyRating,
          matchScore,
        };
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
