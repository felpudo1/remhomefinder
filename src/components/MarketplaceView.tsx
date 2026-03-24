import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMarketplaceProperties } from "@/hooks/useMarketplaceProperties";
import { useSaveToList } from "@/hooks/useSaveToList";
import { useProperties } from "@/hooks/useProperties";
import { useProfile } from "@/hooks/useProfile";
import { MarketplaceCard } from "@/components/MarketplaceCard";
import { MarketplaceFilterSidebar } from "@/components/MarketplaceFilterSidebar";
import { MarketplaceProperty } from "@/types/property";
import { useToast } from "@/hooks/use-toast";
import { Search, Loader2, Store, ImageIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useSystemConfig } from "@/hooks/useSystemConfig";
import {
  MARKETPLACE_CONTACT_TIP_INTERVAL_DEFAULT,
  MARKETPLACE_CONTACT_TIP_INTERVAL_KEY,
} from "@/lib/config-keys";

/** Estados que van al final del listado con opacidad (siguen visibles pero cerradas) */
const INACTIVE_STATUSES = new Set(["reserved", "sold", "rented", "paused"]);

interface MarketplaceViewProps {
  mobileFiltersOpen?: boolean;
  onMobileFiltersClose?: () => void;
}

export function MarketplaceView({ mobileFiltersOpen = false, onMobileFiltersClose }: MarketplaceViewProps) {
  const MARKET_TIP_COUNT_KEY = "hf_market_save_tip_count";
  const MARKET_TIP_DISABLED_KEY = "hf_market_save_tip_disabled";
  const {
    value: contactTipIntervalRaw,
  } = useSystemConfig(
    MARKETPLACE_CONTACT_TIP_INTERVAL_KEY,
    MARKETPLACE_CONTACT_TIP_INTERVAL_DEFAULT
  );
  const { data: marketplaceProperties = [], isLoading } = useMarketplaceProperties();
  const { properties: userProperties } = useProperties();
  const { data: profile } = useProfile();
  const referredAgentId = profile?.referredById;

  const saveToList = useSaveToList();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<string>("");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [selectedRooms, setSelectedRooms] = useState<string>("");
  const [selectedListingType, setSelectedListingType] = useState<string>("");
  const [hideSaved, setHideSaved] = useState(true);
  const [expandPhotos, setExpandPhotos] = useState(false);
  const [matchAI, setMatchAI] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [showContactTipModal, setShowContactTipModal] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const contactTipInterval = Number.isInteger(Number(contactTipIntervalRaw)) && Number(contactTipIntervalRaw) >= 1
    ? Number(contactTipIntervalRaw)
    : Number(MARKETPLACE_CONTACT_TIP_INTERVAL_DEFAULT);

  const savedMarketplaceIds = useMemo(() => {
    return new Set(
      userProperties
        .filter((p) => p.sourceMarketplaceId)
        .map((p) => p.sourceMarketplaceId!)
    );
  }, [userProperties]);

  const neighborhoods = useMemo(() => {
    const set = new Set(marketplaceProperties.map((p) => p.neighborhood).filter(Boolean));
    return Array.from(set).sort();
  }, [marketplaceProperties]);

  const hasFilters = !!(selectedNeighborhoods.length > 0 || minPrice || maxPrice || selectedRooms || selectedListingType || selectedCurrency);

  const clearFilters = () => {
    setSelectedNeighborhoods([]);
    setSelectedCurrency("");
    setMinPrice("");
    setMaxPrice("");
    setSelectedRooms("");
    setSelectedListingType("");
    setMatchAI(false);
  };

  const handleMatchAIToggle = async (checked: boolean) => {
    setMatchAI(checked);
    if (!checked) {
      clearFilters();
      return;
    }

    if (!profile?.userId) return;

    setLoadingProfile(true);
    try {
      const { data: searchProfile, error } = await supabase
        .from('user_search_profiles')
        .select('*')
        .eq('user_id', profile.userId)
        .maybeSingle();

      if (error) throw error;

      if (!searchProfile) {
        toast({
          title: "Perfil IA no encontrado",
          description: "Primero completá tus preferencias en 'Mi Perfil' para usar MatchAI.",
          variant: "destructive"
        });
        setMatchAI(false);
        return;
      }

      // Mapear valores del perfil a los filtros
      setSelectedCurrency(searchProfile.currency || "U$S");
      setMinPrice(searchProfile.min_budget?.toString() || "");
      setMaxPrice(searchProfile.max_budget?.toString() || "");
      
      const rooms = searchProfile.min_bedrooms;
      setSelectedRooms(rooms >= 4 ? "4+" : rooms?.toString() || "");
      
      setSelectedListingType(searchProfile.operation === "Alquilar" ? "rent" : "sale");

          // Mapeo de barrios (MatchAI Pro) - Cargamos todos los barrios del perfil
          if (searchProfile.neighborhood_ids && searchProfile.neighborhood_ids.length > 0) {
            const { data: neighborhoodsData } = await supabase
              .from('neighborhoods')
              .select('name')
              .in('id', searchProfile.neighborhood_ids);
            
            if (neighborhoodsData) {
              setSelectedNeighborhoods(neighborhoodsData.map(n => n.name));
            }
          }

      toast({
        title: "MatchAI Activado 🔮",
        description: "Cargamos tus preferencias de búsqueda en los filtros.",
      });
    } catch (err) {
      console.error("MatchAI Error:", err);
      toast({
        title: "Error",
        description: "No se pudieron cargar tus preferencias.",
        variant: "destructive"
      });
      setMatchAI(false);
    } finally {
      setLoadingProfile(false);
    }
  };

  const filtered = useMemo(() => {
    let result = marketplaceProperties;

    // Las propiedades eliminadas no aparecen en el marketplace
    result = result.filter((p) => p.status !== "deleted");

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.neighborhood.toLowerCase().includes(q) ||
          p.orgName.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    // Filtrado por barrios (OR entre los seleccionados)
    if (selectedNeighborhoods.length > 0) {
      result = result.filter((p) => p.neighborhood && selectedNeighborhoods.includes(p.neighborhood));
    }

    // Filtrado por moneda (normalización entre UI y DB)
    if (selectedCurrency) {
      result = result.filter((p) => {
        const cur = (p.currency || "").toUpperCase();
        if (selectedCurrency === "U$S" || selectedCurrency === "USD") {
          return cur === "USD" || cur === "U$S";
        }
        if (selectedCurrency === "$" || selectedCurrency === "ARS" || selectedCurrency === "UYU") {
          return cur === "ARS" || cur === "UYU" || cur === "$";
        }
        return cur === selectedCurrency.toUpperCase();
      });
    }

    if (minPrice) {
      const min = Number(minPrice);
      if (!isNaN(min)) {
        result = result.filter((p) => {
          const cost = p.totalCost > 0 ? p.totalCost : (p.priceRent + p.priceExpenses);
          return cost <= 0 || cost >= min;
        });
      }
    }

    if (maxPrice) {
      const max = Number(maxPrice);
      if (!isNaN(max)) {
        result = result.filter((p) => {
          const cost = p.totalCost > 0 ? p.totalCost : (p.priceRent + p.priceExpenses);
          return cost <= 0 || cost <= max;
        });
      }
    }

    if (selectedRooms) {
      if (selectedRooms === "4+") {
        result = result.filter((p) => p.rooms >= 4);
      } else {
        result = result.filter((p) => p.rooms === Number(selectedRooms));
      }
    }

    if (selectedListingType) {
      result = result.filter((p) => p.listingType === selectedListingType);
    }

    // UX: opcionalmente ocultamos avisos guardados para evitar fatiga visual.
    if (hideSaved) {
      result = result.filter((p) => !savedMarketplaceIds.has(p.id));
    }

    // Ordenamiento PRO: 
    // 1. No guardadas vs guardadas (guardadas al final)
    // 2. Referido (Prioridad agente VIP)
    // 3. Activas vs Inactivas
    // 4. Fecha (Recientes primero)
    result = [...result].sort((a, b) => {
      const aSaved = savedMarketplaceIds.has(a.id) ? 1 : 0;
      const bSaved = savedMarketplaceIds.has(b.id) ? 1 : 0;
      if (aSaved !== bSaved) return aSaved - bSaved;

      // Prioridad socio-comercial (Referido)
      if (referredAgentId) {
        const aIsReferred = a.agentId === referredAgentId ? 0 : 1;
        const bIsReferred = b.agentId === referredAgentId ? 0 : 1;
        if (aIsReferred !== bIsReferred) return aIsReferred - bIsReferred;
      }

      const aInactive = INACTIVE_STATUSES.has(a.status) ? 1 : 0;
      const bInactive = INACTIVE_STATUSES.has(b.status) ? 1 : 0;
      if (aInactive !== bInactive) return aInactive - bInactive;

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [marketplaceProperties, searchQuery, selectedNeighborhoods, selectedCurrency, minPrice, maxPrice, selectedRooms, selectedListingType, hideSaved, savedMarketplaceIds, referredAgentId]);

  const handleSave = async (property: MarketplaceProperty) => {
    setSavingId(property.id);
    try {
      await saveToList.mutateAsync({ property });
      toast({ title: "¡Guardada!", description: `"${property.title}" fue agregada a tu listado.` });

      const isTipDisabled = localStorage.getItem(MARKET_TIP_DISABLED_KEY) === "true";
      if (!isTipDisabled) {
        const previousCount = Number(localStorage.getItem(MARKET_TIP_COUNT_KEY) || "0");
        const nextCount = previousCount + 1;
        localStorage.setItem(MARKET_TIP_COUNT_KEY, String(nextCount));
        if (nextCount === 1 || (nextCount - 1) % contactTipInterval === 0) {
          setDontShowAgain(false);
          setShowContactTipModal(true);
        }
      }
    } catch (e: unknown) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "No se pudo guardar", variant: "destructive" });
    } finally {
      setSavingId(null);
    }
  };

  const handleCloseTipModal = () => {
    if (dontShowAgain) {
      localStorage.setItem(MARKET_TIP_DISABLED_KEY, "true");
    }
    setShowContactTipModal(false);
    setDontShowAgain(false);
  };

  const activeFilterCount = [selectedNeighborhoods.length > 0, minPrice, maxPrice, selectedRooms, selectedListingType, selectedCurrency].filter(Boolean).length;

  return (
    <div className="flex gap-8">
      <MarketplaceFilterSidebar
        neighborhoods={neighborhoods}
          selectedNeighborhoods={selectedNeighborhoods}
          onNeighborhoodsChange={setSelectedNeighborhoods}
        selectedCurrency={selectedCurrency}
        onCurrencyChange={setSelectedCurrency}
        minPrice={minPrice}
        onMinPriceChange={setMinPrice}
        maxPrice={maxPrice}
        onMaxPriceChange={setMaxPrice}
        selectedRooms={selectedRooms}
        onRoomsChange={setSelectedRooms}
        selectedListingType={selectedListingType}
        onListingTypeChange={setSelectedListingType}
        onClearFilters={clearFilters}
        hasFilters={hasFilters}
        totalCount={marketplaceProperties.length}
        filteredCount={filtered.length}
        mobileOpen={mobileFiltersOpen}
        onMobileClose={onMobileFiltersClose}
      />

      <main className="flex-1 min-w-0 space-y-6">
        {/* Search */}
        <div className="max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, barrio u organización..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 rounded-xl bg-muted border-0 text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3">
            <Switch
              id="hide-saved-marketplace"
              checked={hideSaved}
              onCheckedChange={setHideSaved}
            />
            <Label htmlFor="hide-saved-marketplace" className="text-sm text-muted-foreground cursor-pointer">
              Ocultar guardados
            </Label>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              id="expand-photos-marketplace"
              checked={expandPhotos}
              onCheckedChange={setExpandPhotos}
            />
            <Label htmlFor="expand-photos-marketplace" className="text-sm text-muted-foreground cursor-pointer">
              Desplegar fotos
            </Label>
          </div>

          <div className="flex items-center gap-3 bg-purple-500/5 px-3 py-1.5 rounded-xl border border-purple-500/10 transition-all hover:bg-purple-500/10 shadow-sm">
            <Switch
              id="match-ai-toggle"
              checked={matchAI}
              onCheckedChange={handleMatchAIToggle}
              disabled={loadingProfile}
              className="data-[state=checked]:bg-purple-500"
            />
            <Label htmlFor="match-ai-toggle" className="text-sm font-bold text-foreground cursor-pointer flex items-center gap-1.5">
              MatchAI <span className="text-xs">🔮</span>
            </Label>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Store className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-medium">No hay propiedades en el HFMarket</p>
            <p className="text-sm mt-1">Las organizaciones aún no publicaron propiedades.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map((property) => {
              const isInactive = INACTIVE_STATUSES.has(property.status);
              return (
                <div
                  key={property.id}
                  className={`transition-opacity duration-300 ${isInactive ? "opacity-50 pointer-events-none" : ""}`}
                >
                  <MarketplaceCard
                    property={property}
                    onSave={handleSave}
                    isSaving={savingId === property.id}
                    alreadySaved={savedMarketplaceIds.has(property.id)}
                    isReferred={referredAgentId === property.agentId}
                    forceExpandImages={expandPhotos}
                  />
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Dialog
        open={showContactTipModal}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseTipModal();
            return;
          }
          setShowContactTipModal(true);
        }}
      >
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>Tip para tu primer contacto 💬</DialogTitle>
            <DialogDescription>
              Para ahorrarte tiempo y coordinar mejor 😊, en el primer contacto hacé todas las preguntas clave.
              Así evitás visitas que no te sirven y podés decidir mejor desde el inicio.
              Consultá por patio/fondo 🏡, mascotas 🐾, escaleras 🪜, lugar para moto o auto 🛵🚗
              y accesibilidad ♿.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="market-tip-dont-show"
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(Boolean(checked))}
            />
            <Label htmlFor="market-tip-dont-show" className="text-sm text-muted-foreground cursor-pointer">
              No mostrar más este mensaje
            </Label>
          </div>
          <DialogFooter>
            <Button onClick={handleCloseTipModal}>Entendido</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
