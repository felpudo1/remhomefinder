import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMarketplaceProperties } from "@/hooks/useMarketplaceProperties";
import { useSaveToList } from "@/hooks/useSaveToList";
import { useProperties } from "@/hooks/useProperties";
import { useProfile } from "@/hooks/useProfile";
import { useGeography } from "@/hooks/useGeography";
import { MarketplaceCard } from "@/components/MarketplaceCard";
import { MarketplaceFilterSidebar } from "@/components/MarketplaceFilterSidebar";
import { MarketplaceFiltersDropdown } from "@/components/MarketplaceFiltersDropdown";
import { MarketplaceProperty } from "@/types/property";
import { useGroups } from "@/hooks/useGroups";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradePlanModal } from "@/components/UpgradePlanModal";
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
  const { 
    data, 
    isLoading, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useMarketplaceProperties();

  const marketplaceProperties = useMemo(() => {
    return Array.isArray(data) ? data : [];
  }, [data]);

  const { properties: userProperties } = useProperties();
  const { data: profile } = useProfile();
  const { isPremium } = useSubscription();
  const { groups } = useGroups();
  const userOrgId = groups?.[0]?.id || null;
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
  const [expandPhotos, setExpandPhotos] = useState(true);
  const [matchAI, setMatchAI] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [showContactTipModal, setShowContactTipModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
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

  const { neighborhoods: allNeighborhoodsData } = useGeography();
  const neighborhoods = useMemo(() => {
    // Obtener los nombres de barrios únicos disponibles en las propiedades del marketplace
    const propertyNeighborhoods = new Set(
      marketplaceProperties.map((p) => p.neighborhood).filter(Boolean)
    );
    
    // Filtrar por los barrios normalizados que tenemos en la base de datos (cacheados)
    const normalizedNames = new Set(allNeighborhoodsData.map((n) => n.name));
    return Array.from(propertyNeighborhoods)
      .filter((n) => normalizedNames.has(n))
      .sort() as string[];
  }, [marketplaceProperties, allNeighborhoodsData]);

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
    if (checked && !isPremium) {
      setShowPremiumModal(true);
      return;
    }
    
    setMatchAI(checked);
    if (!checked) {
      clearFilters();
      return;
    }

    if (!profile?.userId) return;

    setLoadingProfile(true);
    try {
      const { data: searchProfile, error } = await (supabase
        .from('user_search_profiles')
        .select('*')
        .eq('user_id', profile.userId as any)
        .maybeSingle() as any);

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
            const { data: neighborhoodsData } = await (supabase
              .from('neighborhoods')
              .select('name')
              .in('id', searchProfile.neighborhood_ids) as any);
            
            if (neighborhoodsData) {
              setSelectedNeighborhoods(neighborhoodsData.map((n: any) => n.name));
            }
          }

      toast({
        title: "MatchAI Activado 🔮",
        description: "Acá es donde empieza la magia, MatchAI trabajando para ti.",
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
    result = result.filter((p) => p.status !== "eliminado");

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

  const isMatchAIMagicActive = matchAI && filtered.length > 0;

  const filterPanelProps = {
    neighborhoods,
    selectedNeighborhoods,
    onNeighborhoodsChange: setSelectedNeighborhoods,
    selectedCurrency,
    onCurrencyChange: setSelectedCurrency,
    minPrice,
    onMinPriceChange: setMinPrice,
    maxPrice,
    onMaxPriceChange: setMaxPrice,
    selectedRooms,
    onRoomsChange: setSelectedRooms,
    selectedListingType,
    onListingTypeChange: setSelectedListingType,
    onClearFilters: clearFilters,
    hasFilters,
    totalCount: marketplaceProperties.length,
    filteredCount: filtered.length,
  };

  return (
    <>
      <MarketplaceFilterSidebar
        {...filterPanelProps}
        mobileOpen={mobileFiltersOpen}
        onMobileClose={onMobileFiltersClose}
      />

      <main className="flex-1 min-w-0 space-y-6">
        {/* Filtro → buscador → switches; en lg una misma línea (con wrap si falta espacio) */}
        <div className="flex flex-col gap-4 min-w-0 lg:flex-row lg:flex-wrap lg:items-center lg:gap-x-4 lg:gap-y-3">
          <div className="hidden lg:block shrink-0 order-first">
            <MarketplaceFiltersDropdown {...filterPanelProps} />
          </div>
          <div className="relative w-full min-w-0 lg:flex-1 lg:max-w-md xl:max-w-lg lg:order-none order-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Buscar por título, barrio o agencia..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 w-full rounded-xl bg-muted border-0 text-sm"
            />
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 shrink-0 lg:order-none order-2">
            <div className="flex items-center gap-3">
              <Switch
                id="hide-saved-marketplace"
                checked={hideSaved}
                onCheckedChange={setHideSaved}
              />
              <Label htmlFor="hide-saved-marketplace" className="text-sm text-muted-foreground cursor-pointer whitespace-nowrap">
                Ocultar guardados
              </Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="expand-photos-marketplace"
                checked={expandPhotos}
                onCheckedChange={setExpandPhotos}
              />
              <Label htmlFor="expand-photos-marketplace" className="text-sm text-muted-foreground cursor-pointer whitespace-nowrap">
                Mostrar fotos
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
              <Label htmlFor="match-ai-toggle" className="text-sm font-bold text-foreground cursor-pointer flex items-center gap-1.5 whitespace-nowrap">
                MatchAI <span className="text-xs">🔮</span>
              </Label>
            </div>
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
          <>
            {matchAI && filtered.length > 0 && (
              <div className="relative overflow-hidden rounded-xl py-1.5 px-3 mb-2 animate-in fade-in slide-in-from-top-4 duration-500 bg-gradient-to-r from-purple-500/5 via-purple-400/10 to-purple-500/5 shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                style={{
                  border: '1.5px solid transparent',
                  backgroundClip: 'padding-box',
                }}
              >
                {/* Animated glow border */}
                <div className="absolute inset-0 rounded-xl pointer-events-none" style={{
                  background: 'linear-gradient(90deg, rgba(168,85,247,0.08), rgba(168,85,247,0.35), rgba(192,132,252,0.5), rgba(168,85,247,0.35), rgba(168,85,247,0.08))',
                  backgroundSize: '200% 100%',
                  animation: 'matchai-border-glow 3s ease-in-out infinite',
                  mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  maskComposite: 'exclude',
                  WebkitMaskComposite: 'xor',
                  padding: '1.5px',
                  borderRadius: 'inherit',
                }} />
                <div className="absolute top-1 right-2 text-purple-400/60 text-[10px] animate-pulse" style={{ animationDelay: '0.5s' }}>✦</div>
                <div className="absolute bottom-1 right-6 text-purple-300/40 text-[8px] animate-pulse" style={{ animationDelay: '1.2s' }}>✧</div>
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-400/10 via-transparent to-transparent pointer-events-none rounded-xl" />
                <div className="relative flex items-center gap-2">
                  <span className="text-base animate-pulse">🔮</span>
                  <p className="text-xs font-semibold text-foreground">
                    MatchAI encontró {filtered.length} {filtered.length === 1 ? "propiedad" : "propiedades"} para ti
                  </p>
                </div>
              </div>
            )}
            <div
              className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch ${matchAI ? "animate-in fade-in slide-in-from-bottom-4 duration-700" : ""}`}
            >
              {filtered.map((property, i) => {
                const isInactive = INACTIVE_STATUSES.has(property.status);
                return (
                  <div
                    key={property.id}
                    className={`h-full min-h-0 transition-opacity duration-300 ${isInactive ? "opacity-50 pointer-events-none" : ""} ${isMatchAIMagicActive && !isInactive ? "matchai-card-glow rounded-2xl" : ""}`}
                    style={matchAI ? { animationDelay: `${i * 80}ms`, animationFillMode: "backwards" } : undefined}
                  >
                    <MarketplaceCard
                      property={property}
                      onSave={handleSave}
                      isSaving={savingId === property.id}
                      alreadySaved={savedMarketplaceIds.has(property.id)}
                      isReferred={referredAgentId === property.agentId}
                      forceExpandImages={expandPhotos}
                      isMatchAIMagicActive={isMatchAIMagicActive && !isInactive}
                      matchAIRank={i}
                      userOrgId={userOrgId}
                    />
                  </div>
                );
              })}
            </div>

            {hasNextPage && (
              <div className="flex justify-center pt-8 pb-4">
                <Button
                  variant="outline"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="gap-2 rounded-xl border-purple-500/20 hover:bg-purple-500/5 hover:text-purple-600 transition-all font-medium"
                >
                  {isFetchingNextPage ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Cargando más...
                    </>
                  ) : (
                    "Cargar más propiedades"
                  )}
                </Button>
              </div>
            )}
          </>
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
      <UpgradePlanModal
        open={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
      />
    </>
  );
}
