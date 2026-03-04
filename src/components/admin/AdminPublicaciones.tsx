import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ExternalLink, Trash2, Users, Building2, EyeOff, Eye } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { STATUS_CONFIG, type PropertyStatus } from "@/types/property";
import { PROPERTY_STATUS_LABELS, AGENT_PROPERTY_STATUSES } from "@/lib/constants";
import { DeletePropertyDialog } from "@/components/property/DeletePropertyDialog";

// ── Tipos de estado del marketplace ──────────────────────────────────────────
type MarketplaceStatus = "active" | "paused" | "sold" | "reserved" | "rented" | "deleted";

/**
 * Colores visuales para cada estado del marketplace (publicaciones de agentes).
 */
const MK_STATUS_COLORS: Record<MarketplaceStatus, string> = {
  active: "bg-emerald-100 text-emerald-700",
  paused: "bg-amber-100 text-amber-700",
  reserved: "bg-blue-100 text-blue-700",
  sold: "bg-gray-100 text-gray-600",
  rented: "bg-violet-100 text-violet-700",
  deleted: "bg-red-100 text-red-700",
};

// ── Tipos de datos ────────────────────────────────────────────────────────────

/**
 * Propiedad guardada por un usuario en su listado personal.
 * Status = flujo personal del user (contactado, visitado, coordinado, etc.)
 */
interface UserProperty {
  id: string;
  title: string;
  url: string;
  status: PropertyStatus;
  created_by_email: string;
  source_marketplace_id: string | null;
  listing_type: "rent" | "sale";
  created_at: string;
  admin_hidden: boolean;
}

/**
 * Publicación de agente en el HFMarket.
 * Status = estado de la publicación (activa, pausada, vendida, etc.)
 */
interface MktProperty {
  id: string;
  title: string;
  url: string;
  status: MarketplaceStatus;
  listing_type: "rent" | "sale";
  created_at: string;
  agency_name?: string;
}

interface Props {
  toast: (opts: { title: string; description?: string; variant?: "default" | "destructive" }) => void;
}

