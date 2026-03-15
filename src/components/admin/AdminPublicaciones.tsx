/**
 * ARCHIVO: AdminPublicaciones.tsx
 * Controla publicaciones del marketplace (agent_publications) y user_listings.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Building2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserProperty, MktProperty, MarketplaceStatus } from "@/types/admin-publications";

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

  useEffect(() => {
    fetchUserProperties();
    fetchMktProperties();
  }, []);

  const fetchUserProperties = async () => {
    setLoadingUser(true);
    try {
      const { data, error } = await supabase
        .from("user_listings")
        .select("id, current_status, listing_type, created_at, org_id, source_publication_id, properties(id, title, source_url)")
        .order("created_at", { ascending: false });

      if (error) {
        toast({ title: "Error al cargar listados de usuarios", description: error.message, variant: "destructive" });
      } else {
        setUserProps((data || []).map((d: any) => ({
          id: d.id,
          title: d.properties?.title || "Sin título",
          url: d.properties?.source_url || "",
          status: d.current_status,
          created_by_email: "",
          source_marketplace_id: d.source_publication_id,
          listing_type: d.listing_type,
          created_at: d.created_at,
          admin_hidden: false,
        })));
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setLoadingUser(false);
  };

  const fetchMktProperties = async () => {
    setLoadingMkt(true);
    try {
      const { data, error } = await supabase
        .from("agent_publications")
        .select("id, status, listing_type, created_at, description, views_count, properties(title, source_url), organizations(name)")
        .order("created_at", { ascending: false });

      if (error) {
        toast({ title: "Error al cargar publicaciones del marketplace", description: error.message, variant: "destructive" });
      } else {
        setMktProps(
          (data || []).map((p: any) => ({
            id: p.id,
            title: p.properties?.title || "Sin título",
            url: p.properties?.source_url || "",
            status: p.status as MarketplaceStatus,
            listing_type: p.listing_type,
            created_at: p.created_at,
            orgName: p.organizations?.name || "Organización",
          }))
        );
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setLoadingMkt(false);
  };

  const toggleHideUserProperty = async (prop: UserProperty) => {
    // In new schema, we delete the listing instead of hiding
    const { error } = await supabase
      .from("user_listings")
      .delete()
      .eq("id", prop.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setUserProps(p => p.filter(pr => pr.id !== prop.id));
      toast({ title: "Listado eliminado" });
    }
  };

  const deleteUserProperty = async (_reason: string) => {
    if (!deleteUserTarget) return;
    const id = deleteUserTarget.id;
    const title = deleteUserTarget.title;
    setUserProps(p => p.filter(prop => prop.id !== id));
    setDeleteUserTarget(null);

    // Obtener el admin que ejecuta la acción para el log de auditoría
    const { data: { user: adminUser } } = await supabase.auth.getUser();

    // Registrar en auditoría ANTES de borrar — si falla el log el borrado no ocurre
    const { error: auditError } = await supabase
      .from("publication_deletion_audit_log" as any)
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
      return; // No borrar si falla el log
    }

    const { error } = await supabase.from("user_listings").delete().eq("id", id);
    if (error) {
      toast({ title: "Error al eliminar", description: error.message, variant: "destructive" });
      fetchUserProperties();
    } else {
      toast({ title: "Listado eliminado permanentemente" });
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
      .update({ status: statusMap[newStatus] as any })
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
      .from("publication_deletion_audit_log" as any)
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

    const { error } = await supabase.from("agent_publications").delete().eq("id", id);
    if (error) {
      toast({ title: "Error al eliminar", description: error.message, variant: "destructive" });
      fetchMktProperties();
    } else {
      toast({ title: "Publicación eliminada del marketplace" });
    }
  };

  return (
    <Tabs defaultValue="marketplace" className="w-full">
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
