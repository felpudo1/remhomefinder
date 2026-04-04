import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { QrCode, Bookmark, Phone, Calendar, TrendingUp } from "lucide-react";
import { Loader2 } from "lucide-react";

interface PublicationAnalytics {
  publicationId: string;
  propertyTitle: string;
  totalScans: number;
  totalSaved: number;
  contacted: number;
  visitsCoordinated: number;
  firmeCandidato: number;
}

interface QRAnalyticsProps {
  agencyId: string;
  userId: string;
}

/**
 * Panel de analytics de QR para agentes.
 * Muestra scans, guardados y embudo de conversión por publicación.
 */
export function QRAnalytics({ agencyId, userId }: QRAnalyticsProps) {
  const [data, setData] = useState<PublicationAnalytics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        // Get agent's publications
        const { data: pubs, error: pubsError } = await supabase
          .from("agent_publications")
          .select("id, property_id")
          .eq("org_id", agencyId)
          .neq("status", "eliminado");

        if (pubsError || !pubs?.length) {
          setData([]);
          setLoading(false);
          return;
        }

        const pubIds = pubs.map((p) => p.id);
        const propertyIds = pubs.map((p) => p.property_id);

        // Get property titles
        const { data: properties } = await supabase
          .from("properties")
          .select("id, title")
          .in("id", propertyIds);

        const titleMap = new Map(
          (properties || []).map((p) => [p.id, p.title])
        );

        // Get QR scan events
        const { data: events } = await supabase
          .from("analytics_events" as any)
          .select("source_publication_id, event_type")
          .in("source_publication_id", pubIds);

        // Get user listings from QR
        const { data: listings } = await supabase
          .from("user_listings")
          .select("source_publication_id, current_status")
          .in("source_publication_id", pubIds);

        // Aggregate
        const analytics: PublicationAnalytics[] = pubs.map((pub) => {
          const pubEvents = (events || []).filter(
            (e: any) => e.source_publication_id === pub.id
          );
          const pubListings = (listings || []).filter(
            (l) => l.source_publication_id === pub.id
          );

          return {
            publicationId: pub.id,
            propertyTitle: titleMap.get(pub.property_id) || "Sin título",
            totalScans: pubEvents.filter((e: any) => e.event_type === "qr_scan").length,
            totalSaved: pubListings.length,
            contacted: pubListings.filter((l) => l.current_status === "contactado").length,
            visitsCoordinated: pubListings.filter((l) => l.current_status === "visita_coordinada").length,
            firmeCandidato: pubListings.filter((l) => l.current_status === "firme_candidato").length,
          };
        });

        // Sort by scans desc
        analytics.sort((a, b) => b.totalScans - a.totalScans);
        setData(analytics);
      } catch (err) {
        console.error("QR Analytics fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [agencyId, userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const totalScans = data.reduce((s, d) => s + d.totalScans, 0);
  const totalSaved = data.reduce((s, d) => s + d.totalSaved, 0);
  const totalContacted = data.reduce((s, d) => s + d.contacted, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <QrCode className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Analytics de QR</h3>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3 px-4 text-center">
            <QrCode className="w-5 h-5 mx-auto text-blue-500 mb-1" />
            <div className="text-2xl font-bold">{totalScans}</div>
            <div className="text-xs text-muted-foreground">Escaneos QR</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4 text-center">
            <Bookmark className="w-5 h-5 mx-auto text-green-500 mb-1" />
            <div className="text-2xl font-bold">{totalSaved}</div>
            <div className="text-xs text-muted-foreground">Guardados</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4 text-center">
            <Phone className="w-5 h-5 mx-auto text-amber-500 mb-1" />
            <div className="text-2xl font-bold">{totalContacted}</div>
            <div className="text-xs text-muted-foreground">Contactados</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4 text-center">
            <TrendingUp className="w-5 h-5 mx-auto text-purple-500 mb-1" />
            <div className="text-2xl font-bold">
              {totalScans > 0 ? Math.round((totalSaved / totalScans) * 100) : 0}%
            </div>
            <div className="text-xs text-muted-foreground">Conversión</div>
          </CardContent>
        </Card>
      </div>

      {/* Per-publication breakdown */}
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Aún no hay escaneos de QR registrados.
        </p>
      ) : (
        <div className="space-y-3">
          {data.map((pub) => (
            <Card key={pub.publicationId}>
              <CardContent className="py-3 px-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{pub.propertyTitle}</p>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <QrCode className="w-3 h-3" /> {pub.totalScans} scans
                      </span>
                      <span className="flex items-center gap-1">
                        <Bookmark className="w-3 h-3" /> {pub.totalSaved} guardados
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {pub.contacted} contactados
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {pub.visitsCoordinated} visitas
                      </span>
                      <span className="flex items-center gap-1">
                        🔥 {pub.firmeCandidato} alta prioridad
                      </span>
                    </div>
                  </div>
                  {pub.totalScans > 0 && (
                    <div className="text-right shrink-0">
                      <div className="text-lg font-bold text-primary">
                        {Math.round((pub.totalSaved / pub.totalScans) * 100)}%
                      </div>
                      <div className="text-[10px] text-muted-foreground">conv.</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
