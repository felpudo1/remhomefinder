import { useState, useMemo } from "react";
import { useMarketplaceProperties } from "@/hooks/useMarketplaceProperties";
import { useSaveToList } from "@/hooks/useSaveToList";
import { useProperties } from "@/hooks/useProperties";
import { MarketplaceCard } from "@/components/MarketplaceCard";
import { MarketplaceProperty } from "@/types/property";
import { useToast } from "@/hooks/use-toast";
import { Search, Loader2, Store, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export function MarketplaceView() {
  const { data: marketplaceProperties = [], isLoading } = useMarketplaceProperties();
  const { properties: userProperties } = useProperties();
  const saveToList = useSaveToList();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [selectedRooms, setSelectedRooms] = useState<string>("");

  // IDs of marketplace properties already saved by the user
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

  const hasFilters = selectedNeighborhood || maxPrice || selectedRooms;

  const clearFilters = () => {
    setSelectedNeighborhood("");
    setMaxPrice("");
    setSelectedRooms("");
  };

  const filtered = useMemo(() => {
    let result = marketplaceProperties;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.neighborhood.toLowerCase().includes(q) ||
          p.agencyName.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    if (selectedNeighborhood) {
      result = result.filter((p) => p.neighborhood === selectedNeighborhood);
    }

    if (maxPrice) {
      const max = Number(maxPrice);
      if (!isNaN(max)) {
        result = result.filter((p) => p.totalCost <= max);
      }
    }

    if (selectedRooms) {
      if (selectedRooms === "4+") {
        result = result.filter((p) => p.rooms >= 4);
      } else {
        result = result.filter((p) => p.rooms === Number(selectedRooms));
      }
    }

    return result;
  }, [marketplaceProperties, searchQuery, selectedNeighborhood, maxPrice, selectedRooms]);

  const handleSave = async (property: MarketplaceProperty) => {
    setSavingId(property.id);
    try {
      await saveToList.mutateAsync({ property });
      toast({ title: "¡Guardada!", description: `"${property.title}" fue agregada a tu listado.` });
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "No se pudo guardar", variant: "destructive" });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="max-w-md relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por título, barrio o agencia..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-10 rounded-xl bg-muted border-0 text-sm"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={selectedNeighborhood} onValueChange={setSelectedNeighborhood}>
          <SelectTrigger className="w-[180px] h-9 rounded-xl bg-muted border-0 text-sm">
            <SelectValue placeholder="Barrio" />
          </SelectTrigger>
          <SelectContent>
            {neighborhoods.map((n) => (
              <SelectItem key={n} value={n}>{n}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative w-[160px]">
          <Input
            type="number"
            placeholder="Precio máx."
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="h-9 rounded-xl bg-muted border-0 text-sm pr-8"
          />
        </div>

        <div className="flex gap-1">
          {["1", "2", "3", "4+"].map((r) => (
            <Button
              key={r}
              variant={selectedRooms === r ? "default" : "outline"}
              size="sm"
              className="rounded-xl h-9 min-w-[36px] text-sm"
              onClick={() => setSelectedRooms(selectedRooms === r ? "" : r)}
            >
              {r} amb
            </Button>
          ))}
        </div>

        {hasFilters && (
          <Button variant="ghost" size="sm" className="h-9 text-sm text-muted-foreground" onClick={clearFilters}>
            <X className="w-3.5 h-3.5 mr-1" />
            Limpiar
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Store className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="font-medium">No hay propiedades en el HFMarket</p>
          <p className="text-sm mt-1">Las agencias aún no publicaron propiedades.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((property) => (
            <MarketplaceCard
              key={property.id}
              property={property}
              onSave={handleSave}
              isSaving={savingId === property.id}
              alreadySaved={savedMarketplaceIds.has(property.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
