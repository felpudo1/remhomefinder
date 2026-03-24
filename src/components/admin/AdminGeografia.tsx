import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit, Trash2, MapPin, ChevronRight, Loader2, Save, Globe, Search, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  // Departamentos
  const [departments, setDepartments] = useState<any[]>([]);
  const [loadingDepts, setLoadingDepts] = useState(true);
  const [selectedDept, setSelectedDept] = useState<any | null>(null);

  // Ciudades
  const [cities, setCities] = useState<any[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [selectedCity, setSelectedCity] = useState<any | null>(null);

  // Barrios
  const [neighborhoods, setNeighborhoods] = useState<any[]>([]);
  const [loadingNeigh, setLoadingNeigh] = useState(false);

  // Formularios modales
  const [deptDialog, setDeptDialog] = useState<{ open: boolean; mode: "add" | "edit"; data: any }>({ open: false, mode: "add", data: null });
  const [cityDialog, setCityDialog] = useState<{ open: boolean; mode: "add" | "edit"; data: any }>({ open: false, mode: "add", data: null });
  const [neighDialog, setNeighDialog] = useState<{ open: boolean; mode: "add" | "edit"; data: any }>({ open: false, mode: "add", data: null });
  const [formData, setFormData] = useState({ name: "", country: "UY" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estado para panel de barrios global
  const [allNeighborhoods, setAllNeighborhoods] = useState<any[]>([]);
  const [loadingAllNeigh, setLoadingAllNeigh] = useState(false);
  const [neighSearch, setNeighSearch] = useState("");
  const [deletingNeighId, setDeletingNeighId] = useState<string | null>(null);

  useEffect(() => { fetchDepartments(); }, []);
  useEffect(() => { if (selectedDept) fetchCities(selectedDept.id); }, [selectedDept]);
  useEffect(() => { if (selectedCity) fetchNeighborhoods(selectedCity.id); }, [selectedCity]);

  const fetchDepartments = async () => {
    setLoadingDepts(true);
    const { data, error } = await supabase.from("departments").select("*").order("country").order("name");
    if (error) toast({ title: "Error al cargar departamentos", description: error.message, variant: "destructive" });
    else setDepartments(data || []);
    setLoadingDepts(false);
  };

  const fetchCities = async (deptId: string) => {
    setLoadingCities(true);
    setSelectedCity(null);
    setNeighborhoods([]);
    const { data, error } = await supabase.from("cities").select("*").eq("department_id", deptId).order("name");
    if (error) toast({ title: "Error al cargar ciudades", description: error.message, variant: "destructive" });
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

  // --- CRUD DEPARTAMENTOS ---
  const handleSaveDept = async () => {
    if (!formData.name.trim()) return;
    setIsSubmitting(true);
    if (deptDialog.mode === "add") {
      const { error } = await supabase.from("departments").insert([{ name: formData.name, country: formData.country }]);
      if (error) toast({ title: "Error al crear", description: error.message, variant: "destructive" });
      else toast({ title: "Departamento creado" });
    } else {
      const { error } = await supabase.from("departments").update({ name: formData.name, country: formData.country }).eq("id", deptDialog.data.id);
      if (error) toast({ title: "Error al actualizar", description: error.message, variant: "destructive" });
      else toast({ title: "Departamento actualizado" });
    }
    setIsSubmitting(false);
    setDeptDialog({ ...deptDialog, open: false });
    fetchDepartments();
  };

  const handleDeleteDept = async (id: string) => {
    if (!window.confirm("¿Seguro? Fallará si tiene ciudades asociadas.")) return;
    if (selectedDept?.id === id) { setSelectedDept(null); setCities([]); setSelectedCity(null); setNeighborhoods([]); }
    const { error } = await supabase.from("departments").delete().eq("id", id);
    if (error) toast({ title: "Error al eliminar", description: error.message, variant: "destructive" });
    else { toast({ title: "Departamento eliminado" }); fetchDepartments(); }
  };

  // --- CRUD CIUDADES ---
  const handleSaveCity = async () => {
    if (!formData.name.trim() || !selectedDept) return;
    setIsSubmitting(true);
    if (cityDialog.mode === "add") {
      const { error } = await supabase.from("cities").insert([{ name: formData.name, department_id: selectedDept.id }]);
      if (error) toast({ title: "Error al crear", description: error.message, variant: "destructive" });
      else toast({ title: "Ciudad creada" });
    } else {
      const { error } = await supabase.from("cities").update({ name: formData.name }).eq("id", cityDialog.data.id);
      if (error) toast({ title: "Error al actualizar", description: error.message, variant: "destructive" });
      else toast({ title: "Ciudad actualizada" });
    }
    setIsSubmitting(false);
    setCityDialog({ ...cityDialog, open: false });
    fetchCities(selectedDept.id);
  };

  const handleDeleteCity = async (id: string) => {
    if (!window.confirm("¿Seguro? Fallará si tiene barrios asociados.")) return;
    if (selectedCity?.id === id) { setSelectedCity(null); setNeighborhoods([]); }
    const { error } = await supabase.from("cities").delete().eq("id", id);
    if (error) toast({ title: "Error al eliminar", description: error.message, variant: "destructive" });
    else { toast({ title: "Ciudad eliminada" }); if (selectedDept) fetchCities(selectedDept.id); }
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
    if (!window.confirm("¿Seguro? Fallará si hay propiedades usándolo.")) return;
    const { error } = await supabase.from("neighborhoods").delete().eq("id", id);
    if (error) toast({ title: "Error al eliminar", description: error.message, variant: "destructive" });
    else { toast({ title: "Barrio eliminado" }); if (selectedCity) fetchNeighborhoods(selectedCity.id); }
  };

  const countryLabel = (code: string) => code === "UY" ? "🇺🇾 Uruguay" : code === "AR" ? "🇦🇷 Argentina" : code;

  return (
    <div className="space-y-4 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground px-1">
        <Globe className="w-4 h-4" />
        <span className="font-medium text-foreground">Geografía</span>
        {selectedDept && (
          <>
            <ChevronRight className="w-3 h-3" />
            <button onClick={() => { setSelectedDept(null); setCities([]); setSelectedCity(null); setNeighborhoods([]); }} className="hover:text-foreground transition-colors">{selectedDept.name}</button>
          </>
        )}
        {selectedCity && (
          <>
            <ChevronRight className="w-3 h-3" />
            <button onClick={() => { setSelectedCity(null); setNeighborhoods([]); }} className="hover:text-foreground transition-colors">{selectedCity.name}</button>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* PANEL 1: DEPARTAMENTOS */}
        <Card className="flex flex-col h-[70vh]">
          <CardHeader className="border-b bg-muted/20 pb-3">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  Departamentos
                </CardTitle>
                <CardDescription className="text-xs">País → Departamento</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={() => { setFormData({ name: "", country: "UY" }); setDeptDialog({ open: true, mode: "add", data: null }); }}>
                <Plus className="w-3 h-3 mr-1" /> Nuevo
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-0">
            {loadingDepts ? (
              <div className="p-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            ) : departments.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm">Sin departamentos.</div>
            ) : (
              <div className="flex flex-col divide-y">
                {departments.map((dept) => (
                  <div
                    key={dept.id}
                    onClick={() => setSelectedDept(dept)}
                    className={`flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors text-sm ${selectedDept?.id === dept.id ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}
                  >
                    <div>
                      <span className="font-medium">{dept.name}</span>
                      <span className="text-[10px] text-muted-foreground ml-1.5">{countryLabel(dept.country)}</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={(e) => { e.stopPropagation(); setFormData({ name: dept.name, country: dept.country }); setDeptDialog({ open: true, mode: "edit", data: dept }); }}>
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleDeleteDept(dept.id); }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                      <ChevronRight className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${selectedDept?.id === dept.id ? "translate-x-0.5 text-primary" : ""}`} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* PANEL 2: CIUDADES */}
        <Card className={`flex flex-col h-[70vh] transition-opacity duration-300 ${!selectedDept ? "opacity-40 pointer-events-none" : ""}`}>
          <CardHeader className="border-b bg-muted/20 pb-3">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-base">Ciudades</CardTitle>
                <CardDescription className="text-xs">
                  {selectedDept ? `Ciudades de ${selectedDept.name}` : "Seleccioná un depto."}
                </CardDescription>
              </div>
              {selectedDept && (
                <Button size="sm" variant="outline" onClick={() => { setFormData({ name: "", country: "" }); setCityDialog({ open: true, mode: "add", data: null }); }}>
                  <Plus className="w-3 h-3 mr-1" /> Nueva
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-0">
            {!selectedDept ? (
              <div className="p-8 text-center text-muted-foreground text-xs">
                <MapPin className="w-8 h-8 mx-auto mb-2 opacity-20" />
                Seleccioná un departamento.
              </div>
            ) : loadingCities ? (
              <div className="p-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            ) : cities.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm">
                <p>Sin ciudades en {selectedDept.name}.</p>
                <Button variant="link" size="sm" onClick={() => { setFormData({ name: "", country: "" }); setCityDialog({ open: true, mode: "add", data: null }); }}>Agregar primera ciudad</Button>
              </div>
            ) : (
              <div className="flex flex-col divide-y">
                {cities.map((city) => (
                  <div
                    key={city.id}
                    onClick={() => setSelectedCity(city)}
                    className={`flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors text-sm ${selectedCity?.id === city.id ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}
                  >
                    <span className="font-medium">{city.name}</span>
                    <div className="flex items-center gap-0.5">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={(e) => { e.stopPropagation(); setFormData({ name: city.name, country: "" }); setCityDialog({ open: true, mode: "edit", data: city }); }}>
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleDeleteCity(city.id); }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                      <ChevronRight className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${selectedCity?.id === city.id ? "translate-x-0.5 text-primary" : ""}`} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* PANEL 3: BARRIOS */}
        <Card className={`flex flex-col h-[70vh] transition-opacity duration-300 ${!selectedCity ? "opacity-40 pointer-events-none" : ""}`}>
          <CardHeader className="border-b bg-muted/20 pb-3">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-base">Barrios</CardTitle>
                <CardDescription className="text-xs">
                  {selectedCity ? `Barrios de ${selectedCity.name}` : "Seleccioná una ciudad."}
                </CardDescription>
              </div>
              {selectedCity && (
                <Button size="sm" variant="outline" onClick={() => { setFormData({ name: "", country: "" }); setNeighDialog({ open: true, mode: "add", data: null }); }}>
                  <Plus className="w-3 h-3 mr-1" /> Nuevo
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-0">
            {!selectedCity ? (
              <div className="p-8 text-center text-muted-foreground text-xs">
                <MapPin className="w-8 h-8 mx-auto mb-2 opacity-20" />
                Seleccioná una ciudad.
              </div>
            ) : loadingNeigh ? (
              <div className="p-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            ) : neighborhoods.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm">
                <p>Sin barrios en {selectedCity.name}.</p>
                <Button variant="link" size="sm" onClick={() => { setFormData({ name: "", country: "" }); setNeighDialog({ open: true, mode: "add", data: null }); }}>Agregar primer barrio</Button>
              </div>
            ) : (
              <div className="flex flex-col divide-y">
                {neighborhoods.map((neigh) => (
                  <div key={neigh.id} className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors text-sm">
                    <span className="font-medium">{neigh.name}</span>
                    <div className="flex items-center gap-0.5">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => { setFormData({ name: neigh.name, country: "" }); setNeighDialog({ open: true, mode: "edit", data: neigh }); }}>
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteNeigh(neigh.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* DIALOG: DEPARTAMENTO */}
      <Dialog open={deptDialog.open} onOpenChange={(open) => !open && setDeptDialog({ ...deptDialog, open: false })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{deptDialog.mode === "add" ? "Agregar Departamento" : "Editar Departamento"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Ej: Montevideo" />
            </div>
            <div className="space-y-2">
              <Label>País</Label>
              <Select value={formData.country} onValueChange={(v) => setFormData({ ...formData, country: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="UY">🇺🇾 Uruguay</SelectItem>
                  <SelectItem value="AR">🇦🇷 Argentina</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeptDialog({ ...deptDialog, open: false })}>Cancelar</Button>
            <Button onClick={handleSaveDept} disabled={!formData.name.trim() || isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: CIUDAD */}
      <Dialog open={cityDialog.open} onOpenChange={(open) => !open && setCityDialog({ ...cityDialog, open: false })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{cityDialog.mode === "add" ? "Agregar Ciudad" : "Editar Ciudad"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nombre de la Ciudad</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Ej: Ciudad de la Costa" />
            </div>
            {selectedDept && <p className="text-xs text-muted-foreground">Pertenecerá a <strong>{selectedDept.name}</strong>.</p>}
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

      {/* DIALOG: BARRIO */}
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
            {selectedCity && <p className="text-xs text-muted-foreground">Pertenecerá a <strong>{selectedCity.name}</strong> ({selectedDept?.name}).</p>}
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
