import { useEffect, useRef } from "react";
import { HelpCircle, Home, Loader2, RefreshCw, Search } from "lucide-react";
import { PropertyCard } from "@/components/PropertyCard";
import { FilterSidebar } from "@/components/FilterSidebar";
import { ListadoFiltersDropdown } from "@/components/ListadoFiltersDropdown";
import { UserWelcome } from "@/components/UserWelcome";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { TabsContent } from "@/components/ui/tabs";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import type { Property, PropertyStatus } from "@/types/property";
import type { IndexStatusChangeHandler, ListadoSortOption } from "@/types/index-page";

interface MiListadoTabPanelProps {
  showWelcome: boolean;
  onDismissWelcome: (dontShowAgain: boolean) => void;
  welcomeDisplayName?: string;
  welcomePhone?: string;
  selectedStatuses: PropertyStatus[];
  onStatusToggle: (status: PropertyStatus) => void;
  sortBy: ListadoSortOption;
  onSortChange: (value: ListadoSortOption) => void;
  onClearFilters: () => void;
  totalCount: number;
  filteredCount: number;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  isMobileFiltersOpen: boolean;
  onMobileFiltersClose: () => void;
  referralBonus: number;
  maxSaves: number;
  onRefresh: () => void;
  loading: boolean;
  isRefreshingList: boolean;
  hideDiscarded: boolean;
  onHideDiscardedChange: (checked: boolean) => void;
  expandPhotos: boolean;
  onExpandPhotosChange: (checked: boolean) => void;
  filteredProperties: Property[];
  onStatusChange: IndexStatusChangeHandler;
  onCardClick: (property: Property) => void;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  isFetchingNextPage: boolean;
  isPremium: boolean;
}

/**
 * Renderiza la pestaña "Mi Listado".
 * Recibe el estado desde Index para que la página siga siendo la dueña de la lógica.
 */