// ── Componente principal ──────────────────────────────────────────────────────
export function AdminPublicaciones({ toast }: Props) {
  // Estado para propiedades de usuarios
  const [userProps, setUserProps] = useState<UserProperty[]>([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [deleteUserTarget, setDeleteUserTarget] = useState<UserProperty | null>(null);

  // Estado para publicaciones del marketplace (agentes)
  const [mktProps, setMktProps] = useState<MktProperty[]>([]);
  const [loadingMkt, setLoadingMkt] = useState(true);
  const [deleteMktTarget, setDeleteMktTarget] = useState<MktProperty | null>(null);

  useEffect(() => {
    fetchUserProperties();
    fetchMktProperties();
  }, []);

  /**
   * Carga las propiedades guardadas por usuarios (listado personal).
   */
  const fetchUserProperties = async () => {
    setLoadingUser(true);
    const { data, error } = await supabase
      .from("properties")
      // El admin ve TODAS, incluyendo las ocultas
      .select("id, title, url, status, created_by_email, source_marketplace_id, listing_type, created_at, admin_hidden")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error al cargar propiedades de usuarios", description: error.message, variant: "destructive" });
    } else {
      setUserProps(data || []);
    }
    setLoadingUser(false);
  };

  /**
   * Carga las publicaciones del marketplace (ingresadas por agentes).
   */
  const fetchMktProperties = async () => {
    setLoadingMkt(true);
    const { data, error } = await supabase
      .from("marketplace_properties")
      .select("id, title, url, status, listing_type, created_at, agencies(name)")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error al cargar publicaciones del marketplace", description: error.message, variant: "destructive" });
    } else {
      setMktProps(
        (data || []).map((p: any) => ({
          id: p.id,
          title: p.title,
          url: p.url,
          status: p.status,
          listing_type: p.listing_type,
          created_at: p.created_at,
          agency_name: p.agencies?.name || "Agencia",
        }))
      );
    }
    setLoadingMkt(false);
  };

  /**
   * Oculta o restaura una propiedad de usuario (soft delete).
   * El usuario no verá la propiedad mientras admin_hidden = true.
   */
  const toggleHideUserProperty = async (prop: UserProperty) => {
    const newHidden = !prop.admin_hidden;
    // Actualización optimista
    setUserProps(p => p.map(pr => pr.id === prop.id ? { ...pr, admin_hidden: newHidden } : pr));

    const { error } = await supabase
      .from("properties")
      .update({
        admin_hidden: newHidden,
        admin_hidden_at: newHidden ? new Date().toISOString() : null,
      })
      .eq("id", prop.id);

    if (error) {
      // Rollback
      setUserProps(p => p.map(pr => pr.id === prop.id ? { ...pr, admin_hidden: !newHidden } : pr));
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: newHidden ? "Propiedad ocultada al usuario" : "Propiedad restaurada" });
    }
  };

  /**
   * Elimina físicamente una propiedad del listado de un usuario (hard delete).
   */
  const deleteUserProperty = async (reason: string) => {
    if (!deleteUserTarget) return;
    const id = deleteUserTarget.id;
    setUserProps(p => p.filter(prop => prop.id !== id));
    setDeleteUserTarget(null);

    const { error } = await supabase.from("properties").delete().eq("id", id);
    if (error) {
      toast({ title: "Error al eliminar", description: error.message, variant: "destructive" });
      fetchUserProperties();
    } else {
      toast({ title: "Propiedad eliminada permanentemente" });
    }
  };

  /**
   * Cambia el estado de una publicación del marketplace.
   * El trigger trg_sync_marketplace_to_properties propagará el cambio
   * automáticamente a todas las copias en properties de los usuarios.
   */
  const updateMktStatus = async (prop: MktProperty, newStatus: MarketplaceStatus) => {
    const prev = mktProps;
    // Actualización optimista
    setMktProps(p => p.map(pr => pr.id === prop.id ? { ...pr, status: newStatus } : pr));

    const { error } = await supabase
      .from("marketplace_properties")
      .update({ status: newStatus })
      .eq("id", prop.id);

    if (error) {
      setMktProps(prev); // rollback
      toast({ title: "Error al actualizar estado", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Estado actualizado", description: "El cambio se propagará a los listados de usuarios." });
    }
  };

  /**
   * Elimina una publicación del marketplace (la borra de la BD del agente).
   */
  const deleteMktProperty = async (reason: string) => {
    if (!deleteMktTarget) return;
    const id = deleteMktTarget.id;
    setMktProps(p => p.filter(prop => prop.id !== id));
    setDeleteMktTarget(null);

    const { error } = await supabase.from("marketplace_properties").delete().eq("id", id);
    if (error) {
      toast({ title: "Error al eliminar", description: error.message, variant: "destructive" });
      fetchMktProperties();
    } else {
      toast({ title: "Publicación eliminada del marketplace" });
    }
  };

  const getStatusOptions = (listingType: "rent" | "sale"): readonly string[] =>
    listingType === "sale" ? AGENT_PROPERTY_STATUSES.SALE : AGENT_PROPERTY_STATUSES.RENT;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Tabs defaultValue="marketplace" className="w-full">
      {/* TabsList responsive: texto corto en mobile, completo en desktop */}
      <TabsList className="mb-6 bg-muted rounded-xl p-1 h-auto w-full grid grid-cols-2">
        <TabsTrigger value="marketplace" className="gap-1.5 rounded-lg data-[state=active]:bg-background flex items-center justify-center">
          <Building2 className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">Publicaciones del Marketplace</span>
          <span className="sm:hidden">Marketplace</span>
          <Badge variant="secondary" className="ml-1 text-xs">{mktProps.length}</Badge>
        </TabsTrigger>
        <TabsTrigger value="usuarios" className="gap-1.5 rounded-lg data-[state=active]:bg-background flex items-center justify-center">
          <Users className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">Propiedades de Usuarios</span>
          <span className="sm:hidden">Usuarios</span>
          <Badge variant="secondary" className="ml-1 text-xs">{userProps.length}</Badge>
        </TabsTrigger>
      </TabsList>

      {/* ── TAB 1: Publicaciones del marketplace (agentes) ── */}
      <TabsContent value="marketplace">
        <p className="text-sm text-muted-foreground mb-4">
          Publicaciones ingresadas por agentes al HFMarket. Desde aquí podés cambiar el estado o eliminarlas.
          El cambio de estado se propaga automáticamente a todos los usuarios que las guardaron.
        </p>

        {loadingMkt ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : mktProps.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No hay publicaciones del marketplace.</div>
        ) : (
          <div className="space-y-2">
            {/* Desktop */}
            <div className="hidden lg:block">
              <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                <span>Título</span>
                <span>Agencia</span>
                <span>Operación</span>
                <span>Estado actual</span>
                <span>Cambiar estado</span>
                <span></span>
              </div>
              {mktProps.map(prop => {
                const color = MK_STATUS_COLORS[prop.status] || "";
                return (
                  <div key={prop.id} className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-4 py-3 rounded-xl hover:bg-muted/50 transition-colors items-center text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="truncate font-medium">{prop.title}</span>
                      {prop.url && (
                        <a href={prop.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-primary hover:text-primary/80">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground min-w-[100px] truncate">{prop.agency_name}</span>
                    <Badge variant={prop.listing_type === "sale" ? "default" : "secondary"} className="text-xs">
                      {prop.listing_type === "sale" ? "Venta" : "Alquiler"}
                    </Badge>
                    <span className={`inline-flex items-center text-xs px-2.5 py-0.5 rounded-full font-medium ${color}`}>
                      {PROPERTY_STATUS_LABELS[prop.status] || prop.status}
                    </span>
                    <Select value={prop.status} onValueChange={(v) => updateMktStatus(prop, v as MarketplaceStatus)}>
                      <SelectTrigger className="h-8 rounded-xl text-xs w-[150px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {getStatusOptions(prop.listing_type).map(s => (
                          <SelectItem key={s} value={s}>{PROPERTY_STATUS_LABELS[s] || s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleteMktTarget(prop)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>

            {/* Mobile */}
            <div className="lg:hidden space-y-3">
              {mktProps.map(prop => {
                const color = MK_STATUS_COLORS[prop.status] || "";
                return (
                  <div key={prop.id} className="rounded-xl border border-border p-4 space-y-3 bg-card">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{prop.title}</span>
                          {prop.url && (
                            <a href={prop.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-primary">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground block mt-0.5">{prop.agency_name}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Badge variant={prop.listing_type === "sale" ? "default" : "secondary"} className="text-xs">
                          {prop.listing_type === "sale" ? "Venta" : "Alquiler"}
                        </Badge>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setDeleteMktTarget(prop)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                    <span className={`inline-flex items-center text-xs px-2.5 py-0.5 rounded-full font-medium ${color}`}>
                      {PROPERTY_STATUS_LABELS[prop.status] || prop.status}
                    </span>
                    <Select value={prop.status} onValueChange={(v) => updateMktStatus(prop, v as MarketplaceStatus)}>
                      <SelectTrigger className="h-8 rounded-xl text-xs w-full"><SelectValue placeholder="Cambiar estado" /></SelectTrigger>
                      <SelectContent>
                        {getStatusOptions(prop.listing_type).map(s => (
                          <SelectItem key={s} value={s}>{PROPERTY_STATUS_LABELS[s] || s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <DeletePropertyDialog
          open={!!deleteMktTarget}
          onOpenChange={(open) => !open && setDeleteMktTarget(null)}
          onConfirm={deleteMktProperty}
          title={deleteMktTarget?.title || ""}
        />
      </TabsContent>

      {/* ── TAB 2: Propiedades de usuarios (listado personal) ── */}
      <TabsContent value="usuarios">
        <p className="text-sm text-muted-foreground mb-4">
          Propiedades guardadas por usuarios en su listado de búsqueda personal.
          El estado mostrado es el estado personal del usuario en su flujo de búsqueda.
        </p>

        {loadingUser ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : userProps.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No hay propiedades guardadas por usuarios.</div>
        ) : (
          <div className="space-y-2">
            {/* Desktop */}
            <div className="hidden lg:block">
              <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                <span>Título</span>
                <span>Usuario</span>
                <span>Operación</span>
                <span>Estado personal</span>
                <span></span>
              </div>
              {/* Muestra TODAS las propiedades — el ícono indica su visibilidad para el usuario */}
              {userProps.map(prop => {
                const cfg = STATUS_CONFIG[prop.status];
                return (
                  <div key={prop.id} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-4 py-3 rounded-xl hover:bg-muted/50 transition-colors items-center text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="truncate font-medium">{prop.title}</span>
                      {prop.url && (
                        <a href={prop.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-primary hover:text-primary/80">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground min-w-[120px] truncate block max-w-[160px]">
                      {prop.created_by_email || "—"}
                    </span>
                    <Badge variant={prop.listing_type === "sale" ? "default" : "secondary"} className="text-xs">
                      {prop.listing_type === "sale" ? "Venta" : "Alquiler"}
                    </Badge>
                    {cfg ? (
                      <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                    {/* Eye + Trash en la misma línea */}
                    <div className="flex items-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title={prop.admin_hidden ? 'Restaurar propiedad' : 'Ocultar al usuario'}
                        onClick={() => toggleHideUserProperty(prop)}
                      >
                        {prop.admin_hidden
                          ? <EyeOff className="w-4 h-4 text-red-500" />
                          : <Eye className="w-4 h-4 text-emerald-500" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleteUserTarget(prop)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mobile */}
            <div className="lg:hidden space-y-3">
              {userProps.map(prop => {
                const cfg = STATUS_CONFIG[prop.status];
                return (
                  <div key={prop.id} className="rounded-xl border border-border p-4 space-y-2 bg-card">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{prop.title}</span>
                          {prop.url && (
                            <a href={prop.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-primary">
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
                          className="h-7 w-7"
                          onClick={() => toggleHideUserProperty(prop)}
                        >
                          {prop.admin_hidden
                            ? <EyeOff className="w-3.5 h-3.5 text-red-500" />
                            : <Eye className="w-3.5 h-3.5 text-emerald-500" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setDeleteUserTarget(prop)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                    {cfg && (
                      <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <DeletePropertyDialog
          open={!!deleteUserTarget}
          onOpenChange={(open) => !open && setDeleteUserTarget(null)}
          onConfirm={deleteUserProperty}
          title={deleteUserTarget?.title || ""}
        />
      </TabsContent>
    </Tabs>
  );
}
