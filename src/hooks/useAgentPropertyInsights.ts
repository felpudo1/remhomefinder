import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow, parseISO } from "date-fns";
import { es } from "date-fns/locale";
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
  /** Fecha de visita si está en event_metadata (varias claves posibles). */
  coordinatedDate?: Date;
  userListingId: string;
  ratingsByStatus: Record<string, any>; // Dinámico para soportar STATUS_FEEDBACK_CONFIG
  personalRating?: number;
  familyRating?: number;
  orgId: string;
}

export interface AgentPropertyInsight {
  publicationId: string;
  propertyId: string;
  title: string;
  neighborhood: string;
  ref?: string;
  usersSaved: number;
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

/**
 * Fetches real insights for agent publications:
 * - user_listings linked via source_publication_id
 * - status_history_log with event_metadata ratings
 * - profile contact info (masked email)
 */
export function useAgentPropertyInsights(agencyOrgId: string | undefined) {
  return useQuery({
    queryKey: ["agent-property-insights", agencyOrgId],
    enabled: !!agencyOrgId,
    queryFn: async (): Promise<AgentPropertyInsight[]> => {
      if (!agencyOrgId) return [];

      // 1. Get agent publications
      const { data: pubs, error: pubErr } = await supabase
        .from("agent_publications")
        .select("id, property_id, properties(title, neighborhood, ref), status")
        .eq("org_id", agencyOrgId)
        .neq("status", "eliminado");
      if (pubErr) throw pubErr;
      if (!pubs?.length) return [];

      const pubIds = pubs.map((p: any) => p.id);

      // 2. Get user_listings linked to these publications
      const { data: listings, error: listErr } = await supabase
        .from("user_listings")
        .select("id, source_publication_id, added_by, current_status, updated_at, org_id")
        .in("source_publication_id", pubIds);
      if (listErr) throw listErr;
      if (!listings?.length) {
        return pubs.map((pub: any) => ({
          publicationId: pub.id,
          propertyId: pub.property_id,
          title: pub.properties?.title || "",
          neighborhood: pub.properties?.neighborhood || "",
          ref: pub.properties?.ref || undefined,
          usersSaved: 0,
          avgContactedInterest: 0,
          avgContactedUrgency: 0,
          statusBreakdown: "",
          users: [],
        }));
      }

      const listingIds = listings.map((l: any) => l.id);
      const userIds = [...new Set(listings.map((l: any) => l.added_by))];

      // 3. Get profiles for contact info
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, email, phone")
        .in("user_id", userIds);
      const profileMap: Record<string, { display_name: string; email: string | null; phone: string }> = {};
      (profiles || []).forEach((p: any) => {
        profileMap[p.user_id] = { display_name: p.display_name, email: p.email, phone: p.phone };
      });

      // 4. Get status_history_log for all relevant listings
      const { data: logs } = await supabase
        .from("status_history_log")
        .select("user_listing_id, new_status, event_metadata, created_at")
        .in("user_listing_id", listingIds)
        .order("created_at", { ascending: true });

      // Group logs by user_listing_id
      const logsByListing: Record<string, Array<{ new_status: string; event_metadata: any; created_at: string }>> = {};
      (logs || []).forEach((l: any) => {
        if (!logsByListing[l.user_listing_id]) logsByListing[l.user_listing_id] = [];
        logsByListing[l.user_listing_id].push(l);
      });

      // 4.5 Get Property Reviews for the relevant properties and family orgs
      const propertyIds = [...new Set(pubs.map((p: any) => p.property_id))];
      const { data: reviews } = await supabase
        .from("property_reviews")
        .select("property_id, user_id, org_id, rating")
        .in("property_id", propertyIds);

      // Agrupar reseñas por usuario y propiedad
      const userReviewMap: Record<string, number> = {};
      // Agrupar reseñas por org_id y propiedad para sacar promedio familiar
      const familyReviewAcc: Record<string, { sum: number; count: number }> = {};

      (reviews || []).forEach((r: any) => {
        const userKey = `${r.property_id}_${r.user_id}`;
        userReviewMap[userKey] = r.rating;

        const orgKey = `${r.property_id}_${r.org_id}`;
        if (!familyReviewAcc[orgKey]) familyReviewAcc[orgKey] = { sum: 0, count: 0 };
        familyReviewAcc[orgKey].sum += r.rating;
        familyReviewAcc[orgKey].count += 1;
      });

      // 5. Build per-publication insights
      const listingsByPub: Record<string, typeof listings> = {};
      listings.forEach((l: any) => {
        if (!l.source_publication_id) return;
        if (!listingsByPub[l.source_publication_id]) listingsByPub[l.source_publication_id] = [];
        listingsByPub[l.source_publication_id].push(l);
      });

      return pubs.map((pub: any) => {
        const pubListings = listingsByPub[pub.id] || [];
        const statusCounts: Record<string, number> = {};

        // Accumulators for averages
        let totalInterest = 0, totalUrgency = 0, interestCount = 0;

        const users: AgentUserInsight[] = pubListings.map((listing: any) => {
          const profile = profileMap[listing.added_by] || { display_name: "Usuario", email: null, phone: "" };
          const userLogs = logsByListing[listing.id] || [];

          // Count status
          const status = listing.current_status || "ingresado";
          statusCounts[status] = (statusCounts[status] || 0) + 1;

          // Build ratings by status from logs (last log per status wins)
          const ratingsByStatus: AgentUserInsight["ratingsByStatus"] = {};

          userLogs.forEach((log) => {
            const meta = log.event_metadata || {};
            // Guardamos todo el metadata dinámicamente
            ratingsByStatus[log.new_status] = { ...meta };

            // Acumuladores para los promedios globales de la propiedad (solo para contactado)
            if (log.new_status === "contactado") {
              totalInterest += safeNum(meta.contacted_interest);
              totalUrgency += safeNum(meta.contacted_urgency);
              if (safeNum(meta.contacted_interest) > 0) interestCount++;
            }
          });

          // Fecha de visita: metadata puede usar coordinated_date u otros field_id (config BD)
          const visitaLog = userLogs.find((l) => l.new_status === "visita_coordinada");
          const coordinatedDate = parseCoordinatedVisitDateFromMetadata(visitaLog?.event_metadata);

          let updatedAtRelative = "";
          try {
            updatedAtRelative = formatDistanceToNow(parseISO(listing.updated_at), { addSuffix: true, locale: es });
          } catch {
            updatedAtRelative = listing.updated_at || "";
          }

          const userReviewKey = `${pub.property_id}_${listing.added_by}`;
          const personalRating = userReviewMap[userReviewKey];

          const originOrgId = listing.org_id;
          const familyReviewKey = `${pub.property_id}_${originOrgId}`;
          let familyRating = undefined;
          if (familyReviewAcc[familyReviewKey]) {
            const { sum, count } = familyReviewAcc[familyReviewKey];
            familyRating = Math.round((sum / count) * 10) / 10;
          }

          return {
            userId: listing.added_by,
            displayName: profile.display_name || "Usuario",
            emailMasked: maskEmail(profile.email),
            phone: profile.phone || "",
            currentStatus: status,
            updatedAt: listing.updated_at,
            updatedAtRelative,
            coordinatedDate,
            userListingId: listing.id,
            ratingsByStatus,
            personalRating,
            familyRating,
            orgId: originOrgId,
          };
        });

        // Status breakdown string
        const breakdownParts = Object.entries(statusCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([status, count]) => `${count} ${status.replace("_", " ")}`);

        return {
          publicationId: pub.id,
          propertyId: pub.property_id,
          title: pub.properties?.title || "",
          neighborhood: pub.properties?.neighborhood || "",
          ref: pub.properties?.ref || undefined,
          usersSaved: pubListings.length,
          avgContactedInterest: interestCount > 0 ? totalInterest / interestCount : 0,
          avgContactedUrgency: interestCount > 0 ? totalUrgency / interestCount : 0,
          statusBreakdown: breakdownParts.join(" · "),
          users,
        };
      });
    },
    // 5 minutos — reduce los ~1.200 requests/hora que generaba el staleTime de 1 minuto
    // con múltiples clientes en el AgentDashboard. Los insights de publicaciones
    // no necesitan actualización tan frecuente; el usuario puede refrescar manualmente si lo requiere.
    staleTime: 5 * 60 * 1000,
  });
}
