import { useState, useMemo, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Property, PropertyStatus, PropertyComment } from "@/types/property";
import { useProperties } from "@/hooks/useProperties";
import { useMarketplaceProperties } from "@/hooks/useMarketplaceProperties";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { PropertyCard } from "@/components/PropertyCard";
import { FilterSidebar } from "@/components/FilterSidebar";
import { MarketplaceView } from "@/components/MarketplaceView";
import { UserWelcome } from "@/components/UserWelcome";
import { UserHeader } from "@/components/UserHeader";
import { UserStatusBanner } from "@/components/UserStatusBanner";
import { Footer } from "@/components/Footer";
import { Home, Plus, Loader2, Mail, CheckCircle2, Users, SlidersHorizontal, Store } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ROUTES } from "@/lib/constants";
import { ADD_BUTTON_CONFIG_KEY, ADD_BUTTON_DEFAULT } from "@/lib/config-keys";
import type { AddButtonConfig } from "@/types/property";
import { useSystemConfig } from "@/hooks/useSystemConfig";
import { IndexModals } from "@/components/IndexModals";

type SortOption = "total-asc" | "total-desc" | "newest" | "oldest";

/**
 * Componente Corazón de la Aplicación.
 * Refactorizado (Etapa 1) para delegar modales a IndexModals (REGLA 2).
 */
