/**
 * ARCHIVO: AdminPublicaciones.tsx
 * Controla publicaciones del marketplace (agent_publications) y user_listings.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/contexts/AuthProvider";
import { Building2, Users, RefreshCw, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserProperty, MktProperty, MarketplaceStatus } from "@/types/admin-publications";

import { MarketplaceTab } from "./publicaciones/MarketplaceTab";
import { UsuariosTab } from "./publicaciones/UsuariosTab";
import { AddPropertyModal } from "../AddPropertyModal";
import { usePropertyMutations } from "@/hooks/usePropertyMutations";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { useImportActions } from "@/store/useImportStore";
import { useAgents } from "@/hooks/useAgents";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  toast: (opts: { title: string; description?: string; variant?: "default" | "destructive" }) => void;
}

export function AdminPublicaciones({ toast }: Props) {
  const { user: authUser } = useCurrentUser();
  const [userProps, setUserProps] = useState<UserProperty[]>([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [deleteUserTarget, setDeleteUserTarget] = useState<UserProperty | null>(null);

  const [mktProps, setMktProps] = useState<MktProperty[]>([]);
  const [loadingMkt, setLoadingMkt] = useState(true);
  const [deleteMktTarget, setDeleteMktTarget] = useState<MktProperty | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Importador masivo — selección de agente destino
  const { openModal: openImporter } = useImportActions();
  const { data: agents = [] } = useAgents();
  const [selectedImportAgentId, setSelectedImportAgentId] = useState<string>("");

  const selectedAgent = agents.find(a => a.id === selectedImportAgentId);
  const canImport = Boolean(selectedAgent?.org_id);

  const { addProperty: addPropertyMutation } = usePropertyMutations();

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

        // Obtener la info de la agencia origen para las que vinieron del market
        const sourceIds = [...new Set(listings.map((d: { source_publication_id?: string }) => d.source_publication_id).filter(Boolean))];
        let mktOrgsMap: Record<string, {name: string, isAgency: boolean}> = {};
        if (sourceIds.length > 0) {
            const { data: pubsData } = await supabase
                .from("agent_publications")
                .select("id, organizations(name, type)")
                // @ts-ignore
                .in("id", sourceIds);
            
            pubsData?.forEach((pub: any) => {
                mktOrgsMap[pub.id] = {
                    name: pub.organizations?.name || "Desconocida",
                    isAgency: pub.organizations?.type === "agency_team"
                };
            });
        }

        setUserProps(listings.map((d: any) => {
          const mktInfo = d.source_publication_id ? mktOrgsMap[d.source_publication_id] : null;

          return {
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
            orgName: mktInfo?.name || "",
            isAgency: mktInfo?.isAgency ?? false,
          };
        }));
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
        /** Ahora MarketplaceStatus === AgentPubStatus (español), no necesita mapeo */
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
            status: (p.status || "disponible") as MarketplaceStatus,
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

  /** Filtrado Multidimensional (REGLA 2: Lógica centralizada) */
  const filteredUserProps = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return userProps;
    return userProps.filter(p => 
        p.title?.toLowerCase().includes(q) ||
        p.url?.toLowerCase().includes(q) ||
        p.ref?.toLowerCase().includes(q) ||
        p.orgName?.toLowerCase().includes(q) ||
        p.created_by_email?.toLowerCase().includes(q)
    );
  }, [userProps, searchQuery]);

  const filteredMktProps = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return mktProps;
    return mktProps.filter(p => 
        p.title?.toLowerCase().includes(q) ||
        p.url?.toLowerCase().includes(q) ||
        p.ref?.toLowerCase().includes(q) ||
        p.orgName?.toLowerCase().includes(q) ||
        p.publishedByName?.toLowerCase().includes(q)
    );
  }, [mktProps, searchQuery]);

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
    setDeleteUserTarget(null);

    // Registrar en auditoría ANTES de borrar
    const { error: auditError } = await supabase
      .from("publication_deletion_audit_log")
      .insert({
        pub_id: id,
        property_title: `[LISTADO] ${title}`,
        org_name: null,
        reason: _reason || "Sin motivo especificado",
        deleted_by: authUser?.id,
      });

    if (auditError) {
      toast({ title: "Error al registrar auditoría", description: auditError.message, variant: "destructive" });
      return;
    }

    const { error } = await (supabase.from("user_listings") as any).delete().eq("id", id);
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
          await (supabase.from("properties") as any).delete().eq("id", propertyId);
        }
      }
      setUserProps(p => p.filter(prop => prop.id !== id));
      toast({ title: "Listado y propiedad eliminados permanentemente" });
    }
  };

  const updateMktStatus = async (prop: MktProperty, newStatus: MarketplaceStatus) => {
    const prev = mktProps;
    setMktProps(p => p.map(pr => pr.id === prop.id ? { ...pr, status: newStatus } : pr));

    // MarketplaceStatus ahora es AgentPubStatus (español) — sin mapeo
    const { error } = await supabase
      .from("agent_publications")
      .update({ status: newStatus as any })
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
    setMktProps(p => p.filter(prop => prop.id !== id));
    setDeleteMktTarget(null);

    // Registrar en auditoría ANTES de borrar — si falla el log el borrado no ocurre
    const { error: auditError } = await supabase
      .from("publication_deletion_audit_log")
      .insert({
        pub_id: id,
        property_title: `[MARKET] ${title}`,
        org_name: orgName || null,
        reason: _reason || "Sin motivo especificado",
        deleted_by: authUser?.id,
      });

    if (auditError) {
      toast({ title: "Error al registrar auditoría", description: auditError.message, variant: "destructive" });
      return; // No borrar si falla el log
    }

    const propertyId = deleteMktTarget.property_id;

    const { error } = await (supabase.from("agent_publications") as any).delete().eq("id", id);
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
          await (supabase.from("properties") as any).delete().eq("id", propertyId);
        }
      }
      toast({ title: "Publicación eliminada del marketplace" });
    }
  };

  const handleAddProperty = async (form: any) => {
    try {
      const { _successMessage, ...formWithoutMeta } = form;
      await addPropertyMutation(formWithoutMeta);
      setIsAddOpen(false);
      toast({ title: "Éxito", description: _successMessage || "Propiedad agregada correctamente" });
      handleRefresh(); // Refrescar listas para ver la nueva
    } catch (e: unknown) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Error desconocido", variant: "destructive" });
      throw e;
    }
  };

  return (
    <>
    <Tabs defaultValue="marketplace" className="w-full">
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap lg:flex-nowrap">
        <TabsList className="bg-muted rounded-xl p-1 h-auto shrink-0 grid grid-cols-2 w-full lg:w-fit">
          <TabsTrigger value="marketplace" className="gap-1.5 rounded-lg data-[state=active]:bg-background flex items-center justify-center px-4">
            <Building2 className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Marketplace</span>
            <Badge variant="secondary" className="ml-1 text-[10px]">{filteredMktProps.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="usuarios" className="gap-1.5 rounded-lg data-[state=active]:bg-background flex items-center justify-center px-4">
            <Users className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Usuarios</span>
            <Badge variant="secondary" className="ml-1 text-[10px]">{filteredUserProps.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 relative min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por Título, Agencia, Agente o URL..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-xl pl-9 border-muted-foreground/20 h-10 w-full"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            title="Refrescar datos"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 h-10 w-10 flex items-center justify-center rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground border border-border disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 shrink-0 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>

          {/* Importador masivo: selector de agente + botón */}
          <Select value={selectedImportAgentId} onValueChange={setSelectedImportAgentId}>
            <SelectTrigger className="w-[180px] h-10 rounded-xl text-xs">
              <SelectValue placeholder="Agente destino…" />
            </SelectTrigger>
            <SelectContent>
              {agents.map(a => (
                <SelectItem key={a.id} value={a.id} className="text-xs">
                  {a.display_name || a.email || "Sin nombre"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 h-10 rounded-xl"
            disabled={!canImport}
            onClick={openImporter}
            title={canImport ? "Importar avisos masivos" : "Seleccioná un agente primero"}
          >
            <Globe className="w-4 h-4" /> Importar desde web
          </Button>

          <Button 
            onClick={() => setIsAddOpen(true)}
            size="sm"
            className="rounded-xl gap-2 font-bold shadow-md shadow-primary/10 h-10 px-4"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden md:inline">Agregar Propiedad</span>
            <span className="md:hidden">Agregar</span>
          </Button>
        </div>
      </div>

      <MarketplaceTab
        mktProps={filteredMktProps}
        loadingMkt={loadingMkt}
        updateMktStatus={updateMktStatus}
        deleteMktTarget={deleteMktTarget}
        setDeleteMktTarget={setDeleteMktTarget}
        deleteMktProperty={deleteMktProperty}
      />

      <UsuariosTab
        userProps={filteredUserProps}
        loadingUser={loadingUser}
        toggleHideUserProperty={toggleHideUserProperty}
        deleteUserTarget={deleteUserTarget}
        setDeleteUserTarget={setDeleteUserTarget}
        deleteUserProperty={deleteUserProperty}
      />
    </Tabs>

    <AddPropertyModal 
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAdd={handleAddProperty}
    />
    </>
  );
}
