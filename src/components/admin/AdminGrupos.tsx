import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, Search, Users, Building2, Network, RefreshCw } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface OrgRow {
  id: string;
  name: string;
  description: string;
  type: string;
  created_at: string;
  is_personal: boolean;
  invite_code: string;
  created_by: string;
  parent_id: string | null;
  has_agency_member?: boolean;
  members?: Array<{
    membership_id: string;
    user_id: string;
    role: string;
    display_name: string;
    plan_type: string;
  }>;
}

interface Props {
  toast: any;
}

export function AdminGrupos({ toast }: Props) {
  const [orgs, setOrgs] = useState<OrgRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<OrgRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  const fetchOrgs = async () => {
    setLoading(true);
    try {
      // Fetch organizations
      const { data: orgsData, error: orgsError } = await supabase
        .from("organizations")
        .select("*")
        .eq("is_personal", false)
        .order("created_at", { ascending: false });

      if (orgsError) throw orgsError;

      const orgsList = (orgsData as OrgRow[]) || [];

      // Fetch all members for these orgs
      if (orgsList.length > 0) {
        const orgIds = orgsList.map(o => o.id);
        const { data: membersData, error: membersError } = await supabase
          .from("organization_members")
          .select("id, org_id, user_id, role")
          .in("org_id", orgIds);

        if (membersError) throw membersError;

        // Fetch profiles for these members to get names and plans
        const userIds = [...new Set(membersData.map(m => m.user_id))];
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("user_id, display_name, plan_type")
          .in("user_id", userIds);

        if (profilesError) throw profilesError;

        const profileMap = new Map(profilesData.map(p => [p.user_id, p]));

        // Cargar roles globales para saber si una agencia debe mostrarse.
        const { data: userRolesData, error: rolesError } = await supabase
          .from("user_roles")
          .select("user_id, role")
          .in("user_id", userIds);

        if (rolesError) throw rolesError;

        const globalRolesMap = new Map<string, Set<string>>();
        (userRolesData || []).forEach((r) => {
          if (!globalRolesMap.has(r.user_id)) globalRolesMap.set(r.user_id, new Set<string>());
          globalRolesMap.get(r.user_id)?.add(r.role);
        });

        // Attach members to orgs
        const enrichedOrgs = orgsList.map(org => {
          const orgMembers = membersData
            .filter(m => m.org_id === org.id)
            .map(m => {
              const profile = profileMap.get(m.user_id);
              return {
                membership_id: m.id,
                user_id: m.user_id,
                role: m.role,
                display_name: profile?.display_name || "Sin nombre",
                plan_type: profile?.plan_type || "free"
              };
            });
          const hasAgencyMember = orgMembers.some((m) => {
            const roles = globalRolesMap.get(m.user_id);
            return Boolean(roles?.has("agency"));
          });
          return { ...org, members: orgMembers, has_agency_member: hasAgencyMember };
        });

        // Si una agencia no tiene ningún integrante con rol global "agency",
        // no debe aparecer en este listado administrativo.
        const visibleOrgs = enrichedOrgs.filter((org) =>
          org.type !== "agency_team" || org.has_agency_member
        );

        setOrgs(visibleOrgs);
      } else {
        setOrgs([]);
      }
    } catch (error: unknown) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Error desconocido", variant: "destructive" });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrgs();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      // First delete all members
      const { error: memErr } = await supabase
        .from("organization_members")
        .delete()
        .eq("org_id", deleteTarget.id);
      if (memErr) throw memErr;

      // Then delete the org
      const { error } = await supabase
        .from("organizations")
        .delete()
        .eq("id", deleteTarget.id);
      if (error) throw error;

      toast({ title: "Grupo eliminado", description: `"${deleteTarget.name}" fue eliminado.` });
      setDeleteTarget(null);
      fetchOrgs();
    } catch (e: unknown) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Error desconocido", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  /**
   * Remueve un integrante puntual de una organización.
   * Se usa desde el listado para gestionar miembros sin borrar todo el grupo.
   */
  const handleRemoveMember = async (membershipId: string) => {
    setRemovingMemberId(membershipId);
    try {
      const { error } = await supabase
        .from("organization_members")
        .delete()
        .eq("id", membershipId);

      if (error) throw error;

      toast({ title: "Integrante eliminado", description: "El integrante fue removido del grupo/agencia." });
      await fetchOrgs();
    } catch (e: unknown) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Error desconocido", variant: "destructive" });
    } finally {
      setRemovingMemberId(null);
    }
  };

  const filtered = orgs.filter((o) =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    o.type.toLowerCase().includes(search.toLowerCase())
  );

  const typeIcon = (type: string) => {
    if (type === "agency_team") return <Building2 className="w-4 h-4 text-primary" />;
    if (type === "sub_team") return <Network className="w-4 h-4 text-accent-foreground" />;
    return <Users className="w-4 h-4 text-muted-foreground" />;
  };

  const typeLabel = (type: string) => {
    if (type === "agency_team") return "Agencia";
    if (type === "sub_team") return "Equipo";
    return "Familia";
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o tipo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl"
          />
        </div>
        <Badge variant="outline" className="shrink-0">
          {filtered.length} {filtered.length === 1 ? "grupo" : "grupos"}
        </Badge>
        <button
          title="Refrescar datos"
          onClick={async () => {
            setIsRefreshing(true);
            await fetchOrgs();
            setIsRefreshing(false);
          }}
          className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground border border-border"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No se encontraron grupos.</p>
        ) : (
          filtered.map((org) => (
            <div
              key={org.id}
              className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-background"
            >
              <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                {typeIcon(org.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{org.name}</p>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                    {typeLabel(org.type)}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {org.description || "Sin descripción"} · Código: {org.invite_code}
                </p>
                {org.members && org.members.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Integrantes:</p>
                    <div className="flex flex-wrap gap-2">
                      {org.members.map((m) => (
                        <div key={m.user_id} className="flex items-center gap-1.5 bg-muted/50 px-2 py-0.5 rounded-md border border-border/50">
                          <span className="text-[11px] font-medium text-foreground">{m.display_name}</span>
                          <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 bg-background font-normal border-primary/20 text-primary">
                            {m.plan_type}
                          </Badge>
                          <span className="text-[9px] text-muted-foreground/70 italic">({m.role})</span>
                          <button
                            title="Eliminar integrante"
                            onClick={() => handleRemoveMember(m.membership_id)}
                            disabled={removingMemberId === m.membership_id}
                            className="ml-1 text-destructive hover:text-destructive/80 disabled:opacity-50"
                          >
                            {removingMemberId === m.membership_id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Trash2 className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setDeleteTarget(org)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar grupo</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de eliminar <strong>"{deleteTarget?.name}"</strong>? Se eliminarán todos los miembros y datos asociados. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
