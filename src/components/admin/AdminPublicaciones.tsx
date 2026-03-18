/**
 * ARCHIVO: AdminPublicaciones.tsx
 * Controla publicaciones del marketplace (agent_publications) y user_listings.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Building2, Users, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserProperty, MktProperty, MarketplaceStatus } from "@/types/admin-publications";
import type { AgentPubStatus } from "@/types/supabase";

import { MarketplaceTab } from "./publicaciones/MarketplaceTab";
import { UsuariosTab } from "./publicaciones/UsuariosTab";

interface Props {
  toast: (opts: { title: string; description?: string; variant?: "default" | "destructive" }) => void;
}

export function AdminPublicaciones({ toast }: Props) {
  const [userProps, setUserProps] = useState<UserProperty[]>([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [deleteUserTarget, setDeleteUserTarget] = useState<UserProperty | null>(null);

  const [mktProps, setMktProps] = useState<MktProperty[]>([]);
  const [loadingMkt, setLoadingMkt] = useState(true);
  const [deleteMktTarget, setDeleteMktTarget] = useState<MktProperty | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchUserProperties(), fetchMktProperties()]);
    setIsRefreshing(false);
  };

  useEffect(() => {
    fetchUserProperties();
    fetchMktProperties();
  }, []);

  const fetchUserProperties = async () => {
    setLoadingUser(true);
    try {
      const { data, error } = await supabase
        .from("user_listings")
        .select("id, current_status, listing_type, created_at, org_id, source_publication_id, admin_hidden, property_id, added_by, properties(id, title, source_url, ref)")
        .order("created_at", { ascending: false });

      if (error) {
        toast({ title: "Error al cargar listados de usuarios", description: error.message, variant: "destructive" });
      } else {
        const listings = data || [];
        const addedByIds = [...new Set(listings.map((d: { added_by?: string }) => d.added_by).filter(Boolean))];
        let addedByMap: Record<string, string> = {};
        if (addedByIds.length > 0) {
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("user_id, display_name, email")
            .in("user_id", addedByIds);
          profilesData?.forEach((pr) => {
            addedByMap[pr.user_id] = pr.display_name || pr.email || "Usuario";
          });
        }
        setUserProps(listings.map((d: any) => ({
          id: d.id,
          title: d.properties?.title || "Sin título",
          url: d.properties?.source_url || "",
          status: d.current_status,
          created_by_email: addedByMap[d.added_by || ""] || "—",
          source_marketplace_id: d.source_publication_id,
          listing_type: d.listing_type,
          created_at: d.created_at,
          admin_hidden: d.admin_hidden ?? false,
          property_id: d.property_id,
          ref: d.properties?.ref || "",
        })));
      }
    } catch (e: unknown) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Error desconocido", variant: "destructive" });
    }
    setLoadingUser(false);
  };

  const fetchMktProperties = async () => {
    setLoadingMkt(true);
    try {
      const { data, error } = await supabase
        .from("agent_publications")
        .select("id, property_id, status, listing_type, created_at, description, views_count, published_by, properties(title, source_url, ref), organizations(name)")
        .order("created_at", { ascending: false });

      if (error) {
        toast({ title: "Error al cargar publicaciones del marketplace", description: error.message, variant: "destructive" });
      } else {
        /** Mapea agent_pub_status (DB) a MarketplaceStatus (UI) para que el Select muestre el valor correcto */
        const dbToUiStatus: Record<string, MarketplaceStatus> = {
          disponible: "active",
          pausado: "paused",
          reservado: "reserved",
          vendido: "sold",
          alquilado: "rented",
          eliminado: "deleted",
        };
        const publisherIds = [...new Set((data || []).map((d: { published_by?: string }) => d.published_by).filter(Boolean))];
        let publishedByMap: Record<string, string> = {};
        if (publisherIds.length > 0) {
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("user_id, display_name, email")
            .in("user_id", publisherIds);
          profilesData?.forEach((pr) => {
            publishedByMap[pr.user_id] = pr.display_name || pr.email || "Agente";
          });
        }
        setMktProps(
          (data || []).map((p: any) => ({
            id: p.id,
            title: p.properties?.title || "Sin título",
            url: p.properties?.source_url || "",
            status: dbToUiStatus[p.status] ?? (p.status as MarketplaceStatus),
            listing_type: p.listing_type,
            created_at: p.created_at,
            orgName: p.organizations?.name || "Organización",
            publishedByName: p.published_by ? publishedByMap[p.published_by] || "—" : "—",
            ref: p.properties?.ref || "",
            property_id: p.property_id,
          }))
        );
      }
    } catch (e: unknown) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Error desconocido", variant: "destructive" });
    }
    setLoadingMkt(false);
  };

  const toggleHideUserProperty = async (prop: UserProperty) => {
    // Toggle admin_hidden: oculta el listing al usuario SIN borrarlo del listado del admin
    const newHiddenState = !prop.admin_hidden;

    // Actualizar optimisticamente el estado local para respuesta inmediata en UI
    setUserProps(p => p.map(pr => pr.id === prop.id ? { ...pr, admin_hidden: newHiddenState } : pr));

    const { error } = await supabase
      .from("user_listings")
      .update({ admin_hidden: newHiddenState })
      .eq("id", prop.id);

    if (error) {
      // Revertir el cambio optimista si falla
      setUserProps(p => p.map(pr => pr.id === prop.id ? { ...pr, admin_hidden: !newHiddenState } : pr));
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: newHiddenState ? "Listado oculto" : "Listado restaurado",
        description: newHiddenState
          ? "El usuario ya no verá esta propiedad en su lista."
          : "La propiedad volvió a ser visible para el usuario.",
      });
    }
  };

  const deleteUserProperty = async (_reason: string) => {
    if (!deleteUserTarget) return;
    const id = deleteUserTarget.id;
    const title = deleteUserTarget.title;
    const snapshot = [...userProps];
    setDeleteUserTarget(null);

    // Obtener el admin que ejecuta la acción para el log de auditoría
    const { data: { user: adminUser } } = await supabase.auth.getUser();

    // Registrar en auditoría ANTES de borrar
    const { error: auditError } = await supabase
      .from("publication_deletion_audit_log")
      .insert({
        pub_id: id,
        pub_type: "user_listing",
        title: title,
        org_name: null,
        status_before: deleteUserTarget.status,
        reason: _reason || "Sin motivo especificado",
        deleted_by: adminUser?.id,
      });

    if (auditError) {
      toast({ title: "Error al registrar auditoría", description: auditError.message, variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("user_listings").delete().eq("id", id);
    if (error) {
      toast({ title: "Error al eliminar", description: error.message, variant: "destructive" });
    } else {
      // Borrar la property huérfana si ya no tiene más referencias
      const propertyId = deleteUserTarget.property_id;
      if (propertyId) {
        // Verificar que no haya otros user_listings o agent_publications referenciando esta property
        const { count: listingsCount } = await supabase
          .from("user_listings")
          .select("id", { count: "exact", head: true })
          .eq("property_id", propertyId);

        const { count: pubsCount } = await supabase
          .from("agent_publications")
          .select("id", { count: "exact", head: true })
          .eq("property_id", propertyId);

        if ((listingsCount ?? 0) === 0 && (pubsCount ?? 0) === 0) {
          await supabase.from("properties").delete().eq("id", propertyId);
        }
      }
      setUserProps(p => p.filter(prop => prop.id !== id));
      toast({ title: "Listado y propiedad eliminados permanentemente" });
    }
  };

  const updateMktStatus = async (prop: MktProperty, newStatus: MarketplaceStatus) => {
    const prev = mktProps;
    setMktProps(p => p.map(pr => pr.id === prop.id ? { ...pr, status: newStatus } : pr));

    // Map MarketplaceStatus to agent_pub_status enum
    const statusMap: Record<MarketplaceStatus, string> = {
      active: "disponible",
      paused: "pausado",
      sold: "vendido",
      reserved: "reservado",
      rented: "alquilado",
      deleted: "eliminado",
    };

    const { error } = await supabase
      .from("agent_publications")
      .update({ status: statusMap[newStatus] as AgentPubStatus })
      .eq("id", prop.id);

    if (error) {
      setMktProps(prev);
      toast({ title: "Error al actualizar estado", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Estado actualizado" });
    }
  };

  const deleteMktProperty = async (_reason: string) => {
    if (!deleteMktTarget) return;
    const id = deleteMktTarget.id;
    const title = deleteMktTarget.title;
    const orgName = deleteMktTarget.orgName;
    const statusBefore = deleteMktTarget.status;
    setMktProps(p => p.filter(prop => prop.id !== id));
    setDeleteMktTarget(null);

    // Obtener el admin que ejecuta la acción para el log de auditoría
    const { data: { user: adminUser } } = await supabase.auth.getUser();

    // Registrar en auditoría ANTES de borrar — si falla el log el borrado no ocurre
    const { error: auditError } = await supabase
      .from("publication_deletion_audit_log")
      .insert({
        pub_id: id,
        pub_type: "marketplace",
        title: title,
        org_name: orgName || null,
        status_before: statusBefore,
        reason: _reason || "Sin motivo especificado",
        deleted_by: adminUser?.id,
      });

    if (auditError) {
      toast({ title: "Error al registrar auditoría", description: auditError.message, variant: "destructive" });
      return; // No borrar si falla el log
    }

    const propertyId = deleteMktTarget.property_id;

    const { error } = await supabase.from("agent_publications").delete().eq("id", id);
    if (error) {
      toast({ title: "Error al eliminar", description: error.message, variant: "destructive" });
      fetchMktProperties();
    } else {
      // Borrar la property huérfana si ya no tiene más referencias (igual que en deleteUserProperty)
      if (propertyId) {
        const { count: listingsCount } = await supabase
          .from("user_listings")
          .select("id", { count: "exact", head: true })
          .eq("property_id", propertyId);

        const { count: pubsCount } = await supabase
          .from("agent_publications")
          .select("id", { count: "exact", head: true })
          .eq("property_id", propertyId);

        if ((listingsCount ?? 0) === 0 && (pubsCount ?? 0) === 0) {
          await supabase.from("properties").delete().eq("id", propertyId);
        }
      }
      toast({ title: "Publicación eliminada del marketplace" });
    }
  };

  return (
    <Tabs defaultValue="marketplace" className="w-full">
      <div className="flex items-center justify-between gap-4 mb-6">
        <TabsList className="bg-muted rounded-xl p-1 h-auto flex-1 grid grid-cols-2">
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
        <button
          title="Refrescar datos"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground border border-border disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      <MarketplaceTab
        mktProps={mktProps}
        loadingMkt={loadingMkt}
        updateMktStatus={updateMktStatus}
        deleteMktTarget={deleteMktTarget}
        setDeleteMktTarget={setDeleteMktTarget}
        deleteMktProperty={deleteMktProperty}
      />

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
