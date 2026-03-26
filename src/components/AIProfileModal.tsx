import { useEffect, useState, useMemo } from "react";
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
import { useGeography } from "@/hooks/useGeography";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useSystemConfig } from "@/hooks/useSystemConfig";
import { APP_BRAND_NAME_KEY, APP_BRAND_NAME_DEFAULT } from "@/lib/config-keys";

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
  const [selectedDept, setSelectedDept] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>([]);
  const [openNeighborhoods, setOpenNeighborhoods] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const { value: appBrandName } = useSystemConfig(APP_BRAND_NAME_KEY, APP_BRAND_NAME_DEFAULT);

  const { departments: allDepts, cities: allCities, neighborhoods: allNeighborhoods } = useGeography();

  // Filtrar solo departamentos de Uruguay (country = "UY")
  const departments = useMemo(() => {
    // Nota: El hook useGeography ya nos da los datos, aquí aplicamos el filtro de UY si fuera necesario.
    // Actualmente el hook trae todo ordenado.
    return allDepts;
  }, [allDepts]);

  // Filtrar ciudades por depto
  const cities = useMemo(() => {
    if (!selectedDept) return [];
    return allCities.filter(c => c.department_id === selectedDept);
  }, [allCities, selectedDept]);

  // Filtrar barrios por ciudad
  const neighborhoods = useMemo(() => {
    if (!selectedCity) return [];
    return allNeighborhoods.filter(n => n.city_id === selectedCity);
  }, [allNeighborhoods, selectedCity]);

  useEffect(() => {
    if (isOpen && userId) {
      const fetchProfile = async () => {
        setLoading(true);
        try {
          const { data, error } = await (supabase
            .from('user_search_profiles')
            .select('*')
            .eq('user_id', userId as any)
            .maybeSingle() as any);

          if (error) throw error;
          if (data) {
            setOperation(data.operation || "Comprar");
            setCurrency(data.currency || "U$S");
            setMinBudget(data.min_budget?.toString() || "");
            setMaxBudget(data.max_budget?.toString() || "");
            setBedrooms(data.min_bedrooms?.toString() || "1");
            if (data.city_id) {
              const { data: cityData } = await (supabase
                .from("cities")
                .select("id, department_id")
                .eq("id", data.city_id as any)
                .maybeSingle() as any);
              if (cityData) {
                setSelectedCity(cityData.id);
                if (cityData.department_id) {
                  setSelectedDept(cityData.department_id);
                }
              }
            }
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
      const { error } = await (supabase.from('user_search_profiles') as any).upsert({
        user_id: userId,
        operation,
        currency,
        min_budget: Number(minBudget) || 0,
        max_budget: Number(maxBudget) || 0,
        min_bedrooms: bedrooms === "4+" ? 4 : (Number(bedrooms) || 1),
        city_id: selectedCity || null,
        neighborhood_ids: selectedNeighborhoods.length > 0 ? selectedNeighborhoods : null,
        is_private: isPrivate,
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
              Tu perfil está siendo analizado por nuestra IA y realiza la magia de encontrar propiedades que coincidan con tus gustos. Esto te facilita la busqueda y brinda la posibilidad que los agentes puedan ver lo que estas necesitando y ofrecerte oportunidades exclusivas.
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
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Ubicación
                </Label>
                {/* Selector de país — UY activo, resto próximamente (internacionalización futura) */}
                <Select value="uy">
                  <SelectTrigger className="w-[140px] h-8 rounded-xl bg-muted/60 border-border/40 text-xs font-semibold text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className="text-base leading-none">🇺🇾</span>
                      Uruguay
                    </span>
                  </SelectTrigger>
                  <SelectContent align="end" className="w-[160px]">
                    {/* País activo */}
                    <SelectItem value="uy">🇺🇾 Uruguay</SelectItem>
                    {/* Próximamente — solo visual, deshabilitados */}
                    <SelectItem value="ar" disabled className="opacity-40">🇦🇷 Argentina</SelectItem>
                    <SelectItem value="br" disabled className="opacity-40">🇧🇷 Brasil</SelectItem>
                    <SelectItem value="cl" disabled className="opacity-40">🇨🇱 Chile</SelectItem>
                    <SelectItem value="py" disabled className="opacity-40">🇵🇾 Paraguay</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <Select value={selectedDept} onValueChange={(val) => {
                  setSelectedDept(val);
                  setSelectedCity("");
                  setSelectedNeighborhoods([]);
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

                <Select value={selectedCity} onValueChange={(val) => {
                  setSelectedCity(val);
                  setSelectedNeighborhoods([]);
                }} disabled={!selectedDept}>
                  <SelectTrigger className="rounded-xl h-11 bg-background/50 border-input font-medium">
                    <SelectValue placeholder="Ciudad" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
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
                      disabled={!selectedCity}
                    >
                      {selectedNeighborhoods.length > 0 ? `Seleccionados (${selectedNeighborhoods.length})` : "Elegí hasta 5 barrios"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 w-[--radix-popover-trigger-width] rounded-xl border-border/50 shadow-xl overflow-hidden" align="start">
                    <Command className="rounded-xl">
                      <CommandInput placeholder="Buscar barrio..." className="h-10" />
                      <CommandList className="max-h-[min(55vh,320px)] overscroll-y-contain touch-pan-y neighborhood-cmd-list">
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

          </div>

          <div className="bg-purple-500/5 rounded-2xl border border-purple-500/10 p-5 space-y-4 relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-purple-500" />
                <Label htmlFor="ai-privacy" className="text-sm font-bold text-foreground cursor-pointer">Modo Privado</Label>
              </div>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              ) : (
                <Switch
                  id="ai-privacy"
                  checked={isPrivate}
                  onCheckedChange={setIsPrivate}
                  disabled={saving}
                  className="data-[state=checked]:bg-purple-500 scale-90"
                />
              )}
            </div>
            
            <div className="border-t border-purple-500/10 pt-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-purple-500/80">
                <Shield className="w-3.5 h-3.5" /> Compromiso de Privacidad
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed font-medium relative z-10">
                En <span className="text-foreground font-bold italic">{appBrandName}</span>, el usuario es el único dueño de sus datos y tiene el control total del algoritmo.
                Tenés la libertad de decidir cómo querés que nuestra tecnología trabaje para vos: podés usar la plataforma como un
                <span className="text-foreground font-bold"> organizador personal privado y buscar casa como buscaron tus abuelos en 1930</span> o activar nuestra inteligencia colectiva como un puente hacia oportunidades exclusivas con agentes profesionales.
                <span className="text-purple-500 font-bold ml-1">Vos tenés la llave.</span>
              </p>
            </div>
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
