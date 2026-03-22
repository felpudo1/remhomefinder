import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Sparkles, Shield, Lock, Loader2, Info, Home, Building, Coins, MapPin, X, Check, ChevronsUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface AIProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | undefined;
}

/**
 * Modal de Perfil IA: Lugar discreto para configuraciones avanzadas de IA y Privacidad.
 * Reubicado desde BuyerProfileModal para priorizar el valor de la data para Agentes (REGLA 2).
 */
export function AIProfileModal({ isOpen, onClose, userId }: AIProfileModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [operation, setOperation] = useState("Comprar");
  const [currency, setCurrency] = useState("U$S");
  const [minBudget, setMinBudget] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [bedrooms, setBedrooms] = useState("1");
  const [openNeighborhoods, setOpenNeighborhoods] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);

  const [departments, setDepartments] = useState<{id: string, name: string}[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<{id: string, name: string}[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>("");
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>([]);

  useEffect(() => {
    supabase.from("cities").select("id, name").order("name").then(({ data }) => {
      if (data) setDepartments(data as { id: string; name: string }[]);
    });
  }, []);

  useEffect(() => {
    if (selectedDept) {
      supabase.from("neighborhoods").select("id, name").eq("city_id", selectedDept).order("name").then(({ data }) => {
        if (data) setNeighborhoods(data as { id: string; name: string }[]);
      });
      // Importante: No limpiamos selectedNeighborhoods aquí porque estamos CARGANDO el perfil al abrir
    } else {
      setNeighborhoods([]);
    }
  }, [selectedDept]);

  useEffect(() => {
    if (isOpen && userId) {
      const fetchProfile = async () => {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from('user_search_profiles')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

          if (error) throw error;
          if (data) {
            setOperation(data.operation || "Comprar");
            setCurrency(data.currency || "U$S");
            setMinBudget(data.min_budget?.toString() || "");
            setMaxBudget(data.max_budget?.toString() || "");
            setBedrooms(data.min_bedrooms?.toString() || "1");
            setSelectedDept(data.city_id || "");
            setSelectedNeighborhoods(data.neighborhood_ids || []);
            setIsPrivate(!!data.is_private);
          }
        } catch (error) {
          console.error("Error fetching AI profile:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchProfile();
    }
  }, [isOpen, userId]);

  const toggleNeighborhood = (id: string) => {
    if (selectedNeighborhoods.includes(id)) {
      setSelectedNeighborhoods(prev => prev.filter(n => n !== id));
    } else {
      if (selectedNeighborhoods.length < 5) {
        setSelectedNeighborhoods(prev => [...prev, id]);
      } else {
        toast({ title: "Límite alcanzado", description: "Podés elegir hasta 5 barrios." });
      }
    }
  };

  const handleSaveProfile = async () => {
    if (!userId) return;
    setSaving(true);
    
    try {
      const { error } = await supabase.from('user_search_profiles' as any).upsert({
        user_id: userId,
        operation,
        currency,
        min_budget: Number(minBudget) || 0,
        max_budget: Number(maxBudget) || 0,
        min_bedrooms: bedrooms === "4+" ? 4 : (Number(bedrooms) || 1),
        city_id: selectedDept || null,
        neighborhood_ids: selectedNeighborhoods.length > 0 ? selectedNeighborhoods : null,
        // is_private: isPrivate  ← Columna pendiente de agregar a la BD
      }, { onConflict: 'user_id' });

      if (error) throw error;
      
      toast({
        title: "¡Perfil AI actualizado!",
        description: "Tus preferencias de búsqueda han sido guardadas con éxito.",
      });
      onClose();
    } catch (error: any) {
      toast({
        title: "Error al guardar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-[2rem] border-border/40 shadow-2xl bg-background/95 backdrop-blur-xl">
        <DialogHeader>
          <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-4">
            <Sparkles className="w-6 h-6 text-purple-500" />
          </div>
          <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-2">
            Perfil IA de Búsqueda
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-medium">
            Configuraciones avanzadas de tu algoritmo de búsqueda personalizada.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4 overflow-y-auto max-h-[70vh] px-1">
          <div className="bg-muted/30 rounded-2xl p-4 border border-border/50 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Info className="w-4 h-4 text-purple-500" />
              Estado de Inteligencia Colectiva
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Tu perfil está siendo procesado por nuestra IA para encontrar propiedades que coincidan con tus gustos. 
              Por defecto, los agentes pueden verte para ofrecerte oportunidades exclusivas.
            </p>
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Home className="w-3.5 h-3.5" /> ¿Qué buscás?
                </Label>
                <Select value={operation} onValueChange={setOperation}>
                  <SelectTrigger className="rounded-xl h-11 bg-background/50 border-input font-medium">
                    <SelectValue placeholder="Tipo de Operación" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Comprar">Comprar</SelectItem>
                    <SelectItem value="Alquilar">Alquilar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5" /> Habitaciones
                </Label>
                <div className="flex bg-background/50 rounded-xl border border-input p-1 h-11">
                  {["1", "2", "3", "4+"].map((num) => (
                    <button
                      key={num}
                      onClick={() => setBedrooms(num)}
                      className={`flex-1 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${
                        bedrooms === num ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5" /> Rango de Presupuesto
              </Label>
              <div className="flex gap-2">
                <div className="w-[110px]">
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="rounded-xl h-11 bg-background/50 border-input font-medium text-xs">
                      <SelectValue placeholder="Moneda" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="U$S">Dólares</SelectItem>
                      <SelectItem value="$">Pesos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Input 
                  type="number" 
                  placeholder="Mín" 
                  value={minBudget} 
                  onChange={(e) => setMinBudget(e.target.value)} 
                  className="rounded-xl h-11 bg-background/50 border-input w-[90px] text-sm"
                />
                <Input 
                  type="number" 
                  placeholder="Máx" 
                  value={maxBudget} 
                  onChange={(e) => setMaxBudget(e.target.value)} 
                  className="rounded-xl h-11 bg-background/50 border-input flex-1 text-sm"
                />
              </div>
            </div>

            <div className="border-t border-border/50 pt-4 space-y-4">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> Ubicación
              </Label>
              <div className="grid grid-cols-1 gap-3">
                <Select value={selectedDept} onValueChange={(val) => {
                  setSelectedDept(val);
                  setSelectedNeighborhoods([]); // Limpiar solo en interacción manual
                }}>
                  <SelectTrigger className="rounded-xl h-11 bg-background/50 border-input font-medium">
                    <SelectValue placeholder="Departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Popover open={openNeighborhoods} onOpenChange={setOpenNeighborhoods}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openNeighborhoods}
                      className="rounded-xl h-11 bg-background/50 border-input font-medium justify-between w-full text-sm"
                      disabled={!selectedDept}
                    >
                      {selectedNeighborhoods.length > 0 ? `Seleccionados (${selectedNeighborhoods.length})` : "Elegí hasta 5 barrios"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 w-[--radix-popover-trigger-width] rounded-xl border-border/50 shadow-xl overflow-hidden" align="start">
                    <Command className="rounded-xl">
                      <CommandInput placeholder="Buscar barrio..." className="h-10" />
                      <CommandList className="max-h-[250px]">
                        <CommandEmpty>No se encontró el barrio.</CommandEmpty>
                        <CommandGroup>
                          {neighborhoods.map((n) => (
                            <CommandItem
                              key={n.id}
                              value={n.name}
                              onSelect={() => toggleNeighborhood(n.id)}
                              className="cursor-pointer text-sm"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4 text-primary",
                                  selectedNeighborhoods.includes(n.id) ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {n.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {selectedNeighborhoods.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-2 bg-muted/40 rounded-xl border border-border/40">
                  {selectedNeighborhoods.map((id) => {
                    const n = neighborhoods.find(x => x.id === id);
                    if (!n) return null;
                    return (
                      <Badge key={id} variant="secondary" className="px-2 py-0.5 flex items-center gap-1 text-[10px] font-bold">
                        {n.name}
                        <X className="w-2.5 h-2.5 cursor-pointer opacity-70 hover:opacity-100" onClick={() => toggleNeighborhood(id)} />
                      </Badge>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between p-4 bg-purple-500/5 rounded-2xl border border-purple-500/20 transition-all hover:bg-purple-500/10 shadow-sm relative overflow-hidden group">
              <div className="space-y-1 relative z-10">
                <div className="flex items-center gap-2">
                  <Label htmlFor="ai-privacy" className="text-sm font-bold text-foreground cursor-pointer">Modo Privado</Label>
                  <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <p className="text-[10px] text-muted-foreground leading-tight max-w-[200px]">
                  Ocultar datos directos a agentes.
                </p>
              </div>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              ) : (
                <Switch 
                  id="ai-privacy"
                  checked={isPrivate}
                  onCheckedChange={setIsPrivate}
                  disabled={saving}
                  className="relative z-10 data-[state=checked]:bg-purple-500 scale-90"
                />
              )}
            </div>
          </div>

          <div className="bg-purple-500/5 rounded-2xl border border-purple-500/10 p-5 space-y-3 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <Shield className="w-12 h-12 text-purple-500" />
            </div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-purple-500/80">
              <Shield className="w-3.5 h-3.5" /> Compromiso de Privacidad
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed font-medium relative z-10">
              En <span className="text-foreground font-bold italic">HomeFinder</span>, el usuario es el único dueño de sus datos y tiene el control total del algoritmo. 
              Tenés la libertad de decidir cómo querés que nuestra tecnología trabaje para vos: podés usar la plataforma como un 
              <span className="text-foreground font-bold"> organizador personal privado y buscar casa como buscaron tus abuelos en 1930</span> o activar nuestra inteligencia colectiva como un puente hacia oportunidades exclusivas con agentes profesionales. 
              <span className="text-purple-500 font-bold ml-1">Vos tenés la llave.</span>
            </p>
          </div>
        </div>

        <DialogFooter className="sm:justify-center pt-2">
          <Button 
            onClick={handleSaveProfile} 
            disabled={saving || loading}
            className="w-full h-12 rounded-xl font-bold bg-purple-600 text-white hover:bg-purple-700 transition-all shadow-lg shadow-purple-500/20"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
            {saving ? "Guardando..." : "Actualizar Perfil IA"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
