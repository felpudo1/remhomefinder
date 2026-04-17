import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useGeography } from "@/hooks/useGeography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, Loader2, Building2, Edit2, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";

interface ExternalAgency {
  id: string;
  name: string;
  website_url: string;
  department_id: string | null;
  is_featured: boolean;
  created_at: string;
}

export function AdminDirectorio() {
  const queryClient = useQueryClient();
  const { departments } = useGeography();
  const { toast } = useToast();

  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newDeptId, setNewDeptId] = useState<string>("none");
  const [newFeatured, setNewFeatured] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const { data: agencies = [], isLoading } = useQuery({
    queryKey: ["admin-external-agencies"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("external_agencies")
        .select("*")
        .order("is_featured", { ascending: false })
        .order("name");
      if (error) throw error;
      return data as ExternalAgency[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!newName.trim() || !newUrl.trim()) throw new Error("Nombre y URL son requeridos");
      const { error } = await (supabase as any)
        .from("external_agencies")
        .insert({
          name: newName.trim(),
          website_url: newUrl.trim(),
          department_id: newDeptId === "none" ? null : newDeptId,
          is_featured: newFeatured,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-external-agencies"] });
      setNewName("");
      setNewUrl("");
      setNewDeptId("none");
      setNewFeatured(false);
      toast({ title: "Agencia creada" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateNameMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      if (!name.trim()) throw new Error("El nombre no puede estar vacío");
      const { error } = await (supabase as any)
        .from("external_agencies")
        .update({ name: name.trim() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-external-agencies"] });
      setEditingId(null);
      toast({ title: "Nombre actualizado" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("external_agencies").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-external-agencies"] });
      toast({ title: "Agencia eliminada" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const toggleFeatured = useMutation({
    mutationFn: async ({ id, featured }: { id: string; featured: boolean }) => {
      const { error } = await (supabase as any)
        .from("external_agencies")
        .update({ is_featured: featured })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-external-agencies"] }),
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Building2 className="w-4 h-4" />
        <p>Agencias externas del directorio público. Las organizaciones registradas aparecen automáticamente.</p>
      </div>

      {/* Formulario de creación */}
      <div className="border border-border rounded-xl p-4 space-y-3 bg-muted/30">
        <h3 className="text-sm font-semibold">Agregar agencia externa</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input placeholder="Nombre *" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <Input placeholder="URL del sitio web *" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} />
          <Select value={newDeptId} onValueChange={setNewDeptId}>
            <SelectTrigger>
              <SelectValue placeholder="Departamento (sede)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sin departamento</SelectItem>
              {(departments || []).map((d: any) => (
                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Switch checked={newFeatured} onCheckedChange={setNewFeatured} id="new-featured" />
            <Label htmlFor="new-featured" className="text-sm">Destacada</Label>
          </div>
        </div>
        <Button onClick={() => addMutation.mutate()} disabled={addMutation.isPending} size="sm">
          <Plus className="w-4 h-4 mr-1" /> Agregar
        </Button>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : agencies.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No hay agencias externas registradas.</p>
      ) : (
        <div className="space-y-2">
          {agencies.map((a) => (
            <div key={a.id} className="flex items-center gap-3 border border-border rounded-lg p-3 bg-card">
              <div className="flex-1 min-w-0">
                {editingId === a.id ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="h-8 text-sm"
                      autoFocus
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                      onClick={() => updateNameMutation.mutate({ id: a.id, name: editingName })}
                      disabled={updateNameMutation.isPending}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground"
                      onClick={() => setEditingId(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group">
                    <p className="text-sm font-medium truncate">{a.name}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity"
                      onClick={() => {
                        setEditingId(a.id);
                        setEditingName(a.name);
                      }}
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground truncate">{a.website_url}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Switch
                  checked={a.is_featured}
                  onCheckedChange={(v) => toggleFeatured.mutate({ id: a.id, featured: v })}
                  aria-label="Destacada"
                />
                <span className="text-[10px] text-muted-foreground w-16 text-right">
                  {a.is_featured ? "Destacada" : "Normal"}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteMutation.mutate(a.id)}
                  disabled={deleteMutation.isPending}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )
      }
    </div >
  );
}
