import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Bot, Sparkles, Building, Coins, Loader2, Home, MapPin, X, Check, ChevronsUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface BuyerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | undefined;
}

export function BuyerProfileModal({ isOpen, onClose, userId }: BuyerProfileModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [operation, setOperation] = useState("Comprar");
  const [currency, setCurrency] = useState("U$S");
  const [minBudget, setMinBudget] = useState("");
  const [budget, setBudget] = useState("");
  const [bedrooms, setBedrooms] = useState("1");
  const [openNeighborhoods, setOpenNeighborhoods] = useState(false);

  // Nuevos estados para Matchmaker Geográfico
  const [departments, setDepartments] = useState<{id: string, name: string}[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<{id: string, name: string}[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>("");
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>([]);

  useEffect(() => {
    // Obtenemos las ciudades al montar silenciosamente
    supabase.from("cities").select("*").order("name").then(({ data }) => {
      if (data) setDepartments(data);
    });
  }, []);

  useEffect(() => {
    if (selectedDept) {
      supabase.from("neighborhoods").select("*").eq("city_id", selectedDept).order("name").then(({ data }) => {
        if (data) setNeighborhoods(data);
      });
      setSelectedNeighborhoods([]); // Limpia barrios al cambiar Depto
    } else {
      setNeighborhoods([]);
    }
  }, [selectedDept]);

  const handleOperationChange = (val: string) => {
    setOperation(val);
    if (val === "Comprar") {
      setCurrency("U$S");
    } else {
      setCurrency("$");
    }
  };

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

  const handleSave = async () => {
    if (!userId) {
      onClose();
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase.from('user_search_profiles' as any).upsert({
        user_id: userId,
        operation,
        currency,
        min_budget: Number(minBudget) || 0,
        max_budget: Number(budget) || 0,
        min_bedrooms: Number(bedrooms) || 1,
        city_id: selectedDept || null,
        neighborhood_ids: selectedNeighborhoods.length > 0 ? selectedNeighborhoods : null
      }, { onConflict: 'user_id' });

      if (error) throw error;

      // Marcamos localmente para no volver a abrirlo en esta sesión, optimizando checks
      localStorage.setItem(`hf_buyer_profile_completed_${userId}`, "true");
      
      toast({
        title: "¡Perfil de IA creado con éxito!",
        description: "Ahora te mostraremos propiedades altamente relevantes para vos.",
      });
      onClose();
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "No pudimos guardar el perfil.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {
      // Bloqueado a propósito: el usuario ESTÁ OBLIGADO a llenar el perfil.
    }}>
      <DialogContent 
        className="sm:max-w-xl rounded-3xl overflow-hidden border-border bg-card p-0 shadow-2xl [&>button]:hidden"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
        
        <div className="p-8">
          <DialogHeader className="space-y-4 mb-6 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2 border border-primary/20 shadow-inner">
              <Bot className="w-8 h-8 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-black text-foreground tracking-tight flex items-center justify-center gap-2">
              Búsqueda Inteligente <Sparkles className="w-5 h-5 text-yellow-500" />
            </DialogTitle>
            <DialogDescription className="text-base font-medium text-foreground/80 leading-relaxed max-w-sm mx-auto">
              HomeFinder <strong className="text-primary">AI™</strong> ayuda a nuestra inteligencia artificial a crear tu perfil de comprador ideal para que recibas sugerencias de avisos precisos que se adecúen 100% a lo que estás buscando.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Home className="w-3.5 h-3.5" /> ¿Qué buscás?
                </Label>
                <Select value={operation} onValueChange={handleOperationChange}>
                  <SelectTrigger className="rounded-xl h-12 bg-background/50 border-input font-medium">
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
                <div className="flex bg-background/50 rounded-xl border border-input p-1 h-12">
                  {["1", "2", "3", "4+"].map((num) => (
                    <button
                      key={num}
                      onClick={() => setBedrooms(num)}
                      className={`flex-1 flex items-center justify-center rounded-lg text-sm font-bold transition-all ${
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
                <div className="w-[120px]">
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="rounded-xl h-12 bg-background/50 border-input font-medium">
                      <SelectValue placeholder="Moneda" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="U$S">Dólares (U$S)</SelectItem>
                      <SelectItem value="$">Pesos ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Input 
                  type="number" 
                  placeholder="Mínimo" 
                  value={minBudget} 
                  onChange={(e) => setMinBudget(e.target.value)} 
                  className="rounded-xl h-12 bg-background/50 border-input w-[100px]"
                />
                <Input 
                  type="number" 
                  placeholder={operation === "Comprar" ? "Máximo (Ej: 150000)" : "Máximo (Ej: 25000)"} 
                  value={budget} 
                  onChange={(e) => setBudget(e.target.value)} 
                  className="rounded-xl h-12 bg-background/50 border-input flex-1"
                />
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-2">
                <MapPin className="w-3.5 h-3.5" /> ¿Dónde estás buscando?
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select value={selectedDept} onValueChange={setSelectedDept}>
                  <SelectTrigger className="rounded-xl h-12 bg-background/50 border-input font-medium">
                    <SelectValue placeholder="Departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.length === 0 && <SelectItem value="disabled" disabled>Cargando...</SelectItem>}
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
                      className="rounded-xl h-12 bg-background/50 border-input font-medium justify-between w-full"
                      disabled={!selectedDept || neighborhoods.length === 0}
                    >
                      {!selectedDept ? "Elegí Depto primero" : "Elegí hasta 5 barrios"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 w-[--radix-popover-trigger-width] rounded-xl border-border/50 shadow-xl overflow-hidden" align="start">
                    <Command className="rounded-xl">
                      <CommandInput placeholder="Buscar barrio..." className="h-10" />
                      <CommandList className="max-h-[300px]">
                        <CommandEmpty>No se encontró el barrio.</CommandEmpty>
                        <CommandGroup>
                          {neighborhoods.map((n) => (
                            <CommandItem
                              key={n.id}
                              value={n.name}
                              onSelect={() => {
                                toggleNeighborhood(n.id);
                              }}
                              className="cursor-pointer"
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
                <div className="flex flex-wrap gap-2 mt-3 p-3 bg-muted/30 rounded-xl border border-border/50">
                  {selectedNeighborhoods.map((id) => {
                    const n = neighborhoods.find(x => x.id === id);
                    if (!n) return null;
                    return (
                      <Badge key={id} variant="secondary" className="px-3 py-1 flex items-center gap-1">
                        {n.name}
                        <X className="w-3 h-3 cursor-pointer opacity-70 hover:opacity-100" onClick={() => toggleNeighborhood(id)} />
                      </Badge>
                    )
                  })}
                </div>
              )}
            </div>

          </div>

          <DialogFooter className="mt-8 sm:justify-stretch">
            <Button 
              onClick={handleSave} 
              disabled={loading || !selectedDept || !budget.trim() || Number(budget) <= 0}
              className="w-full h-14 rounded-xl text-md font-bold shadow-lg shadow-primary/25 group transition-all"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Sparkles className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
              )}
              Activar Matchmaking IA
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
