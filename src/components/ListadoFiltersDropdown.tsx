import { useState } from "react";
import { ListFilter, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { ListadoFiltersPanelProps } from "@/components/FilterSidebar";
import { ListadoFiltersPanel } from "@/components/FilterSidebar";
import { cn } from "@/lib/utils";

export type ListadoFiltersDropdownProps = Omit<ListadoFiltersPanelProps, "panelVariant" | "onMobileClose">;

/**
 * Desplegable de filtros del Mi listado: trigger y estilo distintos al HFMarket (énfasis en listado / filas).
 */
export function ListadoFiltersDropdown(props: ListadoFiltersDropdownProps) {
  const [open, setOpen] = useState(false);
  const extraSort = props.sortBy !== "newest" ? 1 : 0;
  const activeCount = props.selectedStatuses.length + extraSort;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-2 h-10 px-3.5 rounded-xl text-sm font-medium transition-colors",
            "border border-border bg-card text-foreground hover:bg-muted/80",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          )}
        >
          <ListFilter className="w-4 h-4 text-primary shrink-0" />
          <span className="hidden sm:inline">Filtrar mi listado</span>
          <span className="sm:hidden">Filtros</span>
          {activeCount > 0 && (
            <span className="min-w-[1.25rem] h-5 px-1 rounded-md bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center">
              {activeCount}
            </span>
          )}
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-[min(100vw-1.5rem,22rem)] max-h-[min(85vh,560px)] overflow-y-auto overscroll-y-contain p-0"
      >
        <div className="p-3">
          <ListadoFiltersPanel {...props} panelVariant="popover" />
        </div>
      </PopoverContent>
    </Popover>
  );
}
