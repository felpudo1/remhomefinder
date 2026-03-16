import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, Search, Users, Building2, Network } from "lucide-react";
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

  const fetchOrgs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("organizations")
      .select("*")
      .eq("is_personal", false)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setOrgs((data as OrgRow[]) || []);
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
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setDeleting(false);
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
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                onClick={() => setDeleteTarget(org)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
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
