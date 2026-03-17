import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, Search, Users, Building2, Network, RefreshCw, UserPlus } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  members?: Array<{
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

  /** Agregar owner a agencia: admin designa a un usuario como owner para delegar administración */
  const [addOwnerTarget, setAddOwnerTarget] = useState<OrgRow | null>(null);
  const [addOwnerEmail, setAddOwnerEmail] = useState("");
  const [addOwnerLoading, setAddOwnerLoading] = useState(false);

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
          .select("org_id, user_id, role")
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

        // Attach members to orgs
        const enrichedOrgs = orgsList.map(org => {
          const orgMembers = membersData
            .filter(m => m.org_id === org.id)
            .map(m => {
              const profile = profileMap.get(m.user_id);
              return {
                user_id: m.user_id,
                role: m.role,
                display_name: profile?.display_name || "Sin nombre",
                plan_type: profile?.plan_type || "free"
              };
            });
          return { ...org, members: orgMembers };
        });

        setOrgs(enrichedOrgs);
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
   * Agrega un usuario como owner de la agencia. Admin busca por email, inserta en organization_members
   * con role='owner' y asegura que tenga role 'agency' en user_roles para acceder al panel.
   */
  const handleAddOwner = async () => {
    if (!addOwnerTarget || !addOwnerEmail.trim()) return;
    setAddOwnerLoading(true);
    try {
      const email = addOwnerEmail.trim().toLowerCase();
      const { data: profiles, error: profileErr } = await supabase
        .from("profiles")
        .select("user_id, display_name, email")
        .ilike("email", email)
        .limit(1);

      if (profileErr) throw profileErr;
      if (!profiles || profiles.length === 0) {
        toast({ title: "Usuario no encontrado", description: `No existe un usuario con email "${email}".`, variant: "destructive" });
        return;
      }

      const targetUser = profiles[0];

      // Verificar si ya es miembro
      const { data: existing } = await supabase
        .from("organization_members")
        .select("id")
        .eq("org_id", addOwnerTarget.id)
        .eq("user_id", targetUser.user_id)
        .single();

      if (existing) {
        toast({ title: "Ya es miembro", description: `${targetUser.display_name} ya pertenece a esta agencia. Actualizá su rol desde otro flujo si es necesario.`, variant: "destructive" });
        return;
      }

      const { error: insertErr } = await supabase
        .from("organization_members")
        .insert({ org_id: addOwnerTarget.id, user_id: targetUser.user_id, role: "owner" });

      if (insertErr) throw insertErr;

      // Asegurar que tenga role 'agency' para acceder a /agency
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", targetUser.user_id);
      const hasAgency = roles?.some((r) => r.role === "agency") ?? false;
      if (!hasAgency) {
        const { error: roleErr } = await supabase.from("user_roles").insert({ user_id: targetUser.user_id, role: "agency" });
        if (roleErr && roleErr.code !== "23505") throw roleErr; // 23505 = ya existe
      }

      toast({ title: "Owner agregado", description: `${targetUser.display_name} ahora es owner de "${addOwnerTarget.name}".` });
      setAddOwnerTarget(null);
      setAddOwnerEmail("");
      fetchOrgs();
    } catch (e: unknown) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Error desconocido", variant: "destructive" });
    } finally {
      setAddOwnerLoading(false);
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
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {org.type === "agency_team" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() => {
                      setAddOwnerTarget(org);
                      setAddOwnerEmail("");
                    }}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Agregar owner
                  </Button>
                )}
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

      <Dialog open={!!addOwnerTarget} onOpenChange={(v) => !v && setAddOwnerTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar owner a agencia</DialogTitle>
            <DialogDescription>
              Designá a un usuario como owner de <strong>{addOwnerTarget?.name}</strong>. Podrá dar de baja agentes, gestionar miembros y ver el link de oficina.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email del usuario</label>
              <Input
                type="email"
                placeholder="usuario@ejemplo.com"
                value={addOwnerEmail}
                onChange={(e) => setAddOwnerEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddOwner()}
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOwnerTarget(null)} disabled={addOwnerLoading}>
              Cancelar
            </Button>
            <Button onClick={handleAddOwner} disabled={addOwnerLoading || !addOwnerEmail.trim()}>
              {addOwnerLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Agregar owner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