export function MiListadoTabPanel({
  showWelcome,
  onDismissWelcome,
  welcomeDisplayName,
  welcomePhone,
  selectedStatuses,
  onStatusToggle,
  sortBy,
  onSortChange,
  onClearFilters,
  totalCount,
  filteredCount,
  searchQuery,
  onSearchChange,
  isMobileFiltersOpen,
  onMobileFiltersClose,
  referralBonus,
  maxSaves,
  onRefresh,
  loading,
  isRefreshingList,
  hideDiscarded,
  onHideDiscardedChange,
  expandPhotos,
  onExpandPhotosChange,
  filteredProperties,
  onStatusChange,
  onCardClick,
  hasNextPage,
  fetchNextPage,
  isFetchingNextPage,
  isPremium,
}: MiListadoTabPanelProps) {
  const tooltipText = isPremium
    ? `${filteredCount} guardado(s) de ${maxSaves} disponibles (versión premium).`
    : `${filteredCount} guardado(s) de ${maxSaves - referralBonus}${referralBonus > 0 ? `+${referralBonus}` : ''} disponibles (versión gratuita).${referralBonus > 0 ? ` +${referralBonus} bonus por referido de agente.` : ''}`;
  return (
    <TabsContent value="mi-listado">
      {showWelcome ? (
        <UserWelcome
          onDismiss={onDismissWelcome}
          userName={welcomeDisplayName}
          userPhone={welcomePhone}
        />
      ) : (
        <div>
          <FilterSidebar
            selectedStatuses={selectedStatuses}
            onStatusToggle={onStatusToggle}
            sortBy={sortBy}
            onSortChange={onSortChange}
            onClearFilters={onClearFilters}
            totalCount={totalCount}
            filteredCount={filteredCount}
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            mobileOpen={isMobileFiltersOpen}
            onMobileClose={onMobileFiltersClose}
          />
          <main className="flex-1 min-w-0">
            <div className="mb-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-1.5">
                    Tus Avisos Guardados ({filteredCount}/{referralBonus > 0 ? `${maxSaves - referralBonus}+${referralBonus}` : maxSaves})
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help shrink-0" />
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-xs text-sm">
                          {tooltipText}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </h1>
                  <p className="text-muted-foreground text-sm mt-1">Seguí, compará y colaborá en tu búsqueda</p>
                </div>
                <button
                  type="button"
                  onClick={onRefresh}
                  disabled={loading || isRefreshingList}
                  className="shrink-0 p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground border border-border disabled:opacity-50"
                  title="Refrescar listado"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshingList ? "animate-spin" : ""}`} />
                </button>
              </div>

              {/* En desktop mostramos filtros, búsqueda y switches en una sola fila. */}
              <div className="hidden lg:flex flex-row flex-wrap items-center gap-4 min-w-0">
                <ListadoFiltersDropdown
                  selectedStatuses={selectedStatuses}
                  onStatusToggle={onStatusToggle}
                  sortBy={sortBy}
                  onSortChange={onSortChange}
                  onClearFilters={onClearFilters}
                  totalCount={totalCount}
                  filteredCount={filteredCount}
                  searchQuery={searchQuery}
                  onSearchChange={onSearchChange}
                />
                <div className="relative flex-1 min-w-[200px] max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Buscar propiedad..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-9 h-10 w-full rounded-xl bg-muted border-0 text-sm"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 shrink-0">
                  <div className="flex items-center gap-3">
                    <Switch
                      id="hide-discarded-list-lg"
                      checked={hideDiscarded}
                      onCheckedChange={onHideDiscardedChange}
                    />
                    <Label htmlFor="hide-discarded-list-lg" className="text-sm text-muted-foreground cursor-pointer whitespace-nowrap">
                      Ocultar descartados
                    </Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      id="expand-photos-listado-lg"
                      checked={expandPhotos}
                      onCheckedChange={onExpandPhotosChange}
                    />
                    <Label htmlFor="expand-photos-listado-lg" className="text-sm text-muted-foreground cursor-pointer whitespace-nowrap">
                      Mostrar fotos
                    </Label>
                  </div>
                </div>
              </div>

              {/* En mobile dejamos solo los switches para no sobrecargar la barra superior. */}
              <div className="flex flex-nowrap items-center justify-between gap-2 sm:justify-start sm:gap-6 w-full min-w-0 lg:hidden">
                <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 min-w-0">
                  <Switch
                    id="hide-discarded-list"
                    checked={hideDiscarded}
                    onCheckedChange={onHideDiscardedChange}
                  />
                  <Label htmlFor="hide-discarded-list" className="text-xs sm:text-sm text-muted-foreground cursor-pointer whitespace-nowrap">
                    Ocultar descartados
                  </Label>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 min-w-0">
                  <Switch
                    id="expand-photos-listado"
                    checked={expandPhotos}
                    onCheckedChange={onExpandPhotosChange}
                  />
                  <Label htmlFor="expand-photos-listado" className="text-xs sm:text-sm text-muted-foreground cursor-pointer whitespace-nowrap">
                    Mostrar fotos
                  </Label>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredProperties.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <Home className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="font-medium">Copiá un link de cualquier portal y pegalo en el botón (+) acá para empezar</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProperties.map((property) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    forceExpandImages={expandPhotos}
                    onStatusChange={onStatusChange}
                    onClick={() => onCardClick(property)}
                    ownerEmail={property.createdByEmail || null}
                  />
                ))}
              </div>
            )}

            {hasNextPage && !loading && (
              <LoadMoreSentinel
                fetchNextPage={fetchNextPage}
                isFetchingNextPage={isFetchingNextPage}
              />
            )}
          </main>
        </div>
      )}
    </TabsContent>
  );
}

/**
 * Dispara la carga de la siguiente página cuando el usuario se acerca al final.
 */
function LoadMoreSentinel({
  fetchNextPage,
  isFetchingNextPage,
}: {
  fetchNextPage: () => void;
  isFetchingNextPage: boolean;
}) {
  return (
    <div className="flex justify-center py-6">
      {isFetchingNextPage && (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Cargando más...
        </div>
      )}
      <SentinelObserver
        fetchNextPage={fetchNextPage}
        isFetchingNextPage={isFetchingNextPage}
      />
    </div>
  );
}

/**
 * Este div invisible observa el scroll y pide más resultados cuando entra en pantalla.
 */
function SentinelObserver({
  fetchNextPage,
  isFetchingNextPage,
}: {
  fetchNextPage: () => void;
  isFetchingNextPage: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "600px" }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [fetchNextPage, isFetchingNextPage]);

  return <div ref={ref} />;
}
