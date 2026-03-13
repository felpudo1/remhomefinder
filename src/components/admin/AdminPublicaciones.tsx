/**
 * ARCHIVO: AdminPublicaciones.tsx
 * DESCRIPCIÓN: El gran cerebro del Administrador para controlar publicaciones.
 * Se encarga de pedir todos los datos de la base (avisos, fotos, votos, calificaciones)
 * y armar una lista maestra simplificada para que sea fácil analizar el mercado.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Building2, Users } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserProperty, MktProperty, StatProperty, MarketplaceStatus } from "@/types/admin-publications";

import { MarketplaceTab } from "./publicaciones/MarketplaceTab";
import { UsuariosTab } from "./publicaciones/UsuariosTab";

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
      .is("source_marketplace_id", null) // 👈 Solo mostrar propiedades de usuarios (no compartidas por agentes)
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
      .update({ status: newStatus } as any)
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
      <TabsList className="mb-6 bg-muted rounded-xl p-1 h-auto w-full grid grid-cols-2">
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
    </Tabs>
  );
}
