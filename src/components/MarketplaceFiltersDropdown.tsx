import { useState } from "react";
import { Store, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { MarketplaceFiltersPanelProps } from "@/components/MarketplaceFilterSidebar";
import { MarketplaceFiltersPanel } from "@/components/MarketplaceFilterSidebar";
import { cn } from "@/lib/utils";

export type MarketplaceFiltersDropdownProps = Omit<MarketplaceFiltersPanelProps, "panelVariant" | "onMobileClose">;

/**
 * Botón desplegable de filtros exclusivo del HFMarket (estilo tienda / acento violeta).
 * No comparte trigger ni copy con el listado del usuario.
 */
export function MarketplaceFiltersDropdown(props: MarketplaceFiltersDropdownProps) {
  const [open, setOpen] = useState(false);

  const activeChips =
    (props.selectedNeighborhoods?.length ?? 0) +
    (props.minPrice ? 1 : 0) +
    (props.maxPrice ? 1 : 0) +
    (props.selectedRooms ? 1 : 0) +
    (props.selectedListingType ? 1 : 0) +
    (props.selectedCurrency ? 1 : 0);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-2 h-10 px-3.5 rounded-xl text-sm font-semibold transition-all",
            "border shadow-sm",
            "bg-purple-500/[0.06] border-purple-500/25 text-foreground hover:bg-purple-500/10 hover:border-purple-500/40",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/30"
          )}
        >
          <Store className="w-4 h-4 text-purple-600 shrink-0" />
          <span className="hidden sm:inline">Filtros HFMarket</span>
          <span className="sm:hidden">Filtros</span>
          {activeChips > 0 && (
            <span className="min-w-[1.25rem] h-5 px-1 rounded-full bg-purple-600 text-white text-[11px] font-bold flex items-center justify-center">
              {activeChips}
            </span>
          )}
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 opacity-80" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-[min(100vw-1.5rem,22rem)] max-h-[min(85vh,560px)] overflow-y-auto overscroll-y-contain p-0 border-purple-500/15 shadow-lg"
      >
        <div className="p-3">
          <MarketplaceFiltersPanel {...props} panelVariant="popover" />
        </div>
      </PopoverContent>
    </Popover>
  );
}
