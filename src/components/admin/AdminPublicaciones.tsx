import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ExternalLink, Trash2, Users, Building2, EyeOff, Eye, BarChart3, Star, ChevronUp, ChevronDown, MapPin, DollarSign, Maximize2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { STATUS_CONFIG, type PropertyStatus } from "@/types/property";
import { PROPERTY_STATUS_LABELS, AGENT_PROPERTY_STATUSES } from "@/lib/constants";
import { DeletePropertyDialog } from "@/components/property/DeletePropertyDialog";

import { MarketplaceTab } from "./publicaciones/MarketplaceTab";
import { UsuariosTab } from "./publicaciones/UsuariosTab";
import { EstadisticasTab } from "./publicaciones/EstadisticasTab";
import { UserProperty, MktProperty, StatProperty, MarketplaceStatus } from "@/types/admin-publications";

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

  // Estado para estadísticas unificadas
  const [statProps, setStatProps] = useState<StatProperty[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [sortConfig, setSortConfig] = useState<{ key: keyof StatProperty; direction: 'asc' | 'desc' }>({
    key: 'created_at',
    direction: 'desc'
  });

  useEffect(() => {
    fetchUserProperties();
    fetchMktProperties();
    fetchAllStats();
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
   * Carga TODAS las propiedades con sus estadísticas de calificación.
   * Lógica PRO: Separa rating SOCIAL (Agencias) de rating FAMILIAR (Usuarios).
   */
  const fetchAllStats = async () => {
    setLoadingStats(true);
    try {
      const [mktRes, userRes, ratingsRes] = await Promise.all([
        supabase.from("marketplace_properties").select("*, agencies(name)"),
        supabase.from("properties").select("*"),
        supabase.from("property_ratings" as any).select("*") as any,
      ]);

      if (mktRes.error) throw mktRes.error;
      if (userRes.error) throw userRes.error;
      if (ratingsRes.error) throw ratingsRes.error;

      const mktData = mktRes.data || [];
      const userData = userRes.data || [];
      const ratingsData: any[] = ratingsRes.data || [];

      // 1. Mapeo de propiedades de usuario a su origen de marketplace
      const propToMktMap: Record<string, string> = {};
      userData.forEach(p => {
        if (p.source_marketplace_id) propToMktMap[p.id] = p.source_marketplace_id;
      });

      // 2. Agregación diferenciada
      const globalMktStats: Record<string, { sum: number, count: number }> = {};
      const familyStats: Record<string, { sum: number, count: number }> = {};

      ratingsData.forEach(r => {
        // ¿Este voto pertenece a algo de marketplace (directo o copia)?
        const mktId = propToMktMap[r.property_id] || (mktData.some(m => m.id === r.property_id) ? r.property_id : null);

        if (mktId) {
          if (!globalMktStats[mktId]) globalMktStats[mktId] = { sum: 0, count: 0 };
          globalMktStats[mktId].sum += r.rating;
          globalMktStats[mktId].count++;
        }

        // Siempre guardamos el rating específico para la vista familiar
        if (!familyStats[r.property_id]) familyStats[r.property_id] = { sum: 0, count: 0 };
        familyStats[r.property_id].sum += r.rating;
        familyStats[r.property_id].count++;
      });

      const unified: StatProperty[] = [
        ...mktData.map((p: any) => {
          const stats = globalMktStats[p.id];
          return {
            id: p.id,
            title: p.title,
            creator: p.agencies?.name || "Agencia",
            type: "agency" as const,
            listing_type: p.listing_type,
            neighborhood: p.neighborhood,
            city: p.city,
            total_cost: p.total_cost,
            sq_meters: p.sq_meters,
            rooms: p.rooms,
            status: p.status,
            average_rating: stats ? stats.sum / stats.count : 0,
            total_votes: stats ? stats.count : 0,
            views_count: p.views_count || 0,
            cr: p.views_count > 0 ? (stats ? stats.count : 0) / p.views_count * 100 : 0,
            created_at: p.created_at,
            url: p.url,
          };
        }),
        ...userData.map((p: any) => {
          const stats = familyStats[p.id];
          return {
            id: p.id,
            title: p.title,
            creator: p.created_by_email,
            type: "user" as const,
            listing_type: p.listing_type,
            neighborhood: p.neighborhood,
            city: p.city,
            total_cost: p.total_cost,
            sq_meters: p.sq_meters,
            rooms: p.rooms,
            status: p.status,
            average_rating: stats ? stats.sum / stats.count : 0,
            total_votes: stats ? stats.count : 0,
            views_count: p.views_count || 0,
            cr: p.views_count > 0 ? (stats ? stats.count : 0) / p.views_count * 100 : 0,  // Para usuarios (guardados directos) este número podría tener lógicas distintas si quisiéramos. Usamos total_votes temporalmente como proxy de interés si aplica.
            created_at: p.created_at,
            url: p.url,
          };
        })
      ];

      setStatProps(unified);
    } catch (e: any) {
      toast({ title: "Error en estadísticas", description: e.message, variant: "destructive" });
    } finally {
      setLoadingStats(false);
    }
  };

  const handleSort = (key: keyof StatProperty) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedStats = [...statProps].sort((a, b) => {
    const aVal = a[sortConfig.key];
    const bVal = b[sortConfig.key];

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortConfig.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
    }
    return 0;
  });

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



  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Tabs defaultValue="marketplace" className="w-full">
      {/* TabsList responsive */}
      <TabsList className="mb-6 bg-muted rounded-xl p-1 h-auto w-full grid grid-cols-3">
        <TabsTrigger value="marketplace" className="gap-1.5 rounded-lg data-[state=active]:bg-background flex items-center justify-center">
          <Building2 className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">Marketplace</span>
          <Badge variant="secondary" className="ml-1 text-xs">{mktProps.length}</Badge>
        </TabsTrigger>
        <TabsTrigger value="usuarios" className="gap-1.5 rounded-lg data-[state=active]:bg-background flex items-center justify-center">
          <Users className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">Usuarios</span>
          <Badge variant="secondary" className="ml-1 text-xs">{userProps.length}</Badge>
        </TabsTrigger>
        <TabsTrigger value="estadisticas" className="gap-1.5 rounded-lg data-[state=active]:bg-background flex items-center justify-center">
          <BarChart3 className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">Estadísticas</span>
          <Badge variant="secondary" className="ml-1 text-xs">{statProps.length}</Badge>
        </TabsTrigger>
      </TabsList>

      {/* ── TAB 1: Publicaciones del marketplace (agentes) ── */}
      <MarketplaceTab
        mktProps={mktProps}
        loadingMkt={loadingMkt}
        updateMktStatus={updateMktStatus}
        deleteMktTarget={deleteMktTarget}
        setDeleteMktTarget={setDeleteMktTarget}
        deleteMktProperty={deleteMktProperty}
      />

      {/* ── TAB 2: Propiedades de usuarios (listado personal) ── */}
      <UsuariosTab
        userProps={userProps}
        loadingUser={loadingUser}
        toggleHideUserProperty={toggleHideUserProperty}
        deleteUserTarget={deleteUserTarget}
        setDeleteUserTarget={setDeleteUserTarget}
        deleteUserProperty={deleteUserProperty}
      />

      {/* ── TAB 3: Estadísticas / Auditoría ── */}
      <EstadisticasTab
        statProps={statProps}
        loadingStats={loadingStats}
        fetchAllStats={fetchAllStats}
        sortConfig={sortConfig}
        handleSort={handleSort}
        sortedStats={sortedStats}
      />
    </Tabs>
  );
}
