import { supabase } from "@/integrations/supabase/client";
import { useCallback } from "react";

type AnalyticsEventType = "qr_scan" | "property_view" | "listing_saved";

interface TrackEventParams {
  eventType: AnalyticsEventType;
  propertyId: string;
  sourcePublicationId?: string | null;
  userId?: string | null;
  orgId?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Hook para registrar eventos de analytics.
 * Permite insertar eventos anónimos (user_id = null) que luego se
 * actualizan post-registro con el user_id real.
 */
export function useAnalytics() {
  const trackEvent = useCallback(async (params: TrackEventParams) => {
    try {
      const { error } = await supabase.from("analytics_events" as any).insert({
        event_type: params.eventType,
        property_id: params.propertyId,
        source_publication_id: params.sourcePublicationId || null,
        user_id: params.userId || null,
        org_id: params.orgId || null,
        metadata: params.metadata || {},
      });
      if (error) console.warn("Analytics event error:", error.message);
    } catch (err) {
      console.warn("Analytics tracking failed:", err);
    }
  }, []);

  /**
   * Asocia eventos anónimos previos a un usuario recién registrado.
   * Usa property_id + source_publication_id para encontrar el match.
   */
  const claimAnonymousEvents = useCallback(
    async (userId: string, propertyId: string, publicationId?: string | null) => {
      try {
        const query = supabase
          .from("analytics_events" as any)
          .update({ user_id: userId })
          .eq("property_id", propertyId)
          .is("user_id", null);

        if (publicationId) {
          query.eq("source_publication_id", publicationId);
        }

        await query;
      } catch (err) {
        console.warn("Claim anonymous events failed:", err);
      }
    },
    []
  );

  return { trackEvent, claimAnonymousEvents };
}
