import { PropertyStatus, STATUS_CONFIG } from "@/types/property";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SlidersHorizontal, X, Search } from "lucide-react";
import { UserReferralSection } from "@/components/UserReferralSection";

type SortOption = "total-asc" | "total-desc" | "newest" | "oldest";

interface FilterSidebarProps {
  selectedStatuses: PropertyStatus[];
  onStatusToggle: (status: PropertyStatus) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  onClearFilters: () => void;
  totalCount: number;
  filteredCount: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  // Props para mobile: controlan apertura/cierre del drawer
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Más recientes" },
  { value: "oldest", label: "Más antiguos" },
  { value: "total-asc", label: "Precio: menor a mayor" },
  { value: "total-desc", label: "Precio: mayor a menor" },
];

export function FilterSidebar({
  selectedStatuses,
  onStatusToggle,
  sortBy,
  onSortChange,
  onClearFilters,
  totalCount,
  filteredCount,
  searchQuery,
  onSearchChange,
  mobileOpen = false,
  onMobileClose,
}: FilterSidebarProps) {
  const hasActiveFilters = selectedStatuses.length > 0 || sortBy !== "newest";

  // Contenido del panel de filtros (reutilizado en desktop y mobile)
  const panelContent = (
    <div className="bg-card rounded-2xl p-5 card-shadow sticky top-24 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
          <span className="font-semibold text-sm text-foreground">Filtros</span>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <X className="w-3 h-3" />
              Clear
            </button>
          )}
          {/* Botón X solo visible en mobile para cerrar el drawer */}
          {onMobileClose && (
            <button
              onClick={onMobileClose}
              className="lg:hidden text-muted-foreground hover:text-foreground transition-colors p-1"
              aria-label="Cerrar filtros"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar propiedad..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-9 rounded-xl bg-muted border-0 text-sm"
        />
      </div>

      {/* Contador de resultados */}
      <div className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2">
        Mostrando{" "}
        <span className="font-semibold text-foreground">{filteredCount}</span> de{" "}
        <span className="font-semibold text-foreground">{totalCount}</span> propiedades
      </div>

      {/* Filtro por estado */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Estado
        </p>
        <div className="space-y-1.5">
          {(Object.entries(STATUS_CONFIG) as [PropertyStatus, typeof STATUS_CONFIG[PropertyStatus]][]).map(
            ([key, cfg]) => {
              const isSelected = selectedStatuses.includes(key);
              return (
                <button
                  key={key}
                  onClick={() => onStatusToggle(key)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${isSelected
                    ? `${cfg.bg} ${cfg.color} font-medium`
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                >
                  <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                  {cfg.label}
                </button>
              );
            }
          )}
        </div>
      </div>

      {/* Ordenamiento */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Ordenar por
        </p>
        <div className="space-y-1.5">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onSortChange(opt.value)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${sortBy === opt.value
                ? "bg-primary text-primary-foreground font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <UserReferralSection />
    </div>
  );

  return (
    <>
      {/* ── DESKTOP: sidebar fijo visible siempre ── */}
      <aside className="hidden lg:block w-64 shrink-0">{panelContent}</aside>

      {/* ── MOBILE/TABLET: overlay drawer que se abre sobre el contenido ── */}
      {mobileOpen && (
        <>
          {/* Fondo oscuro detrás del drawer */}
          <div
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={onMobileClose}
          />
          {/* Panel del drawer deslizando desde la izquierda */}
          <div className="fixed inset-y-0 left-0 w-72 z-50 lg:hidden overflow-y-auto bg-background p-4 shadow-2xl animate-slide-in-from-left">
            {panelContent}
          </div>
        </>
      )}
    </>
  );
}
