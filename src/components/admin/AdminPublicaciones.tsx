import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ExternalLink } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { STATUS_CONFIG, type PropertyStatus } from "@/types/property";
import { PROPERTY_STATUS_LABELS } from "@/lib/constants";

interface AdminProperty {
  id: string;
  title: string;
  url: string;
  status: PropertyStatus;
  marketplace_status: string | null;
  created_by_email: string;
  source_marketplace_id: string | null;
  listing_type: "rent" | "sale";
  created_at: string;
}

interface Props {
  toast: (opts: { title: string; description?: string; variant?: "default" | "destructive" }) => void;
}

const PROPERTY_STATUSES: PropertyStatus[] = [
  "ingresado", "contacted", "coordinated", "visited", "a_analizar", "discarded", "eliminado",
];

export function AdminPublicaciones({ toast }: Props) {
  const [properties, setProperties] = useState<AdminProperty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchProperties(); }, []);

  const fetchProperties = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("properties")
      .select("id, title, url, status, marketplace_status, created_by_email, source_marketplace_id, listing_type, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error al cargar publicaciones", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    setProperties(data || []);
    setLoading(false);
  };

  const updateStatus = async (id: string, newStatus: PropertyStatus) => {
    const prev = properties;
    setProperties(p => p.map(prop => prop.id === id ? { ...prop, status: newStatus } : prop));

    const { error } = await supabase
      .from("properties")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      setProperties(prev);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Estado actualizado" });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (properties.length === 0) {
    return <div className="text-center py-12 text-muted-foreground">No hay publicaciones guardadas.</div>;
  }

  return (
    <div className="space-y-2">
      {/* Desktop: tabla con grid */}
      <div className="hidden lg:block">
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
          <span>Título</span>
          <span>Usuario</span>
          <span>Operación</span>
          <span>Marketplace</span>
          <span>Estado</span>
          <span>Acción</span>
        </div>

        {properties.map((prop) => {
          const sc = STATUS_CONFIG[prop.status];
          const mkStatus = prop.marketplace_status && prop.marketplace_status !== "active"
            ? PROPERTY_STATUS_LABELS[prop.marketplace_status] || prop.marketplace_status
            : null;

          return (
            <div key={prop.id} className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-4 py-3 rounded-xl hover:bg-muted/50 transition-colors items-center text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <span className="truncate text-foreground font-medium">{prop.title}</span>
                {prop.url && (
                  <a href={prop.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-primary hover:text-primary/80">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
              <div className="min-w-[120px]">
                <span className="text-xs text-muted-foreground truncate block max-w-[160px]">{prop.created_by_email || "—"}</span>
              </div>
              <div className="min-w-[70px]">
                <Badge variant={prop.listing_type === "sale" ? "default" : "secondary"} className="text-xs">
                  {prop.listing_type === "sale" ? "Venta" : "Alquiler"}
                </Badge>
              </div>
              <div className="min-w-[80px]">
                {mkStatus ? (
                  <Badge variant="secondary" className="text-xs">{mkStatus}</Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </div>
              <div className="min-w-[100px]">
                <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium ${sc.bg} ${sc.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                  {sc.label}
                </span>
              </div>
              <div className="shrink-0 min-w-[140px]">
                <Select value={prop.status} onValueChange={(v) => updateStatus(prop.id, v as PropertyStatus)}>
                  <SelectTrigger className="h-8 rounded-xl text-xs w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROPERTY_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        <span className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[s].dot}`} />
                          {STATUS_CONFIG[s].label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile: cards apiladas */}
      <div className="lg:hidden space-y-3">
        {properties.map((prop) => {
          const sc = STATUS_CONFIG[prop.status];
          const mkStatus = prop.marketplace_status && prop.marketplace_status !== "active"
            ? PROPERTY_STATUS_LABELS[prop.marketplace_status] || prop.marketplace_status
            : null;

          return (
            <div key={prop.id} className="rounded-xl border border-border p-4 space-y-3 bg-card">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground truncate">{prop.title}</span>
                    {prop.url && (
                      <a href={prop.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-primary hover:text-primary/80">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground block mt-0.5">{prop.created_by_email || "—"}</span>
                </div>
                <Badge variant={prop.listing_type === "sale" ? "default" : "secondary"} className="text-xs shrink-0">
                  {prop.listing_type === "sale" ? "Venta" : "Alquiler"}
                </Badge>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium ${sc.bg} ${sc.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                  {sc.label}
                </span>
                {mkStatus && <Badge variant="secondary" className="text-xs">{mkStatus}</Badge>}
              </div>

              <Select value={prop.status} onValueChange={(v) => updateStatus(prop.id, v as PropertyStatus)}>
                <SelectTrigger className="h-8 rounded-xl text-xs w-full">
                  <SelectValue placeholder="Cambiar estado" />
                </SelectTrigger>
                <SelectContent>
                  {PROPERTY_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      <span className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[s].dot}`} />
                        {STATUS_CONFIG[s].label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        })}
      </div>
    </div>
  );
}
