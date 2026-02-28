import { useState, useMemo } from "react";
import { useMarketplaceProperties } from "@/hooks/useMarketplaceProperties";
import { useSaveToList } from "@/hooks/useSaveToList";
import { useProperties } from "@/hooks/useProperties";
import { MarketplaceCard } from "@/components/MarketplaceCard";
import { MarketplaceProperty } from "@/types/property";
import { useToast } from "@/hooks/use-toast";
import { Search, Loader2, Store } from "lucide-react";
import { Input } from "@/components/ui/input";

export function MarketplaceView() {
  const { data: marketplaceProperties = [], isLoading } = useMarketplaceProperties();
  const { properties: userProperties } = useProperties();
  const saveToList = useSaveToList();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  // IDs of marketplace properties already saved by the user
  const savedMarketplaceIds = useMemo(() => {
    return new Set(
      userProperties
        .filter((p) => p.sourceMarketplaceId)
        .map((p) => p.sourceMarketplaceId!)
    );
  }, [userProperties]);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return marketplaceProperties;
    const q = searchQuery.toLowerCase();
    return marketplaceProperties.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.neighborhood.toLowerCase().includes(q) ||
        p.agencyName.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }, [marketplaceProperties, searchQuery]);

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

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Store className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="font-medium">No hay propiedades en el Market</p>
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
