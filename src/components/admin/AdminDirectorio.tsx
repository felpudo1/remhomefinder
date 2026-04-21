import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useGeography } from "@/hooks/useGeography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, Loader2, Building2, Globe, Sparkles, Pencil, Edit2, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface ExternalAgency {
  id: string;
  name: string;
  website_url: string;
  department_id: string | null;
  is_featured: boolean;
  address: string;
  phone: string;
  email: string;
  imported_from: string | null;
  created_at: string;
}

interface ParsedAgency {
  name: string;
  address: string;
  department_name: string | null;
  department_id: string | null;
  phone: string;
  website_url: string;
  email: string;
}

export function AdminDirectorio() {
  const queryClient = useQueryClient();
  const { departments } = useGeography();
  const { toast } = useToast();

  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newDeptId, setNewDeptId] = useState<string>("none");
  const [newFeatured, setNewFeatured] = useState(false);

  // Importador web
  const [importUrl, setImportUrl] = useState("");
  const [crawlMode, setCrawlMode] = useState(false);
  const [maxPages, setMaxPages] = useState(5);
  const [parsed, setParsed] = useState<ParsedAgency[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Edición (Dialog)
  const [editAgency, setEditAgency] = useState<ExternalAgency | null>(null);
  const [editName, setEditName] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editDeptId, setEditDeptId] = useState<string>("none");
  const [editFeatured, setEditFeatured] = useState(false);

  const openEdit = (a: ExternalAgency) => {
    setEditAgency(a);
    setEditName(a.name || "");
    setEditUrl(a.website_url || "");
    setEditAddress(a.address || "");
    setEditPhone(a.phone || "");
    setEditEmail(a.email || "");
    setEditDeptId(a.department_id || "none");
    setEditFeatured(!!a.is_featured);
  };

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

  const existingNames = useMemo(
    () => new Set(agencies.map((a) => (a.name || "").toLowerCase().trim())),
    [agencies],
  );

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!newName.trim() || !newUrl.trim()) throw new Error("Nombre y URL son requeridos");
      const { error } = await (supabase as any).from("external_agencies").insert({
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

  const editMutation = useMutation({
    mutationFn: async () => {
      if (!editAgency) throw new Error("Sin agencia seleccionada");
      if (!editName.trim()) throw new Error("El nombre es requerido");
      const { error } = await (supabase as any)
        .from("external_agencies")
        .update({
          name: editName.trim(),
          website_url: editUrl.trim(),
          address: editAddress.trim(),
          phone: editPhone.trim(),
          email: editEmail.trim(),
          department_id: editDeptId === "none" ? null : editDeptId,
          is_featured: editFeatured,
        })
        .eq("id", editAgency.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-external-agencies"] });
      setEditAgency(null);
      toast({ title: "Agencia actualizada" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleAnalyze = async () => {
    if (!importUrl.trim()) {
      toast({ title: "Ingresá una URL", variant: "destructive" });
      return;
    }
    setIsAnalyzing(true);
    setParsed([]);
    setSelected(new Set());
    try {
      const { data, error } = await supabase.functions.invoke("scrape-agency-directory", {
        body: { url: importUrl.trim(), crawl: crawlMode, maxPages },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Falló el análisis");
      const list: ParsedAgency[] = data.agencies || [];
      setParsed(list);
      // Pre-seleccionar todas las que NO son duplicadas
      const initial = new Set<number>();
      list.forEach((a, i) => {
        if (!existingNames.has((a.name || "").toLowerCase().trim())) initial.add(i);
      });
      setSelected(initial);
      toast({
        title: `${list.length} agencias detectadas`,
        description: `${initial.size} listas para importar (${list.length - initial.size} ya existen).`,
      });
    } catch (e: any) {
      toast({ title: "Error analizando", description: e.message, variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const importMutation = useMutation({
    mutationFn: async () => {
      const toInsert = parsed
        .filter((_, i) => selected.has(i))
        .filter((a) => !existingNames.has((a.name || "").toLowerCase().trim()))
        .map((a) => ({
          name: a.name,
          website_url: a.website_url || "",
          department_id: a.department_id,
          address: a.address || "",
          phone: a.phone || "",
          email: a.email || "",
          imported_from: importUrl.trim(),
          is_featured: false,
        }));
      if (toInsert.length === 0) throw new Error("No hay agencias nuevas seleccionadas");
      const { error } = await (supabase as any).from("external_agencies").insert(toInsert);
      if (error) throw error;
      return toInsert.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["admin-external-agencies"] });
      setParsed([]);
      setSelected(new Set());
      setImportUrl("");
      toast({ title: `${count} agencias importadas` });
    },
    onError: (e: any) => toast({ title: "Error importando", description: e.message, variant: "destructive" }),
  });

  const toggleSelect = (i: number) => {
    const next = new Set(selected);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    setSelected(next);
  };

  const selectAllNew = () => {
    const next = new Set<number>();
    parsed.forEach((a, i) => {
      if (!existingNames.has((a.name || "").toLowerCase().trim())) next.add(i);
    });
    setSelected(next);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Building2 className="w-4 h-4" />
        <p>Agencias externas del directorio público. Las organizaciones registradas aparecen automáticamente.</p>
      </div>

      {/* IMPORTADOR WEB */}
      <div className="border border-primary/30 rounded-xl p-4 space-y-3 bg-primary/5">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Importar agencias desde índice web</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Pegá la URL de un índice (ej: <code className="text-xs">https://ciu.org.uy/nuestros-socios/</code>) y el sistema extraerá nombre, dirección, departamento, teléfono, web y email.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="https://ejemplo.com/listado-inmobiliarias"
            value={importUrl}
            onChange={(e) => setImportUrl(e.target.value)}
            disabled={isAnalyzing}
          />
          <Button onClick={handleAnalyze} disabled={isAnalyzing || !importUrl.trim()} size="sm">
            {isAnalyzing ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
            Analizar
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Switch checked={crawlMode} onCheckedChange={setCrawlMode} id="crawl-mode" />
            <Label htmlFor="crawl-mode" className="text-xs cursor-pointer">Recorrer subpáginas (crawl)</Label>
          </div>
          {crawlMode && (
            <div className="flex items-center gap-2">
              <Label className="text-xs">Máx páginas:</Label>
              <Input
                type="number"
                min={1}
                max={20}
                value={maxPages}
                onChange={(e) => setMaxPages(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                className="w-20 h-8 text-xs"
              />
            </div>
          )}
        </div>

        {/* Preview parsed */}
        {parsed.length > 0 && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className="text-xs font-medium">
                {parsed.length} agencias detectadas · {selected.size} seleccionadas
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAllNew} className="h-7 text-xs">
                  Solo nuevas
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSelected(new Set(parsed.map((_, i) => i)))} className="h-7 text-xs">
                  Todas
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSelected(new Set())} className="h-7 text-xs">
                  Ninguna
                </Button>
              </div>
            </div>
            <div className="max-h-[400px] overflow-y-auto border border-border rounded-lg bg-card">
              {parsed.map((a, i) => {
                const isDup = existingNames.has((a.name || "").toLowerCase().trim());
                return (
                  <div
                    key={i}
                    className={`flex items-start gap-3 p-2 border-b border-border last:border-0 text-xs ${isDup ? "opacity-50 bg-muted/30" : ""}`}
                  >
                    <Checkbox
                      checked={selected.has(i)}
                      onCheckedChange={() => toggleSelect(i)}
                      className="mt-1 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">
                        {a.name} {isDup && <span className="text-muted-foreground font-normal">(ya existe)</span>}
                      </p>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-muted-foreground mt-0.5">
                        {a.address && <span className="truncate max-w-[200px]">📍 {a.address}</span>}
                        {a.department_name && <span>🗺 {a.department_name}{!a.department_id && " ⚠"}</span>}
                        {a.phone && <span>📞 {a.phone}</span>}
                        {a.website_url && <span>🌐 ✓</span>}
                        {a.email && <span>✉ ✓</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <Button
              onClick={() => importMutation.mutate()}
              disabled={importMutation.isPending || selected.size === 0}
              className="w-full"
              size="sm"
            >
              {importMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-1" />
              )}
              Importar {[...selected].filter((i) => !existingNames.has((parsed[i].name || "").toLowerCase().trim())).length} agencias nuevas
            </Button>
          </div>
        )}
      </div>

      {/* Formulario de creación manual */}
      <div className="border border-border rounded-xl p-4 space-y-3 bg-muted/30">
        <h3 className="text-sm font-semibold">Agregar agencia externa manualmente</h3>
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

      {/* Lista existente */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : agencies.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No hay agencias externas registradas.</p>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">{agencies.length} agencias en directorio</p>
          {agencies.map((a) => (
            <div key={a.id} className="flex items-center gap-3 border border-border rounded-lg p-3 bg-card">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{a.name}</p>
                <div className="flex flex-wrap gap-x-2 text-xs text-muted-foreground">
                  {a.address && <span className="truncate">📍 {a.address}</span>}
                  {a.phone && <span>📞 {a.phone}</span>}
                  {a.website_url && <span className="truncate">🌐 {a.website_url}</span>}
                </div>
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
                  onClick={() => openEdit(a)}
                  className="text-primary hover:text-primary"
                  aria-label="Editar"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
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
      )}

      {/* Dialog de edición */}
      <Dialog open={!!editAgency} onOpenChange={(open) => !open && setEditAgency(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar agencia</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Nombre *</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Sitio web</Label>
              <Input
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Dirección</Label>
              <Input value={editAddress} onChange={(e) => setEditAddress(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Teléfono</Label>
                <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Email</Label>
                <Input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Departamento</Label>
              <Select value={editDeptId} onValueChange={setEditDeptId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sin departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin departamento</SelectItem>
                  {(departments || []).map((d: any) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Switch
                checked={editFeatured}
                onCheckedChange={setEditFeatured}
                id="edit-featured"
              />
              <Label htmlFor="edit-featured" className="text-sm cursor-pointer">
                Agencia destacada
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditAgency(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => editMutation.mutate()}
              disabled={editMutation.isPending || !editName.trim()}
            >
              {editMutation.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
