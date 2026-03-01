import { SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface MarketplaceFilterSidebarProps {
  neighborhoods: string[];
  selectedNeighborhood: string;
  onNeighborhoodChange: (v: string) => void;
  maxPrice: string;
  onMaxPriceChange: (v: string) => void;
  selectedRooms: string;
  onRoomsChange: (v: string) => void;
  selectedListingType: string;
  onListingTypeChange: (v: string) => void;
  onClearFilters: () => void;
  hasFilters: boolean;
  totalCount: number;
  filteredCount: number;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function MarketplaceFilterSidebar({
  neighborhoods,
  selectedNeighborhood,
  onNeighborhoodChange,
  maxPrice,
  onMaxPriceChange,
  selectedRooms,
  onRoomsChange,
  selectedListingType,
  onListingTypeChange,
  onClearFilters,
  hasFilters,
  totalCount,
  filteredCount,
  mobileOpen = false,
  onMobileClose,
}: MarketplaceFilterSidebarProps) {
  const panelContent = (
    <div className="bg-card rounded-2xl p-5 card-shadow sticky top-24 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
          <span className="font-semibold text-sm text-foreground">Filtros</span>
        </div>
        <div className="flex items-center gap-2">
          {hasFilters && (
            <button
              onClick={onClearFilters}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <X className="w-3 h-3" />
              Limpiar
            </button>
          )}
          {onMobileClose && (
            <button
              onClick={onMobileClose}
              className="md:hidden text-muted-foreground hover:text-foreground transition-colors p-1"
              aria-label="Cerrar filtros"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Contador */}
      <div className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2">
        Mostrando{" "}
        <span className="font-semibold text-foreground">{filteredCount}</span> de{" "}
        <span className="font-semibold text-foreground">{totalCount}</span> propiedades
      </div>

      {/* Tipo de operación */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tipo</p>
        <div className="grid grid-cols-3 gap-1.5">
          {[{ value: "", label: "Todos" }, { value: "rent", label: "Alquiler" }, { value: "sale", label: "Venta" }].map((opt) => (
            <Button
              key={opt.value}
              variant={selectedListingType === opt.value ? "default" : "outline"}
              size="sm"
              className="rounded-xl h-9 text-sm"
              onClick={() => onListingTypeChange(selectedListingType === opt.value ? "" : opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Barrio */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Barrio</p>
        <Select value={selectedNeighborhood} onValueChange={onNeighborhoodChange}>
          <SelectTrigger className="w-full h-9 rounded-xl bg-muted border-0 text-sm">
            <SelectValue placeholder="Todos los barrios" />
          </SelectTrigger>
          <SelectContent>
            {neighborhoods.map((n) => (
              <SelectItem key={n} value={n}>{n}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Precio máximo */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Precio máximo</p>
        <Input
          type="number"
          placeholder="Sin límite"
          value={maxPrice}
          onChange={(e) => onMaxPriceChange(e.target.value)}
          className="h-9 rounded-xl bg-muted border-0 text-sm"
        />
      </div>

      {/* Ambientes */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ambientes</p>
        <div className="grid grid-cols-4 gap-1.5">
          {["1", "2", "3", "4+"].map((r) => (
            <Button
              key={r}
              variant={selectedRooms === r ? "default" : "outline"}
              size="sm"
              className="rounded-xl h-9 text-sm"
              onClick={() => onRoomsChange(selectedRooms === r ? "" : r)}
            >
              {r}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden md:block w-64 shrink-0">{panelContent}</aside>

      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
            onClick={onMobileClose}
          />
          <div className="fixed inset-y-0 left-0 w-72 z-50 md:hidden overflow-y-auto bg-background p-4 shadow-2xl animate-slide-in-from-left">
            {panelContent}
          </div>
        </>
      )}
    </>
  );
}
