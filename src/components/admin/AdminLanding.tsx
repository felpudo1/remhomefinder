import { useState } from "react";
import { useAllLandingAgencies, type LandingAgency } from "@/hooks/useLandingAgencies";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Trash2, Plus, Upload, Building2 } from "lucide-react";
import { toast } from "sonner";

export function AdminLanding() {
  const { data: agencies = [], isLoading } = useAllLandingAgencies();
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRow, setNewRow] = useState("1");
  const [uploading, setUploading] = useState(false);
  const [newLogoFile, setNewLogoFile] = useState<File | null>(null);
  const [newLogoPreview, setNewLogoPreview] = useState<string>("");

  const row1 = agencies.filter(a => a.carousel_row === 1);
  const row2 = agencies.filter(a => a.carousel_row === 2);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewLogoFile(file);
    setNewLogoPreview(URL.createObjectURL(file));
  };

  const uploadLogo = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("landing-logos").upload(path, file, {
      upsert: true,
      contentType: file.type,
    });
    if (error) throw error;
    const { data: pub } = supabase.storage.from("landing-logos").getPublicUrl(path);
    return pub.publicUrl;
  };

  const handleAdd = async () => {
    if (!newName.trim()) {
      toast.error("Ingresá el nombre de la agencia");
      return;
    }
    setUploading(true);
    try {
      let logoUrl = "";
      if (newLogoFile) {
        logoUrl = await uploadLogo(newLogoFile);
      }

      const targetRow = agencies.filter(a => a.carousel_row === parseInt(newRow));
      const nextOrder = targetRow.length > 0 ? Math.max(...targetRow.map(a => a.sort_order)) + 1 : 0;

      const { error } = await (supabase as any).from("landing_agencies").insert({
        name: newName.trim(),
        logo_url: logoUrl,
        carousel_row: parseInt(newRow),
        sort_order: nextOrder,
      });
      if (error) throw error;

      toast.success("Agencia agregada");
      setNewName("");
      setNewLogoFile(null);
      setNewLogoPreview("");
      setAdding(false);
      queryClient.invalidateQueries({ queryKey: ["landing-agencies-all"] });
      queryClient.invalidateQueries({ queryKey: ["landing-agencies"] });
    } catch (err: any) {
      toast.error(err.message || "Error al agregar");
    } finally {
      setUploading(false);
    }
  };

  const handleToggle = async (agency: LandingAgency) => {
    const { error } = await (supabase as any)
      .from("landing_agencies")
      .update({ is_active: !agency.is_active })
      .eq("id", agency.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["landing-agencies-all"] });
    queryClient.invalidateQueries({ queryKey: ["landing-agencies"] });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta agencia del carrusel?")) return;
    const { error } = await (supabase as any)
      .from("landing_agencies")
      .delete()
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Agencia eliminada");
    queryClient.invalidateQueries({ queryKey: ["landing-agencies-all"] });
    queryClient.invalidateQueries({ queryKey: ["landing-agencies"] });
  };

  const AgencyRow = ({ title, items }: { title: string; items: LandingAgency[] }) => (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{title} ({items.length}/20)</h3>
      {items.length === 0 && (
        <p className="text-xs text-muted-foreground italic">Sin agencias en este carrusel</p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map(agency => (
          <Card key={agency.id} className="p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
              {agency.logo_url ? (
                <img src={agency.logo_url} alt={agency.name} className="w-full h-full object-contain" />
              ) : (
                <Building2 className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{agency.name}</p>
            </div>
            <Switch
              checked={agency.is_active}
              onCheckedChange={() => handleToggle(agency)}
              className="shrink-0"
            />
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 text-destructive hover:text-destructive"
              onClick={() => handleDelete(agency.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );

  if (isLoading) return <p className="text-sm text-muted-foreground">Cargando…</p>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Gestioná las agencias que aparecen en los carruseles de la landing page.
        </p>
        <Button onClick={() => setAdding(!adding)} variant={adding ? "outline" : "default"} size="sm">
          <Plus className="w-4 h-4 mr-1" />
          {adding ? "Cancelar" : "Agregar agencia"}
        </Button>
      </div>

      {adding && (
        <Card className="p-4 space-y-4 border-primary/30">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Nombre de la agencia</Label>
              <Input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Ej: Remax Focus"
              />
            </div>
            <div className="space-y-2">
              <Label>Carrusel</Label>
              <Select value={newRow} onValueChange={setNewRow}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Carrusel 1 (→ derecha)</SelectItem>
                  <SelectItem value="2">Carrusel 2 (← izquierda)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Logo (opcional)</Label>
              <div className="flex items-center gap-2">
                {newLogoPreview && (
                  <img src={newLogoPreview} alt="Preview" className="w-10 h-10 rounded object-contain bg-muted" />
                )}
                <label className="flex items-center gap-1 px-3 py-2 rounded-md border border-input bg-background text-sm cursor-pointer hover:bg-accent transition-colors">
                  <Upload className="w-4 h-4" />
                  Subir
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>
              </div>
            </div>
          </div>
          <Button onClick={handleAdd} disabled={uploading} className="w-full sm:w-auto">
            {uploading ? "Guardando…" : "Agregar agencia"}
          </Button>
        </Card>
      )}

      <AgencyRow title="Carrusel 1 — Dirección →" items={row1} />
      <AgencyRow title="Carrusel 2 — Dirección ←" items={row2} />
    </div>
  );
}
