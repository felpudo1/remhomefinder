import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ExternalLink, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { STATUS_CONFIG, type PropertyStatus } from "@/types/property";
import { PROPERTY_STATUS_LABELS, AGENT_PROPERTY_STATUSES } from "@/lib/constants";
import { DeletePropertyDialog } from "@/components/property/DeletePropertyDialog";

type MarketplaceStatus = "active" | "paused" | "sold" | "reserved" | "rented" | "deleted";

const MK_STATUS_COLORS: Record<MarketplaceStatus, string> = {
  active: "bg-emerald-100 text-emerald-700",
  paused: "bg-amber-100 text-amber-700",
  reserved: "bg-blue-100 text-blue-700",
  sold: "bg-gray-100 text-gray-600",
  rented: "bg-violet-100 text-violet-700",
  deleted: "bg-red-100 text-red-700",
};

interface AdminProperty {
  id: string;
  title: string;
  url: string;
  status: PropertyStatus;
  marketplace_status: MarketplaceStatus | null;
  created_by_email: string;
  source_marketplace_id: string | null;
  listing_type: "rent" | "sale";
  created_at: string;
}

interface Props {
  toast: (opts: { title: string; description?: string; variant?: "default" | "destructive" }) => void;
}

export function AdminPublicaciones({ toast }: Props) {
  const [properties, setProperties] = useState<AdminProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<AdminProperty | null>(null);

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

  const updateMarketplaceStatus = async (prop: AdminProperty, newStatus: MarketplaceStatus) => {
    const prev = properties;
    setProperties(p => p.map(pr => pr.id === prop.id ? { ...pr, marketplace_status: newStatus } : pr));

    // If linked to marketplace, update the source (trigger syncs to all copies)
    if (prop.source_marketplace_id) {
      const { error } = await supabase
        .from("marketplace_properties")
        .update({ status: newStatus })
        .eq("id", prop.source_marketplace_id);

      if (error) {
        setProperties(prev);
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
    } else {
      // No marketplace source, update directly on properties
      const { error } = await supabase
        .from("properties")
        .update({ marketplace_status: newStatus })
        .eq("id", prop.id);

      if (error) {
        setProperties(prev);
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
    }

    toast({ title: "Estado de publicación actualizado" });
  };

  const deleteProperty = async (reason: string) => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setProperties(p => p.filter(prop => prop.id !== id));
    setDeleteTarget(null);

    const { error } = await supabase
      .from("properties")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Error al eliminar", description: error.message, variant: "destructive" });
      fetchProperties();
    } else {
      toast({ title: "Propiedad eliminada permanentemente" });
    }
  };

  const getStatusOptions = (listingType: "rent" | "sale"): readonly string[] => {
    return listingType === "sale" ? AGENT_PROPERTY_STATUSES.SALE : AGENT_PROPERTY_STATUSES.RENT;
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
      {/* Desktop */}
      <div className="hidden lg:block">
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
          <span>Título</span>
          <span>Usuario</span>
          <span>Operación</span>
          <span>Estado publicación</span>
          <span>Cambiar estado</span>
          <span></span>
        </div>

        {properties.map((prop) => {
          const mkLabel = prop.marketplace_status ? PROPERTY_STATUS_LABELS[prop.marketplace_status] || prop.marketplace_status : "—";
          const mkColor = prop.marketplace_status ? MK_STATUS_COLORS[prop.marketplace_status] || "" : "";

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
              <div className="min-w-[90px]">
                {prop.marketplace_status ? (
                  <span className={`inline-flex items-center text-xs px-2.5 py-0.5 rounded-full font-medium ${mkColor}`}>
                    {mkLabel}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </div>
              <div className="shrink-0 min-w-[150px]">
                <Select
                  value={prop.marketplace_status || ""}
                  onValueChange={(v) => updateMarketplaceStatus(prop, v as MarketplaceStatus)}
                >
                  <SelectTrigger className="h-8 rounded-xl text-xs w-[150px]">
                    <SelectValue placeholder="Sin estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {getStatusOptions(prop.listing_type).map((s) => (
                      <SelectItem key={s} value={s}>
                        {PROPERTY_STATUS_LABELS[s] || s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => setDeleteTarget(prop)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile */}
      <div className="lg:hidden space-y-3">
        {properties.map((prop) => {
          const mkLabel = prop.marketplace_status ? PROPERTY_STATUS_LABELS[prop.marketplace_status] || prop.marketplace_status : null;
          const mkColor = prop.marketplace_status ? MK_STATUS_COLORS[prop.marketplace_status] || "" : "";

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
                <div className="flex items-center gap-1 shrink-0">
                  <Badge variant={prop.listing_type === "sale" ? "default" : "secondary"} className="text-xs">
                    {prop.listing_type === "sale" ? "Venta" : "Alquiler"}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => setDeleteTarget(prop)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {mkLabel ? (
                  <span className={`inline-flex items-center text-xs px-2.5 py-0.5 rounded-full font-medium ${mkColor}`}>
                    {mkLabel}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">Sin estado de publicación</span>
                )}
              </div>

              <Select
                value={prop.marketplace_status || ""}
                onValueChange={(v) => updateMarketplaceStatus(prop, v as MarketplaceStatus)}
              >
                <SelectTrigger className="h-8 rounded-xl text-xs w-full">
                  <SelectValue placeholder="Cambiar estado publicación" />
                </SelectTrigger>
                <SelectContent>
                  {getStatusOptions(prop.listing_type).map((s) => (
                    <SelectItem key={s} value={s}>
                      {PROPERTY_STATUS_LABELS[s] || s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        })}
      </div>

      <DeletePropertyDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={deleteProperty}
        title={deleteTarget?.title || ""}
      />
    </div>
  );
}
