import { PropertyStatus, STATUS_CONFIG } from "@/types/property";
import { Input } from "@/components/ui/input";
import { SlidersHorizontal, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";

type SortOption = "total-asc" | "total-desc" | "newest" | "oldest";

/** Props del formulario de filtros del listado (drawer y popover) */
export interface ListadoFiltersPanelProps {
  selectedStatuses: PropertyStatus[];
  onStatusToggle: (status: PropertyStatus) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  onClearFilters: () => void;
  totalCount: number;
  filteredCount: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  panelVariant: "drawer" | "popover";
  onMobileClose?: () => void;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Más recientes" },
  { value: "oldest", label: "Más antiguos" },
  { value: "total-asc", label: "Precio: menor a mayor" },
  { value: "total-desc", label: "Precio: mayor a menor" },
];

/**
 * Panel de filtros y orden del listado del usuario (misma lógica en drawer y popover).
 */
export function ListadoFiltersPanel({
  selectedStatuses,
  onStatusToggle,
  sortBy,
  onSortChange,
  onClearFilters,
  totalCount,
  filteredCount,
  searchQuery,
  onSearchChange,
  panelVariant,
  onMobileClose,
}: ListadoFiltersPanelProps) {
  const hasActiveFilters = selectedStatuses.length > 0 || sortBy !== "newest";
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
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <X className="w-3 h-3" />
              Clear
            </button>
          )}
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

      {/* En escritorio el buscador va en la barra principal (Index); en drawer móvil queda acá */}
      {isDrawer && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar propiedad..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9 rounded-xl bg-muted border-0 text-sm"
          />
        </div>
      )}

      <div className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2">
        Mostrando <span className="font-semibold text-foreground">{filteredCount}</span> de{" "}
        <span className="font-semibold text-foreground">{totalCount}</span> propiedades
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estado</p>
        <div className="space-y-1.5">
          {(Object.entries(STATUS_CONFIG) as [PropertyStatus, (typeof STATUS_CONFIG)[PropertyStatus]][])
            .filter(([key]) => key !== "visitado" && key !== "a_analizar" && key !== "eliminado")
            .map(([key, cfg]) => {
              const isSelected = selectedStatuses.includes(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onStatusToggle(key)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                    isSelected
                      ? `${cfg.bg} ${cfg.color} font-medium`
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                  {cfg.label}
                </button>
              );
            })}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ordenar por</p>
        <div className="space-y-1.5">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onSortChange(opt.value)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                sortBy === opt.value
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

interface FilterSidebarProps extends Omit<ListadoFiltersPanelProps, "panelVariant"> {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

/**
 * Solo drawer móvil/tablet del listado (lg hacia abajo). En lg+ usar ListadoFiltersDropdown.
 */
export function FilterSidebar({
  mobileOpen = false,
  onMobileClose,
  ...panelProps
}: FilterSidebarProps) {
  if (!mobileOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onMobileClose} />
      <div className="fixed inset-y-0 left-0 w-72 z-50 lg:hidden overflow-y-auto bg-background p-4 shadow-2xl animate-slide-in-from-left">
        <ListadoFiltersPanel {...panelProps} panelVariant="drawer" onMobileClose={onMobileClose} />
      </div>
    </>
  );
}
