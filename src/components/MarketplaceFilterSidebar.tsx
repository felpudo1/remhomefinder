import { SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type MarketplaceSortOption = "recent" | "oldest" | "price_asc" | "price_desc";

const SORT_OPTIONS: { value: MarketplaceSortOption; label: string }[] = [
  { value: "recent", label: "Más recientes" },
  { value: "oldest", label: "Más antiguos" },
  { value: "price_asc", label: "Menor precio" },
  { value: "price_desc", label: "Mayor precio" },
];

/** Props compartidas entre drawer móvil y panel dentro del popover de escritorio */
export interface MarketplaceFiltersPanelProps {
  neighborhoods: string[];
  selectedNeighborhoods: string[];
  onNeighborhoodsChange: (v: string[]) => void;
  selectedCurrency: string;
  onCurrencyChange: (v: string) => void;
  minPrice: string;
  onMinPriceChange: (v: string) => void;
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
  sortBy: MarketplaceSortOption;
  onSortChange: (v: MarketplaceSortOption) => void;
  /** drawer: barra lateral móvil con botón cerrar · popover: sin sticky, para desplegable */
  panelVariant: "drawer" | "popover";
  /** Solo en drawer: callback para la X del header */
  onMobileClose?: () => void;
}

/**
 * Formulario de filtros del marketplace (misma lógica en drawer y en popover).
 */
export function MarketplaceFiltersPanel({
  neighborhoods,
  selectedNeighborhoods,
  onNeighborhoodsChange,
  selectedCurrency,
  onCurrencyChange,
  minPrice,
  onMinPriceChange,
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
  sortBy,
  onSortChange,
  panelVariant,
  onMobileClose,
}: MarketplaceFiltersPanelProps) {
  const isDrawer = panelVariant === "drawer";

  return (
    <div
      className={cn(
        "bg-card rounded-2xl p-5 card-shadow space-y-6",
        panelVariant === "popover" && "rounded-xl shadow-none border-0"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
          <span className="font-semibold text-sm text-foreground">Filtros</span>
        </div>
        <div className="flex items-center gap-2">
          {isDrawer && onMobileClose && (
            <button
              type="button"
              onClick={onMobileClose}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
              aria-label="Cerrar filtros"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2 flex items-center justify-between">
          <span>
            Mostrando <span className="font-semibold text-foreground">{filteredCount}</span> de{" "}
            <span className="font-semibold text-foreground">{totalCount}</span>
          </span>
        </div>

        {hasFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            className="w-full rounded-xl border-dashed border-primary/30 hover:border-primary hover:bg-primary/5 text-primary text-xs font-bold gap-2 h-9 transition-all animate-in fade-in slide-in-from-top-1"
          >
            <X className="w-3.5 h-3.5" />
            Limpiar todos los filtros
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ordenar por</p>
        <Select value={sortBy} onValueChange={(v) => onSortChange(v as MarketplaceSortOption)}>
          <SelectTrigger className="w-full h-9 rounded-xl bg-muted border-0 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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

      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Barrios</p>
        <Select
          onValueChange={(value) => {
            if (value && !selectedNeighborhoods.includes(value)) {
              onNeighborhoodsChange([...selectedNeighborhoods, value]);
            }
          }}
        >
          <SelectTrigger className="w-full h-9 rounded-xl bg-muted border-0 text-sm">
            <SelectValue placeholder="Agregar barrio..." />
          </SelectTrigger>
          <SelectContent
            className="max-h-[min(75vh,26rem)] w-[min(calc(100vw-1.5rem),var(--radix-select-trigger-width))] min-w-[var(--radix-select-trigger-width)] sm:max-h-96 sm:w-auto"
            viewportClassName="!h-auto max-h-[min(70vh,24rem)] min-h-[9rem] overflow-y-auto overscroll-y-contain touch-pan-y neighborhood-select-viewport"
          >
            {neighborhoods
              .filter((n) => !selectedNeighborhoods.includes(n))
              .map((n) => (
                <SelectItem key={n} value={n}>
                  {n}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>

        {selectedNeighborhoods.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {selectedNeighborhoods.map((n) => (
              <div
                key={n}
                className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-[11px] font-bold rounded-lg border border-primary/20 animate-in zoom-in-95 duration-200"
              >
                {n}
                <button
                  type="button"
                  onClick={() => onNeighborhoodsChange(selectedNeighborhoods.filter((item) => item !== n))}
                  className="hover:text-primary-foreground hover:bg-primary rounded-full p-0.5 transition-colors"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Moneda</p>
          <div className="grid grid-cols-2 gap-1.5">
            {[{ value: "U$S", label: "Dólares" }, { value: "$", label: "Pesos" }].map((opt) => (
              <Button
                key={opt.value}
                variant={selectedCurrency === opt.value ? "default" : "outline"}
                size="sm"
                className="rounded-xl h-9 text-sm"
                onClick={() => onCurrencyChange(selectedCurrency === opt.value ? "" : opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rango de Precio</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground font-medium ml-1">Mínimo</span>
              <Input
                type="number"
                placeholder="0"
                value={minPrice}
                onChange={(e) => onMinPriceChange(e.target.value)}
                className="h-9 rounded-xl bg-muted border-0 text-sm"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground font-medium ml-1">Máximo</span>
              <Input
                type="number"
                placeholder="Sin límite"
                value={maxPrice}
                onChange={(e) => onMaxPriceChange(e.target.value)}
                className="h-9 rounded-xl bg-muted border-0 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

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
}

interface MarketplaceFilterSidebarProps extends Omit<MarketplaceFiltersPanelProps, "panelVariant"> {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

/**
 * Solo drawer móvil del marketplace (md hacia abajo). En md+ los filtros van en MarketplaceFiltersDropdown.
 */
export function MarketplaceFilterSidebar({
  mobileOpen = false,
  onMobileClose,
  ...panelProps
}: MarketplaceFilterSidebarProps) {
  if (!mobileOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onMobileClose} />
      <div className="fixed inset-y-0 left-0 w-72 z-50 lg:hidden overflow-y-auto bg-background p-4 shadow-2xl animate-slide-in-from-left">
        <MarketplaceFiltersPanel {...panelProps} panelVariant="drawer" onMobileClose={onMobileClose} />
      </div>
    </>
  );
}