const Index = () => {
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const { userEmail, handleLogout } = useAuthRedirect();
  const { properties, loading, addProperty, updateStatus, addComment } = useProperties();
  const { data: marketplaceProperties = [] } = useMarketplaceProperties();

  // Estado del perfil del usuario
  const { data: profile } = useProfile();
  const profileStatus = profile?.status ?? "active";
  const [selectedStatuses, setSelectedStatuses] = useState<PropertyStatus[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAddZenRowsOpen, setIsAddZenRowsOpen] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("mi-listado");

  // Configuración de botones
  const { value: addButtonConfigRaw } = useSystemConfig(ADD_BUTTON_CONFIG_KEY, ADD_BUTTON_DEFAULT);
  const addButtonConfig = (addButtonConfigRaw as AddButtonConfig) || ADD_BUTTON_DEFAULT;

  // Bienvenida
  const [showWelcome, setShowWelcome] = useState(() => {
    return localStorage.getItem("hf_user_welcome_dismissed") !== "true";
  });

  const [isGroupsOpen, setIsGroupsOpen] = useState(false);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [isPremiumWelcomeOpen, setIsPremiumWelcomeOpen] = useState(false);
  const [welcomeType, setWelcomeType] = useState<"user" | "agent">("user");

  const { canSaveMore, maxSaves, isPremium } = useSubscription();

  // Notificación de Premium recién adquirido (REGLA 2: Lógica robusta)
  useEffect(() => {
    const userId = profile?.user_id;
    if (isPremium && userId) {
      const key = `hf_premium_welcome_shown_${userId}`;
      if (localStorage.getItem(key) !== "true") {
        const isAgent = profile.roles?.includes("agency") || profile.roles?.includes("agent");
        setWelcomeType(isAgent ? "agent" : "user");
        setIsPremiumWelcomeOpen(true);
        localStorage.setItem(key, "true");
      }
    }
  }, [isPremium, profile?.user_id, profile?.roles]);

  const selectedProperty = useMemo(
    () => properties.find((p) => p.id === selectedPropertyId) || null,
    [properties, selectedPropertyId]
  );

  const permissionDeniedMsg = "No puede realizar este cambio. Póngase en contacto con el usuario que ingresó la publicación.";

  const isPermissionError = (e: any) => {
    const msg = e?.message?.toLowerCase() || "";
    return msg.includes("row-level security") || msg.includes("policy") || msg.includes("permission") || msg.includes("denied");
  };

  const handleStatusChange = async (id: string, status: PropertyStatus, deletedReason?: string, coordinatedDate?: string | null, groupId?: string | null, contactedName?: string) => {
    try {
      await updateStatus(id, status, deletedReason, coordinatedDate, groupId, contactedName);
    } catch (e: any) {
      toast({
        title: isPermissionError(e) ? "Sin permisos" : "Error",
        description: isPermissionError(e) ? permissionDeniedMsg : e.message,
        variant: "destructive",
      });
    }
  };

  const handleAddComment = async (id: string, comment: Omit<PropertyComment, "id" | "createdAt">) => {
    try {
      await addComment(id, comment);
    } catch (e: any) {
      toast({
        title: isPermissionError(e) ? "Sin permisos" : "Error",
        description: isPermissionError(e) ? permissionDeniedMsg : e.message,
        variant: "destructive",
      });
    }
  };

  const handleAddProperty = async (form: any) => {
    try {
      await addProperty(form);
      setIsAddOpen(false);
      setIsAddZenRowsOpen(false);
      toast({ title: "Éxito", description: "Propiedad agregada correctamente" });
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Error desconocido", variant: "destructive" });
    }
  };

  const handleStatusToggle = (status: PropertyStatus) => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const handleClearFilters = () => {
    setSelectedStatuses([]);
    setSortBy("newest");
    setSearchQuery("");
  };

  const handleDismissWelcome = (dontShowAgain: boolean) => {
    if (dontShowAgain) {
      localStorage.setItem("hf_user_welcome_dismissed", "true");
    }
    setShowWelcome(false);
  };

  const handleCardClick = (property: Property) => {
    setSelectedPropertyId(property.id);
    setIsDetailOpen(true);
  };

  const filteredAndSorted = useMemo(() => {
    let result = [...properties];
    if (activeGroupId) {
      result = result.filter((p) => p.groupId === activeGroupId);
    }
    if (!selectedStatuses.includes("eliminado")) {
      result = result.filter((p) => p.status !== "eliminado");
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.neighborhood.toLowerCase().includes(q) ||
          p.aiSummary.toLowerCase().includes(q)
      );
    }
    if (selectedStatuses.length > 0) {
      result = result.filter((p) => selectedStatuses.includes(p.status));
    }
    switch (sortBy) {
      case "total-asc": result.sort((a, b) => a.totalCost - b.totalCost); break;
      case "total-desc": result.sort((a, b) => b.totalCost - a.totalCost); break;
      case "newest": result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
      case "oldest": result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()); break;
    }
    result.sort((a, b) => (a.status === "discarded" ? 1 : 0) - (b.status === "discarded" ? 1 : 0));
    return result;
  }, [properties, selectedStatuses, sortBy, searchQuery, activeGroupId]);

  const statusCounts = useMemo(() => {
    const counts: Record<PropertyStatus, number> = {
      ingresado: 0, contacted: 0, coordinated: 0, visited: 0, discarded: 0, a_analizar: 0, eliminado: 0, eliminado_agencia: 0
    };
    properties.forEach((p) => { if (counts[p.status] !== undefined) counts[p.status]++; });
    return counts;
  }, [properties]);

  const isRegistered = new URLSearchParams(location.search).get("registered") === "true";

  return (
    <div className="min-h-screen bg-background">
      {/* Overlay de Verificación de Email */}
      {isRegistered && !userEmail && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-xl" />
          <div className="relative bg-card border border-border rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6 text-center animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-2">
              <Mail className="w-10 h-10 text-primary animate-pulse" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground tracking-tight">¡Casi listo! 🚀</h2>
              <p className="text-muted-foreground leading-relaxed">
                Gracias por sumarte a <strong>HomeFinder</strong>. Confirmá tu cuenta para empezar.
              </p>
            </div>
            <div className="bg-muted/50 rounded-2xl p-4 flex items-start gap-3 text-left">
              <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-foreground/80">Revisá tu bandeja de entrada para el enlace de confirmación.</p>
            </div>
            <div className="pt-4">
              <Button className="w-full h-12 rounded-xl text-md font-medium" onClick={() => navigate(ROUTES.AUTH)}>
                Volver al inicio de sesión
              </Button>
            </div>
          </div>
        </div>
      )}

      <UserHeader
        userEmail={userEmail}
        selectedStatuses={selectedStatuses}
        handleStatusToggle={handleStatusToggle}
        statusCounts={statusCounts}
        activeGroupId={activeGroupId}
        setIsGroupsOpen={setIsGroupsOpen}
        handleLogout={handleLogout}
      />

      {profileStatus !== "active" ? (
        <div className="max-w-2xl mx-auto px-4 py-12 flex-1">
          <UserStatusBanner status={profileStatus} />
        </div>
      ) : (
        <>
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
            <Tabs defaultValue="mi-listado" className="w-full" onValueChange={(v) => setActiveTab(v)}>
              <TabsList className="mb-6 bg-muted rounded-xl p-1.5 w-full flex h-12">
                <TabsTrigger value="mi-listado" className="gap-1.5 rounded-lg data-[state=active]:bg-background flex-[2] transition-all">
                  <Home className="w-4 h-4" /> Mi Listado <span className="text-xs opacity-70 ml-1">({properties.length})</span>
                </TabsTrigger>
                <TabsTrigger value="marketplace" className="gap-1.5 rounded-lg data-[state=active]:bg-background flex-1 transition-all">
                  <Store className="w-4 h-4" /> HFMarket <span className="text-xs opacity-70 ml-1">({marketplaceProperties.length})</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="marketplace">
                <MarketplaceView
                  mobileFiltersOpen={activeTab === "marketplace" && isMobileFiltersOpen}
                  onMobileFiltersClose={() => setIsMobileFiltersOpen(false)}
                />
              </TabsContent>

              <TabsContent value="mi-listado">
                {showWelcome ? (
                  <UserWelcome onDismiss={handleDismissWelcome} userName={userEmail?.split('@')[0] || ""} />
                ) : (
                  <div className="flex gap-8">
                    <FilterSidebar
                      selectedStatuses={selectedStatuses}
                      onStatusToggle={handleStatusToggle}
                      sortBy={sortBy}
                      onSortChange={setSortBy}
                      onClearFilters={handleClearFilters}
                      totalCount={properties.length}
                      filteredCount={filteredAndSorted.length}
                      searchQuery={searchQuery}
                      onSearchChange={setSearchQuery}
                      mobileOpen={isMobileFiltersOpen}
                      onMobileClose={() => setIsMobileFiltersOpen(false)}
                    />
                    <main className="flex-1 min-w-0">
                      <div className="mb-6">
                        <h1 className="text-2xl font-bold text-foreground tracking-tight">Tus Propiedades ({filteredAndSorted.length})</h1>
                        <p className="text-muted-foreground text-sm mt-1">Seguí, compará y colaborá en tu búsqueda</p>
                      </div>
                      {loading ? (
                        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
                      ) : filteredAndSorted.length === 0 ? (
                        <div className="text-center py-20 text-muted-foreground">
                          <Home className="w-12 h-12 mx-auto mb-4 opacity-30" />
                          <p className="font-medium">No se encontraron propiedades</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {filteredAndSorted.map((property) => (
                            <PropertyCard key={property.id} property={property} onStatusChange={handleStatusChange} onClick={() => handleCardClick(property)} ownerEmail={property.createdByEmail || null} />
                          ))}
                        </div>
                      )}
                    </main>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Botones Flotantes */}
          <button onClick={() => setIsMobileFiltersOpen(true)} className="fixed bottom-8 left-8 lg:hidden flex items-center gap-2 px-4 h-12 bg-card text-foreground border border-border rounded-2xl card-shadow z-30 text-sm font-medium">
            <SlidersHorizontal className="w-4 h-4" /> Filtros {selectedStatuses.length > 0 && <span className="w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center font-bold">{selectedStatuses.length}</span>}
          </button>

          {(addButtonConfig === "white" || addButtonConfig === "both") && (
            <button onClick={() => canSaveMore(properties.length) ? setIsAddZenRowsOpen(true) : setIsUpgradeOpen(true)} className="fixed bottom-[6.5rem] right-8 w-14 h-14 bg-card text-foreground border border-border rounded-2xl flex items-center justify-center card-shadow z-30">
              <Plus className="w-6 h-6" />
            </button>
          )}

          {(addButtonConfig === "blue" || addButtonConfig === "both") && (
            <button onClick={() => canSaveMore(properties.length) ? setIsAddOpen(true) : setIsUpgradeOpen(true)} className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center card-shadow-hover z-30">
              <Plus className="w-6 h-6" />
            </button>
          )}

          {/* Orquestación de Modales (Refactoreado) */}
          <IndexModals
            selectedProperty={selectedProperty}
            isDetailOpen={isDetailOpen}
            setIsDetailOpen={setIsDetailOpen}
            currentUserEmail={userEmail}
            onStatusChange={handleStatusChange}
            onAddComment={handleAddComment}
            onAddProperty={handleAddProperty}
            isAddZenRowsOpen={isAddZenRowsOpen}
            setIsAddZenRowsOpen={setIsAddZenRowsOpen}
            isAddOpen={isAddOpen}
            setIsAddOpen={setIsAddOpen}
            isGroupsOpen={isGroupsOpen}
            setIsGroupsOpen={setIsGroupsOpen}
            isUpgradeOpen={isUpgradeOpen}
            setIsUpgradeOpen={setIsUpgradeOpen}
            isPremiumWelcomeOpen={isPremiumWelcomeOpen}
            setIsPremiumWelcomeOpen={setIsPremiumWelcomeOpen}
            activeGroupId={activeGroupId}
            setActiveGroupId={setActiveGroupId}
            maxSaves={maxSaves}
            propertiesCount={properties.length}
            welcomeType={welcomeType}
          />

          {activeGroupId && (
            <div className="fixed top-16 left-0 right-0 z-30 bg-primary/10 border-b border-primary/20 px-4 py-2 flex items-center justify-center gap-2 text-sm">
              <Users className="w-4 h-4 text-primary" /> <span className="text-primary font-medium">Viendo propiedades del grupo</span>
              <button onClick={() => setActiveGroupId(null)} className="text-xs text-primary/70 underline ml-2">Ver todas</button>
            </div>
          )}
        </>
      )}
      <Footer />
    </div>
  );
};

export default Index;
