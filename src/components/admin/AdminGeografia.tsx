import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit, Trash2, MapPin, ChevronRight, Loader2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface Props {
  toast: (opts: { title: string; description?: string; variant?: "default" | "destructive" }) => void;
}

export function AdminGeografia({ toast }: Props) {
  // Ciudades
  const [cities, setCities] = useState<any[]>([]);
  const [loadingCities, setLoadingCities] = useState(true);
  const [selectedCity, setSelectedCity] = useState<any | null>(null);

  // Barrios
  const [neighborhoods, setNeighborhoods] = useState<any[]>([]);
  const [loadingNeigh, setLoadingNeigh] = useState(false);

  // Formularios modales
  const [cityDialog, setCityDialog] = useState<{ open: boolean; mode: "add" | "edit"; data: any }>({ open: false, mode: "add", data: null });
  const [neighDialog, setNeighDialog] = useState<{ open: boolean; mode: "add" | "edit"; data: any }>({ open: false, mode: "add", data: null });
  const [formData, setFormData] = useState({ name: "", country: "Uruguay" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCities();
  }, []);

  useEffect(() => {
    if (selectedCity) fetchNeighborhoods(selectedCity.id);
  }, [selectedCity]);

  const fetchCities = async () => {
    setLoadingCities(true);
    const { data, error } = await supabase.from("cities").select("*").order("name");
    if (error) toast({ title: "Error al cargar", description: error.message, variant: "destructive" });
    else setCities(data || []);
    setLoadingCities(false);
  };

  const fetchNeighborhoods = async (cityId: string) => {
    setLoadingNeigh(true);
    const { data, error } = await supabase.from("neighborhoods").select("*").eq("city_id", cityId).order("name");
    if (error) toast({ title: "Error al cargar barrios", description: error.message, variant: "destructive" });
    else setNeighborhoods(data || []);
    setLoadingNeigh(false);
  };

  // --- CRUD CIUDADES ---
  const handleSaveCity = async () => {
    if (!formData.name.trim()) return;
    setIsSubmitting(true);
    
    if (cityDialog.mode === "add") {
      const { error } = await supabase.from("cities").insert([{ name: formData.name, country: formData.country }]);
      if (error) toast({ title: "Error al crear", description: error.message, variant: "destructive" });
      else toast({ title: "Departamento creado" });
    } else {
      const { error } = await supabase.from("cities").update({ name: formData.name, country: formData.country }).eq("id", cityDialog.data.id);
      if (error) toast({ title: "Error al actualizar", description: error.message, variant: "destructive" });
      else toast({ title: "Departamento actualizado" });
    }
    
    setIsSubmitting(false);
    setCityDialog({ ...cityDialog, open: false });
    fetchCities();
  };

  const handleDeleteCity = async (id: string) => {
    if (!window.confirm("¿Estás seguro de eliminar este depto? Esto fallará si tiene propiedades asociadas.")) return;
    if (selectedCity?.id === id) setSelectedCity(null);
    const { error } = await supabase.from("cities").delete().eq("id", id);
    if (error) toast({ title: "Error al eliminar", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Departamento eliminado" });
      fetchCities();
    }
  };

  // --- CRUD BARRIOS ---
  const handleSaveNeigh = async () => {
    if (!formData.name.trim() || !selectedCity) return;
    setIsSubmitting(true);
    
    if (neighDialog.mode === "add") {
      const { error } = await supabase.from("neighborhoods").insert([{ name: formData.name, city_id: selectedCity.id }]);
      if (error) toast({ title: "Error al crear", description: error.message, variant: "destructive" });
      else toast({ title: "Barrio creado" });
    } else {
      const { error } = await supabase.from("neighborhoods").update({ name: formData.name }).eq("id", neighDialog.data.id);
      if (error) toast({ title: "Error al actualizar", description: error.message, variant: "destructive" });
      else toast({ title: "Barrio actualizado" });
    }
    
    setIsSubmitting(false);
    setNeighDialog({ ...neighDialog, open: false });
    fetchNeighborhoods(selectedCity.id);
  };

  const handleDeleteNeigh = async (id: string) => {
    if (!window.confirm("¿Seguro que querés eliminar este barrio? Fallará si hay propiedades usándolo.")) return;
    const { error } = await supabase.from("neighborhoods").delete().eq("id", id);
    if (error) toast({ title: "Error al eliminar", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Barrio eliminado" });
      if (selectedCity) fetchNeighborhoods(selectedCity.id);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* CUADRO 1: CIUDADES */}
      <Card className="flex flex-col h-[75vh]">
        <CardHeader className="border-b bg-muted/20 pb-4">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Departamentos
              </CardTitle>
              <CardDescription>Gestioná el catálogo de departamentos o estados.</CardDescription>
            </div>
            <Button size="sm" onClick={() => { setFormData({ name: "", country: "Uruguay" }); setCityDialog({ open: true, mode: "add", data: null }); }}>
              <Plus className="w-4 h-4 mr-1" /> Agregar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-0">
          {loadingCities ? (
            <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : cities.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No hay departamentos cargados.</div>
          ) : (
            <div className="flex flex-col divide-y">
              {cities.map((city) => (
                <div 
                  key={city.id} 
                  onClick={() => setSelectedCity(city)}
                  className={`flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors ${selectedCity?.id === city.id ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}
                >
                  <div>
                    <span className="font-medium text-sm">{city.name}</span>
                    <span className="text-xs text-muted-foreground ml-2 block sm:inline">{city.country}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={(e) => { e.stopPropagation(); setFormData({ name: city.name, country: city.country || "Uruguay" }); setCityDialog({ open: true, mode: "edit", data: city }); }}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleDeleteCity(city.id); }}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <ChevronRight className={`w-4 h-4 text-muted-foreground ml-2 transition-transform ${selectedCity?.id === city.id ? "translate-x-1 text-primary" : ""}`} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* CUADRO 2: BARRIOS */}
      <Card className={`flex flex-col h-[75vh] transition-opacity duration-300 ${!selectedCity ? "opacity-50 pointer-events-none" : ""}`}>
        <CardHeader className="border-b bg-muted/20 pb-4">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                Barrios
              </CardTitle>
              <CardDescription>
                {selectedCity ? `Barrios de ${selectedCity.name}` : "Seleccioná un departamento primero."}
              </CardDescription>
            </div>
            {selectedCity && (
              <Button size="sm" onClick={() => { setFormData({ name: "", country: "" }); setNeighDialog({ open: true, mode: "add", data: null }); }}>
                <Plus className="w-4 h-4 mr-1" /> Agregar Barrio
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-0">
          {!selectedCity ? (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
              <MapPin className="w-12 h-12 mb-4 opacity-20" />
              <p>Seleccioná o creá un departamento en la lista de la izquierda para ver y cargar sus barrios.</p>
            </div>
          ) : loadingNeigh ? (
            <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : neighborhoods.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p>No hay barrios cargados en {selectedCity.name}.</p>
              <Button variant="link" onClick={() => { setFormData({ name: "", country: "" }); setNeighDialog({ open: true, mode: "add", data: null }); }}>
                Agregar el primer barrio
              </Button>
            </div>
          ) : (
            <div className="flex flex-col divide-y">
              {neighborhoods.map((neigh) => (
                <div key={neigh.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                  <span className="font-medium text-sm">{neigh.name}</span>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => { setFormData({ name: neigh.name, country: "" }); setNeighDialog({ open: true, mode: "edit", data: neigh }); }}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteNeigh(neigh.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* DIALOGOS */}
      <Dialog open={cityDialog.open} onOpenChange={(open) => !open && setCityDialog({ ...cityDialog, open: false })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{cityDialog.mode === "add" ? "Agregar Departamento" : "Editar Departamento"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Ej: Montevideo" />
            </div>
            <div className="space-y-2">
              <Label>País</Label>
              <Input value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} placeholder="Ej: Uruguay" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCityDialog({ ...cityDialog, open: false })}>Cancelar</Button>
            <Button onClick={handleSaveCity} disabled={!formData.name.trim() || isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={neighDialog.open} onOpenChange={(open) => !open && setNeighDialog({ ...neighDialog, open: false })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{neighDialog.mode === "add" ? "Agregar Barrio" : "Editar Barrio"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nombre del Barrio</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Ej: Pocitos" />
            </div>
            {selectedCity && (
              <p className="text-xs text-muted-foreground">Este barrio pertenecerá a <strong>{selectedCity.name}</strong>.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNeighDialog({ ...neighDialog, open: false })}>Cancelar</Button>
            <Button onClick={handleSaveNeigh} disabled={!formData.name.trim() || isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
