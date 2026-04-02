import { useState, useMemo, useEffect, useLayoutEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/contexts/AuthProvider";
import { Property, PropertyStatus, PropertyComment } from "@/types/property";
import { useProperties } from "@/hooks/useProperties";
import { PlanLimitError } from "@/hooks/useSaveToList";
import { useMarketplaceProperties } from "@/hooks/useMarketplaceProperties";
import { MarketplaceView } from "@/components/MarketplaceView";
import { UserHeader } from "@/components/UserHeader";
import { UserStatusBanner } from "@/components/UserStatusBanner";
import { Footer } from "@/components/Footer";
import { Home, Plus, Users, SlidersHorizontal, Store, X, ChevronRight, UserPlus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useProfile } from "@/hooks/useProfile";
import { useSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ROUTES } from "@/lib/constants";
import { resolveWelcomeDisplayName, resolveWelcomePhone } from "@/lib/welcomeUserDisplay";
import {
  ADD_BUTTON_CONFIG_KEY,
  ADD_BUTTON_DEFAULT,
  APP_BRAND_NAME_DEFAULT,
  APP_BRAND_NAME_KEY,
  SUPPORT_PHONE_CONFIG_KEY,
  SUPPORT_PHONE_DEFAULT,
} from "@/lib/config-keys";
import type { AddButtonConfig } from "@/types/property";

import { useSystemConfig } from "@/hooks/useSystemConfig";
import { AIProfileModal } from "@/components/AIProfileModal";
import { IndexModals } from "@/components/IndexModals";
import { ReferidosTabPanel } from "@/components/ReferidosTabPanel";
import { MiListadoTabPanel } from "@/components/MiListadoTabPanel";
import { useIndexOnboarding } from "@/hooks/useIndexOnboarding";
import { useIndexListingController } from "@/hooks/useIndexListingController";
import type {
  IndexDetailModalState,
  IndexGroupContext,
  IndexHeaderActions,
  IndexHeaderListingSummary,
  IndexModalVisibilityState,
} from "@/types/index-page";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Componente Corazón de la Aplicación.
 * Refactorizado (Etapa 1) para delegar modales a IndexModals (REGLA 2).
 */
const Index = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { properties, loading, addProperty, updateStatus, addComment, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useProperties();
  const { data: marketplaceProperties = [] } = useMarketplaceProperties();

  // Leer email del AuthProvider centralizado (0 auth requests HTTP)
  const { user: authUser } = useCurrentUser();
  const userEmail = authUser?.email ?? null;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate(ROUTES.AUTH);
  };

  // Estado del perfil del usuario
  const { data: profile, isLoading: profileLoading } = useProfile();
  /** Saludo: perfil en BD; si tarda, cae a user_metadata del JWT (registro) sin queries extra. */
  const welcomeDisplayName = useMemo(
    () => resolveWelcomeDisplayName(profile ?? undefined, authUser ?? null),
    [profile, authUser]
  );
  const welcomePhone = useMemo(
    () => resolveWelcomePhone(profile ?? undefined, authUser ?? null),
    [profile, authUser]
  );
  const profileStatus = profile?.status ?? "active";
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAddZenRowsOpen, setIsAddZenRowsOpen] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("mi-listado");

  /** Al entrar al dashboard: sin restauración de scroll del navegador y vista desde arriba (header + pestañas visibles). */
  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    const prev = window.history.scrollRestoration;
    try {
      window.history.scrollRestoration = "manual";
    } catch {
      /* ignore */
    }
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    return () => {
      try {
        window.history.scrollRestoration = prev;
      } catch {
        /* ignore */
      }
    };
  }, []);

  /** Un frame extra por si el layout (listado, HFMarket) mueve el scroll tras el primer paint. */
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      window.scrollTo(0, 0);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  // Configuración de botones
  const { value: addButtonConfigRaw } = useSystemConfig(ADD_BUTTON_CONFIG_KEY, ADD_BUTTON_DEFAULT);
  const { value: appBrandName } = useSystemConfig(APP_BRAND_NAME_KEY, APP_BRAND_NAME_DEFAULT);
  
  const addButtonConfig = (addButtonConfigRaw as AddButtonConfig) || ADD_BUTTON_DEFAULT;

  const [isGroupsOpen, setIsGroupsOpen] = useState(false);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [welcomeType, setWelcomeType] = useState<"user" | "agent">("user");
  const [isRefreshingList, setIsRefreshingList] = useState(false);
  const [showAIProfileModal, setShowAIProfileModal] = useState(false);

  const { canSaveMore, maxSaves, isPremium, referralBonus } = useSubscription();
  const {
    showWelcome,
    isPremiumWelcomeOpen,
    showContactTipModal,
    dontShowContactTipAgain,
    setDontShowContactTipAgain,
    setIsPremiumWelcomeOpen,
    handleDismissWelcome,
    maybeShowContactTip,
    closeContactTipModal,
    handleContactTipOpenChange,
  } = useIndexOnboarding({
    locationSearch: location.search,
    isPremium,
    profileUserId: profile?.userId,
  });
  const {
    selectedStatuses,
    sortBy,
    searchQuery,
    hideDiscarded,
    expandPhotos,
    filteredAndSorted,
    statusCounts,
    setSortBy,
    setSearchQuery,
    setHideDiscarded,
    setExpandPhotos,
    handleStatusToggle,
    handleClearFilters,
  } = useIndexListingController({
    properties,
    activeGroupId,
  });

  const handleRefreshProperties = async () => {
    setIsRefreshingList(true);
    await refetch();
    setIsRefreshingList(false);
  };

  const selectedProperty = useMemo(
    () => properties.find((p) => p.id === selectedPropertyId) || null,
    [properties, selectedPropertyId]
  );

  const permissionDeniedMsg = "No puede realizar este cambio. Póngase en contacto con el usuario que ingresó la publicación.";

  const isPermissionError = (e: unknown) => {
    if (!(e instanceof Error)) return false;
    const msg = e.message.toLowerCase();
    return msg.includes("row-level security") || msg.includes("policy") || msg.includes("permission") || msg.includes("denied");
  };

  const handleStatusChange = async (
    id: string,
    status: PropertyStatus,
    deletedReason?: string,
    coordinatedDate?: string | null,
    groupId?: string | null,
    contactedName?: string,
    discardedAttributeIds?: string[],
    prosAndCons?: { positiveIds: string[]; negativeIds: string[] },
    contactedFeedback?: { interest: number; urgency: number },
    coordinatedFeedback?: { agentResponseSpeed: number; attentionQuality: number; appHelpScore?: number },
    discardedSurvey?: {
      overallCondition: number;
      surroundings: number;
      houseSecurity: number;
      expectedSize: number;
      photosReality: number;
    },
    metaAchievedFeedback?: {
      agentPunctuality: number;
      agentAttention: number;
      appPerformance: number;
      appSupport: number;
      appPrice: number;
    },
    closingFeedback?: {
      closePriceScore: number;
      closeConditionScore: number;
      closeSecurityScore: number;
      closeGuaranteeScore: number;
      closeMovingScore: number;
    },
    metadata?: Record<string, any>
  ) => {
    try {
      await updateStatus(
        id,
        status,
        deletedReason,
        coordinatedDate,
        groupId,
        contactedName,
        discardedAttributeIds,
        prosAndCons,
        contactedFeedback,
        coordinatedFeedback,
        discardedSurvey,
        metaAchievedFeedback,
        closingFeedback,
        metadata
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error desconocido";
      const isEnumError = /enum|invalid.*firme_candidato|invalid.*posible_interes|invalid.*meta_conseguida|user_listing_status/i.test(msg);
      const isRequiredField = /requerido|required/i.test(msg);
      toast({
        title: isPermissionError(e) ? "Sin permisos" : "Error",
        description: isPermissionError(e)
          ? permissionDeniedMsg
          : isEnumError
            ? "Los estados Alta prioridad, Interesado y Meta conseguida requieren ejecutar la migración de la base de datos. Contactá al administrador."
            : isRequiredField
              ? "Error al guardar. Si el problema persiste, ejecutá la migración: pnpm supabase db push"
              : msg,
        variant: "destructive",
      });
      throw e; // Re-lanzar para que el modal no se cierre en caso de error
    }
  };

  const handleAddComment = async (id: string, comment: Omit<PropertyComment, "id" | "createdAt">) => {
    try {
      await addComment(id, comment);
    } catch (e: unknown) {
      toast({
        title: isPermissionError(e) ? "Sin permisos" : "Error",
        description: isPermissionError(e) ? permissionDeniedMsg : (e instanceof Error ? e.message : "Error desconocido"),
        variant: "destructive",
      });
    }
  };

  const getErrorMessage = (e: unknown): string => {
    if (e instanceof Error) return e.message;
    if (e && typeof e === "object" && "message" in e) return String((e as { message: unknown }).message);
    return "Error desconocido";
  };

  const handleAddProperty = async (form: any) => {
    try {
      const { _successMessage, ...formWithoutMeta } = form;
      await addProperty(formWithoutMeta);
      setIsAddOpen(false);
      setIsAddZenRowsOpen(false);
      toast({ title: "Éxito", description: _successMessage || "Propiedad agregada correctamente" });
      maybeShowContactTip(formWithoutMeta.url);
    } catch (e: unknown) {
      if (e instanceof PlanLimitError) {
        setIsAddOpen(false);
        setIsAddZenRowsOpen(false);
        setIsUpgradeOpen(true);
      } else {
        toast({ title: "Error", description: getErrorMessage(e), variant: "destructive" });
      }
      throw e;
    }
  };

  const handleCardClick = (property: Property) => {
    setSelectedPropertyId(property.id);
    setIsDetailOpen(true);
  };

  const handleOpenExistingListing = (userListingId: string) => {
    setIsAddOpen(false);
    setIsAddZenRowsOpen(false);
    setSelectedPropertyId(userListingId);
    setIsDetailOpen(true);
  };

  const isRegistered = new URLSearchParams(location.search).get("registered") === "true";
  const listingSummary: IndexHeaderListingSummary = {
    selectedStatuses,
    statusCounts,
    onStatusToggle: handleStatusToggle,
  };
  const headerActions: IndexHeaderActions = {
    onOpenGroups: () => setIsGroupsOpen(true),
    onAIProfileClick: () => setShowAIProfileModal(true),
    onLogout: handleLogout,
  };
  const detailModal: IndexDetailModalState = {
    selectedProperty,
    isOpen: isDetailOpen,
    setIsOpen: setIsDetailOpen,
    currentUserEmail: userEmail,
    currentUserDisplayName: profile?.displayName,
  };
  const modalVisibility: IndexModalVisibilityState = {
    isAddZenRowsOpen,
    setIsAddZenRowsOpen,
    isAddOpen,
    setIsAddOpen,
    isGroupsOpen,
    setIsGroupsOpen,
    isUpgradeOpen,
    setIsUpgradeOpen,
    isPremiumWelcomeOpen,
    setIsPremiumWelcomeOpen,
  };
  const groupContext: IndexGroupContext = {
    activeGroupId,
    setActiveGroupId,
  };

  return (
    <div className="min-h-screen bg-background">
      <UserHeader
        userEmail={userEmail}
        listingSummary={listingSummary}
        activeGroupId={activeGroupId}
        actions={headerActions}
      />

      {profileStatus !== "active" ? (
        <div className="max-w-2xl mx-auto px-4 py-12 flex-1">
          <UserStatusBanner status={profileStatus} />
        </div>
      ) : (
        <>
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
            <Tabs defaultValue="mi-listado" className="w-full" onValueChange={(v) => setActiveTab(v)}>
              <TabsList className="mb-6 bg-muted rounded-xl p-1.5 w-full grid grid-cols-3 gap-1 h-auto min-h-12">
                <TabsTrigger value="mi-listado" className="gap-1 rounded-lg data-[state=active]:bg-background transition-all text-xs sm:text-sm px-2">
                  <Home className="w-4 h-4 shrink-0" />
                  <span className="truncate">
                    Mi Listado <span className="opacity-70">({properties.length})</span>
                  </span>
                </TabsTrigger>
                <TabsTrigger value="marketplace" className="gap-1 rounded-lg data-[state=active]:bg-background transition-all text-xs sm:text-sm px-2">
                  <Store className="w-4 h-4 shrink-0" />
                  <span className="truncate">
                    HFMarket <span className="opacity-70">({marketplaceProperties.length})</span>
                  </span>
                </TabsTrigger>
                <TabsTrigger value="referidos" className="gap-1 rounded-lg data-[state=active]:bg-background transition-all text-xs sm:text-sm px-2">
                  <UserPlus className="w-4 h-4 shrink-0" />
                  <span className="truncate">Referidos</span>
                </TabsTrigger>
              </TabsList>

              {/* Orden: primero la pestaña por defecto (mi-listado) para que el DOM no deje “abajo” el HFMarket al hidratar. */}
              <MiListadoTabPanel
                showWelcome={showWelcome}
                onDismissWelcome={handleDismissWelcome}
                welcomeDisplayName={welcomeDisplayName}
                welcomePhone={welcomePhone}
                selectedStatuses={selectedStatuses}
                onStatusToggle={handleStatusToggle}
                sortBy={sortBy}
                onSortChange={setSortBy}
                onClearFilters={handleClearFilters}
                totalCount={properties.length}
                filteredCount={filteredAndSorted.length}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                isMobileFiltersOpen={isMobileFiltersOpen}
                onMobileFiltersClose={() => setIsMobileFiltersOpen(false)}
                referralBonus={referralBonus}
                maxSaves={maxSaves}
                onRefresh={handleRefreshProperties}
                loading={loading}
                isRefreshingList={isRefreshingList}
                hideDiscarded={hideDiscarded}
                onHideDiscardedChange={setHideDiscarded}
                expandPhotos={expandPhotos}
                onExpandPhotosChange={setExpandPhotos}
                filteredProperties={filteredAndSorted}
                onStatusChange={handleStatusChange}
                onCardClick={handleCardClick}
                hasNextPage={hasNextPage}
                fetchNextPage={fetchNextPage}
                isFetchingNextPage={isFetchingNextPage}
              />

              <TabsContent value="marketplace">
                <MarketplaceView
                  mobileFiltersOpen={activeTab === "marketplace" && isMobileFiltersOpen}
                  onMobileFiltersClose={() => setIsMobileFiltersOpen(false)}
                />
              </TabsContent>

              <TabsContent value="referidos">
                <ReferidosTabPanel />
              </TabsContent>
            </Tabs>
          </div>

          {/* Botones Flotantes */}
          <button
            type="button"
            onClick={() => setIsMobileFiltersOpen(true)}
            className={`fixed bottom-8 left-8 lg:hidden items-center gap-2 px-4 h-12 bg-card text-foreground border border-border rounded-2xl card-shadow z-30 text-sm font-medium ${
              activeTab === "referidos" ? "hidden" : "flex"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" /> Filtros{" "}
            {activeTab === "mi-listado" && selectedStatuses.length > 0 && (
              <span className="w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center font-bold">
                {selectedStatuses.length}
              </span>
            )}
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
            detailModal={detailModal}
            propertyActions={{
              onStatusChange: handleStatusChange,
              onAddComment: handleAddComment,
              onAddProperty: handleAddProperty,
              onOpenExistingListing: handleOpenExistingListing,
            }}
            visibility={modalVisibility}
            groupContext={groupContext}
            maxSaves={maxSaves}
            welcomeType={welcomeType}
          />

          {activeGroupId && (
            <div className="fixed top-16 left-0 right-0 z-30 bg-primary/10 border-b border-primary/20 px-4 py-2 flex items-center justify-center gap-2 text-sm">
              <Users className="w-4 h-4 text-primary" /> <span className="text-primary font-medium">Viendo propiedades del grupo</span>
              <button onClick={() => setActiveGroupId(null)} className="text-xs text-primary/70 underline ml-2">Ver todas</button>
            </div>
          )}

          <Dialog
            open={showContactTipModal}
            onOpenChange={handleContactTipOpenChange}
          >
            <DialogContent className="sm:max-w-lg rounded-2xl">
              <DialogHeader>
                <DialogTitle>Tip para tu primer contacto 💬</DialogTitle>
                <DialogDescription>
                  Para ahorrarte tiempo y coordinar mejor 😊, en el primer contacto hacé todas las preguntas clave.
                  Así evitás visitas que no te sirven y podés decidir mejor desde el inicio.
                  Consultá por patio/fondo 🏡, mascotas 🐾, escaleras 🪜, lugar para moto o auto 🛵🚗
                  y accesibilidad ♿.
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="contact-tip-dont-show"
                  checked={dontShowContactTipAgain}
                  onCheckedChange={(checked) => setDontShowContactTipAgain(Boolean(checked))}
                  className="rounded-md border-muted-foreground/30"
                />
                <label
                  htmlFor="contact-tip-dont-show"
                  className="text-sm text-muted-foreground cursor-pointer"
                >
                  No mostrar más este mensaje
                </label>
              </div>
              <DialogFooter>
                <Button onClick={closeContactTipModal}>Entendido</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}

      <AIProfileModal
        isOpen={showAIProfileModal}
        onClose={() => setShowAIProfileModal(false)}
        userId={profile?.userId}
      />

      <Footer showDbStatus />
    </div>
  );
};

export default Index;
