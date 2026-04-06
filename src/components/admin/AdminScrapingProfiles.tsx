import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import {
  Plus, Settings2, Trash2, Globe, Sparkles, Filter, Save, Search, RefreshCw
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DomainProfile {
  id: string;
  domain: string;
  discovery_config: {
    minUrlLength: number;
    excludeExtensions: string[];
    blockBrokenEnds: boolean;
  };
  custom_instructions: string;
  created_at: string;
}

export const AdminScrapingProfiles = () => {
  const [profiles, setProfiles] = useState<DomainProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    domain: "",
    minUrlLength: 30,
    excludeExtensions: ".pdf, .jpg, .png, .jpeg, .docx",
    blockBrokenEnds: true,
    customInstructions: "",
  });

  const fetchProfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("scraping_domain_profiles" as any)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Error cargando perfiles: " + error.message);
    } else {
      setProfiles((data as any) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleSave = async () => {
    if (!formData.domain.trim()) {
      toast.error("El dominio es obligatorio");
      return;
    }

    const payload = {
      domain: formData.domain.toLowerCase().trim().replace(/^https?:\/\//, '').replace('www.', ''),
      discovery_config: {
        minUrlLength: formData.minUrlLength,
        excludeExtensions: formData.excludeExtensions.split(",").map(e => e.trim()).filter(Boolean),
        blockBrokenEnds: formData.blockBrokenEnds,
      },
      custom_instructions: formData.customInstructions,
    };

    try {
      if (editingId) {
        const { error } = await supabase
          .from("scraping_domain_profiles" as any)
          .update(payload as any)
          .eq("id", editingId);
        if (error) throw error;
        toast.success("Perfil actualizado con éxito 💎");
      } else {
        const { error } = await supabase
          .from("scraping_domain_profiles" as any)
          .insert(payload as any);
        if (error) throw error;
        toast.success("Perfil creado con éxito 🚀");
      }
      
      resetForm();
      fetchProfiles();
    } catch (e: any) {
      toast.error("Error al guardar: " + e.message);
    }
  };

  const handleEdit = (profile: DomainProfile) => {
    setEditingId(profile.id);
    setFormData({
      domain: profile.domain,
      minUrlLength: profile.discovery_config.minUrlLength || 30,
      excludeExtensions: (profile.discovery_config.excludeExtensions || []).join(", "),
      blockBrokenEnds: profile.discovery_config.blockBrokenEnds ?? true,
      customInstructions: profile.custom_instructions || "",
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que querés eliminar este perfil? Esto afectará los escaneos de este dominio.")) return;

    const { error } = await supabase
      .from("scraping_domain_profiles" as any)
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Error al eliminar: " + error.message);
    } else {
      toast.success("Perfil eliminado");
      fetchProfiles();
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      domain: "",
      minUrlLength: 30,
      excludeExtensions: ".pdf, .jpg, .png, .jpeg, .docx",
      blockBrokenEnds: true,
      customInstructions: "",
    });
  };

  const filteredProfiles = profiles.filter(p => 
    p.domain.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 p-1 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Perfiles de Dominio Pro</h2>
          <p className="text-muted-foreground italic text-sm">Ajuste quirúrgico de scraping por agencia.</p>
        </div>
        <Button onClick={resetForm} variant={editingId ? "outline" : "default"} className="rounded-full">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Perfil
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Editor de Perfil */}
        <Card className="lg:col-span-1 border-primary/20 shadow-lg h-fit sticky top-4 rounded-2xl overflow-hidden">
          <CardHeader className="bg-primary/5 pb-6">
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-primary" />
              {editingId ? "Editando Perfil" : "Crear Perfil Inteligente"}
            </CardTitle>
            <CardDescription>Definí las reglas de oro para este dominio.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="domain">Dominio (limpio)</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="domain" 
                  placeholder="acsa.com.uy" 
                  className="pl-9 rounded-xl uppercase text-xs font-bold"
                  value={formData.domain}
                  onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
                />
              </div>
            </div>

            <div className="border border-border/50 rounded-2xl p-4 bg-muted/20 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Filter className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Filtros Discovery</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground">
                  <Label>Largo Mínimo URL</Label>
                  <span className="bg-primary/10 text-primary px-1.5 rounded">{formData.minUrlLength} ch</span>
                </div>
                <Input 
                  type="number" 
                  value={formData.minUrlLength}
                  onChange={(e) => setFormData(prev => ({ ...prev, minUrlLength: parseInt(e.target.value) || 0 }))}
                  className="rounded-lg h-9 text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-muted-foreground">Extensiones Prohibidas</Label>
                <Input 
                  value={formData.excludeExtensions}
                  onChange={(e) => setFormData(prev => ({ ...prev, excludeExtensions: e.target.value }))}
                  className="rounded-lg h-9 text-sm font-mono"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase">Ignorar Rotos</Label>
                <Switch 
                  checked={formData.blockBrokenEnds}
                  onCheckedChange={(v) => setFormData(prev => ({ ...prev, blockBrokenEnds: v }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
                <Label htmlFor="instructions" className="font-bold">Instrucciones IA (El Santo Grial)</Label>
              </div>
              <Textarea 
                id="instructions"
                placeholder="Ej: Si el título es corto, sacá el título de la etiqueta H2 principal..."
                className="min-h-[120px] rounded-xl text-sm leading-relaxed"
                value={formData.customInstructions}
                onChange={(e) => setFormData(prev => ({ ...prev, customInstructions: e.target.value }))}
              />
            </div>

            <Button onClick={handleSave} className="w-full h-11 rounded-xl gap-2 font-bold shadow-lg shadow-primary/20">
              <Save className="w-4 h-4" />
              {editingId ? "Actualizar Perfil" : "Guardar Perfil Maestro"}
            </Button>
            {editingId && (
              <Button onClick={resetForm} variant="ghost" className="w-full text-xs text-muted-foreground uppercase">
                Cancelar Edición
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Lista de Perfiles */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por dominio..." 
              className="pl-9 rounded-2xl h-11 border-primary/10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading ? (
              <div className="col-span-full py-20 text-center space-y-4">
                <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto" />
                <p className="text-sm font-medium animate-pulse">Cargando perfiles pro...</p>
              </div>
            ) : filteredProfiles.length === 0 ? (
              <div className="col-span-full py-20 text-center border-2 border-dashed rounded-3xl">
                <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                <p className="text-muted-foreground">Todavía no tenés perfiles dinámicos.</p>
              </div>
            ) : (
              filteredProfiles.map((profile) => (
                <Card key={profile.id} className="rounded-2xl border-primary/10 hover:border-primary/30 transition-all group overflow-hidden">
                  <CardHeader className="pb-3 border-b border-muted">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                          <Globe className="h-4 w-4 text-primary" />
                        </div>
                        <h4 className="font-bold text-sm uppercase tracking-tight truncate max-w-[150px]">{profile.domain}</h4>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(profile)} className="h-8 w-8 rounded-full">
                          <Settings2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(profile.id)} className="h-8 w-8 rounded-full text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="outline" className="text-[10px] font-mono border-dashed">LEN {profile.discovery_config.minUrlLength}+</Badge>
                      {profile.discovery_config.blockBrokenEnds && <Badge variant="secondary" className="text-[10px]">ANTI-ROTO ✅</Badge>}
                    </div>
                    {profile.custom_instructions && (
                      <div className="bg-amber-50/50 dark:bg-amber-900/10 p-2.5 rounded-xl border border-amber-100 dark:border-amber-800/50">
                         <div className="flex items-center gap-1.5 mb-1">
                           <Sparkles className="h-3 w-3 text-amber-500" />
                           <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase">Instrucciones IA</span>
                         </div>
                         <p className="text-[10px] leading-relaxed text-muted-foreground italic line-clamp-2">
                           "{profile.custom_instructions}"
                         </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
