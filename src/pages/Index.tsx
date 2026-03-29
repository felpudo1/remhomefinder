import { useState, useMemo, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/contexts/AuthProvider";
import { Property, PropertyStatus, PropertyComment } from "@/types/property";
import { useProperties } from "@/hooks/useProperties";
import { useMarketplaceProperties } from "@/hooks/useMarketplaceProperties";
import { PropertyCard } from "@/components/PropertyCard";
import { FilterSidebar } from "@/components/FilterSidebar";
import { ListadoFiltersDropdown } from "@/components/ListadoFiltersDropdown";
import { MarketplaceView } from "@/components/MarketplaceView";
import { UserWelcome } from "@/components/UserWelcome";
import { UserHeader } from "@/components/UserHeader";
import { UserStatusBanner } from "@/components/UserStatusBanner";
import { Footer } from "@/components/Footer";
import { Home, Plus, Loader2, Users, SlidersHorizontal, Store, X, RefreshCw, Mail, CheckCircle2, ChevronRight, Search, UserPlus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useProfile } from "@/hooks/useProfile";
import { useSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { SupportWhatsAppLink } from "@/components/support/SupportWhatsAppLink";
import { useSystemConfig } from "@/hooks/useSystemConfig";
import { AIProfileModal } from "@/components/AIProfileModal";
import { IndexModals } from "@/components/IndexModals";
import { ReferidosTabPanel } from "@/components/ReferidosTabPanel";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type SortOption = "total-asc" | "total-desc" | "newest" | "oldest";

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
  const [selectedStatuses, setSelectedStatuses] = useState<PropertyStatus[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [hideDiscarded, setHideDiscarded] = useState(true);
  /** Misma lógica que HFMarket: ON = fotos expandidas en las tarjetas; OFF = colapsadas (“Ver fotos”). */
  const [expandPhotos, setExpandPhotos] = useState(true);
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
  const { value: supportPhone } = useSystemConfig(SUPPORT_PHONE_CONFIG_KEY, SUPPORT_PHONE_DEFAULT);
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
  const [showRegWelcome, setShowRegWelcome] = useState(false);
  const [dontShowRegAgain, setDontShowRegAgain] = useState(false);
  const [isRefreshingList, setIsRefreshingList] = useState(false);
  const [showContactTipModal, setShowContactTipModal] = useState(false);
  const [dontShowContactTipAgain, setDontShowContactTipAgain] = useState(false);
  const [showAIProfileModal, setShowAIProfileModal] = useState(false);

  const MARKET_TIP_DISABLED_KEY = "hf_market_save_tip_disabled";
  const OWN_LINK_TIP_SHOWN_KEY = "hf_own_link_first_tip_shown";

  const { canSaveMore, maxSaves, isPremium } = useSubscription();

  const handleRefreshProperties = async () => {
    setIsRefreshingList(true);
    await refetch();
    setIsRefreshingList(false);
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get("registered") === "true") {
      setShowRegWelcome(true);
    }
  }, [location.search]);

  // Notificación de Premium recién adquirido (REGLA 2: Lógica robusta)
  useEffect(() => {
    if (showRegWelcome) return; // No abrir mientras el overlay de registro está activo
    if (isPremium && profile?.userId) {
      const key = `hf_premium_welcome_shown_${profile.userId}`;
      if (localStorage.getItem(key) !== "true") {
        setIsPremiumWelcomeOpen(true);
        localStorage.setItem(key, "true");
      }
    }
  }, [isPremium, profile?.userId, showRegWelcome]);

  // Perfil IA (matchmaking): solo se abre manualmente desde el menú (onAIProfileClick), no al cargar el dashboard.

  // Implementación de Debouncing para la búsqueda (REGLA 2: Performance)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

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
      await updateStatus({
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
      });
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

      const hasSourceUrl = typeof formWithoutMeta.url === "string" && formWithoutMeta.url.trim().length > 0;
      const isTipDisabled = localStorage.getItem(MARKET_TIP_DISABLED_KEY) === "true";
      const wasShownBefore = localStorage.getItem(OWN_LINK_TIP_SHOWN_KEY) === "true";
      if (hasSourceUrl && !isTipDisabled && !wasShownBefore) {
        localStorage.setItem(OWN_LINK_TIP_SHOWN_KEY, "true");
        setDontShowContactTipAgain(false);
        setShowContactTipModal(true);
      }
    } catch (e: unknown) {
      toast({ title: "Error", description: getErrorMessage(e), variant: "destructive" });
      throw e; // Re-lanzar para que el modal no se cierre si falla
    }
  };

  const handleCloseContactTipModal = () => {
    if (dontShowContactTipAgain) {
      localStorage.setItem(MARKET_TIP_DISABLED_KEY, "true");
    }
    setShowContactTipModal(false);
    setDontShowContactTipAgain(false);
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

  const handleOpenExistingListing = (userListingId: string) => {
    setIsAddOpen(false);
    setIsAddZenRowsOpen(false);
    setSelectedPropertyId(userListingId);
    setIsDetailOpen(true);
  };

  const filteredAndSorted = useMemo(() => {
    let result = [...properties];
    if (activeGroupId) {
      result = result.filter((p) => p.groupId === activeGroupId);
    }
    // Eliminación lógica visual: nunca mostrar estado eliminado en listados de usuario.
    result = result.filter((p) => p.status !== "eliminado");
    if (debouncedSearchQuery.trim()) {
      const q = debouncedSearchQuery.toLowerCase();
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
    if (hideDiscarded) {
      result = result.filter((p) => p.status !== "descartado");
    }
    switch (sortBy) {
      case "total-asc": result.sort((a, b) => a.totalCost - b.totalCost); break;
      case "total-desc": result.sort((a, b) => b.totalCost - a.totalCost); break;
      case "newest": result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
      case "oldest": result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()); break;
    }
    result.sort((a, b) => (a.status === "descartado" ? 1 : 0) - (b.status === "descartado" ? 1 : 0));
    return result;
  }, [properties, selectedStatuses, sortBy, debouncedSearchQuery, activeGroupId, hideDiscarded]);

  const statusCounts = useMemo(() => {
    const counts: Record<PropertyStatus, number> = {
      ingresado: 0, contactado: 0, visita_coordinada: 0, visitado: 0, descartado: 0, a_analizar: 0, eliminado: 0, eliminado_agencia: 0, firme_candidato: 0, posible_interes: 0, meta_conseguida: 0
    };
    properties.forEach((p) => { if (counts[p.status] !== undefined) counts[p.status]++; });
    return counts;
  }, [properties]);

  const isRegistered = new URLSearchParams(location.search).get("registered") === "true";

  return (
    <div className="min-h-screen bg-background">
      {/* Overlay de Verificación de Email (Persistente y Manual) */}
      {showRegWelcome && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/60 backdrop-blur-xl" />
          <div className="relative bg-card border border-border rounded-[2.5rem] p-10 max-w-md w-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] space-y-8 text-center animate-in fade-in zoom-in duration-300">
            <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-2 relative">
              <Mail className="w-12 h-12 text-primary animate-pulse" />
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl font-black text-foreground tracking-tight">¡Casi listo! 🚀</h2>
              <p className="text-muted-foreground leading-relaxed font-medium">
                Bienvenido a <strong className="text-foreground">{appBrandName}</strong>. Donde la tecnología te ayuda a descubrir tu lugar en el mundo.
              </p>
            </div>

            <div className="bg-muted/30 rounded-3xl p-6 flex items-start gap-4 text-left border border-border/50">
              <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed">
                Te enviamos un enlace mágico a tu correo electrónico. Si no lo ves, revisá en la carpeta de <strong>Spam</strong>.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <Button
                className="w-full h-14 rounded-2xl text-md font-bold shadow-xl shadow-primary/20 gap-2 group"
                onClick={() => setShowRegWelcome(false)}
              >
                ¡Entendido, vamos! <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>

              <div className="pt-2">
                <SupportWhatsAppLink
                  supportPhone={supportPhone || ""}
                  message={`Soporte. Soy ${profile?.displayName || profile?.email || userEmail || "Usuario"} (usuario registrado) con UserID ${profile?.userId || "Desconocido"}. Estoy teniendo problemas con el registro. Quiero ya sumergirme en la app para encontrar la casa de mis sueños.`}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors underline underline-offset-4"
                >
                  ¿Problemas con el correo? Contactá a soporte
                </SupportWhatsAppLink>
              </div>
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
        onAIProfileClick={() => setShowAIProfileModal(true)}
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
              <TabsContent value="mi-listado">
                {showWelcome ? (
                  <UserWelcome
                    onDismiss={handleDismissWelcome}
                    userName={welcomeDisplayName}
                    userPhone={welcomePhone}
                  />
                ) : (
                  <div>
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
                      <div className="mb-6 space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h1 className="text-2xl font-bold text-foreground tracking-tight">Tus Propiedades ({filteredAndSorted.length})</h1>
                            <p className="text-muted-foreground text-sm mt-1">Seguí, compará y colaborá en tu búsqueda</p>
                          </div>
                          <button
                            type="button"
                            onClick={handleRefreshProperties}
                            disabled={loading || isRefreshingList}
                            className="shrink-0 p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground border border-border disabled:opacity-50"
                            title="Refrescar listado"
                          >
                            <RefreshCw className={`w-4 h-4 ${isRefreshingList ? "animate-spin" : ""}`} />
                          </button>
                        </div>
                        {/* Escritorio: debajo del título — filtro → buscador → switches */}
                        <div className="hidden lg:flex flex-row flex-wrap items-center gap-4 min-w-0">
                          <ListadoFiltersDropdown
                            selectedStatuses={selectedStatuses}
                            onStatusToggle={handleStatusToggle}
                            sortBy={sortBy}
                            onSortChange={setSortBy}
                            onClearFilters={handleClearFilters}
                            totalCount={properties.length}
                            filteredCount={filteredAndSorted.length}
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                          />
                          <div className="relative flex-1 min-w-[200px] max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                            <Input
                              placeholder="Buscar propiedad..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="pl-9 h-10 w-full rounded-xl bg-muted border-0 text-sm"
                            />
                          </div>
                          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 shrink-0">
                            <div className="flex items-center gap-3">
                              <Switch
                                id="hide-discarded-list-lg"
                                checked={hideDiscarded}
                                onCheckedChange={setHideDiscarded}
                              />
                              <Label htmlFor="hide-discarded-list-lg" className="text-sm text-muted-foreground cursor-pointer whitespace-nowrap">
                                Ocultar descartados
                              </Label>
                            </div>
                            <div className="flex items-center gap-3">
                              <Switch
                                id="expand-photos-listado-lg"
                                checked={expandPhotos}
                                onCheckedChange={setExpandPhotos}
                              />
                              <Label htmlFor="expand-photos-listado-lg" className="text-sm text-muted-foreground cursor-pointer whitespace-nowrap">
                                Mostrar fotos
                              </Label>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-nowrap items-center justify-between gap-2 sm:justify-start sm:gap-6 w-full min-w-0 lg:hidden">
                          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 min-w-0">
                            <Switch
                              id="hide-discarded-list"
                              checked={hideDiscarded}
                              onCheckedChange={setHideDiscarded}
                            />
                            <Label htmlFor="hide-discarded-list" className="text-xs sm:text-sm text-muted-foreground cursor-pointer whitespace-nowrap">
                              Ocultar descartados
                            </Label>
                          </div>
                          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 min-w-0">
                            <Switch
                              id="expand-photos-listado"
                              checked={expandPhotos}
                              onCheckedChange={setExpandPhotos}
                            />
                            <Label htmlFor="expand-photos-listado" className="text-xs sm:text-sm text-muted-foreground cursor-pointer whitespace-nowrap">
                              Mostrar fotos
                            </Label>
                          </div>
                        </div>
                      </div>
                      {loading ? (
                        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
                      ) : filteredAndSorted.length === 0 ? (
                        <div className="text-center py-20 text-muted-foreground">
                          <Home className="w-12 h-12 mx-auto mb-4 opacity-30" />
                          <p className="font-medium">Copiá un link de cualquier portal y pegalo en el botón (+) acá para empezar</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {filteredAndSorted.map((property) => (
                            <PropertyCard
                              key={property.id}
                              property={property}
                              forceExpandImages={expandPhotos}
                              onStatusChange={handleStatusChange}
                              onClick={() => handleCardClick(property)}
                              ownerEmail={property.createdByEmail || null}
                            />
                          ))}
                        </div>
                      )}
                      {/* Punto 4 (Checklist): Prefetch agresivo — sentinel con IntersectionObserver */}
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
            selectedProperty={selectedProperty}
            isDetailOpen={isDetailOpen}
            setIsDetailOpen={setIsDetailOpen}
            currentUserEmail={userEmail}
            currentUserDisplayName={profile?.displayName}
            onStatusChange={handleStatusChange}
            onAddComment={handleAddComment}
            onAddProperty={handleAddProperty}
            onOpenExistingListing={handleOpenExistingListing}
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

          <Dialog
            open={showContactTipModal}
            onOpenChange={(open) => {
              if (!open) {
                handleCloseContactTipModal();
                return;
              }
              setShowContactTipModal(true);
            }}
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
                <Button onClick={handleCloseContactTipModal}>Entendido</Button>
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

/**
 * Punto 4 (Checklist): Sentinel invisible que dispara prefetch cuando el usuario
 * está a ~2 pantallas del final del listado. Usa IntersectionObserver con rootMargin.
 */
function LoadMoreSentinel({
  fetchNextPage,
  isFetchingNextPage,
}: {
  fetchNextPage: () => void;
  isFetchingNextPage: boolean;
}) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "600px" } // ~2 pantallas antes del final
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [fetchNextPage, isFetchingNextPage]);

  return (
    <div ref={sentinelRef} className="flex justify-center py-6">
      {isFetchingNextPage && (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Cargando más...
        </div>
      )}
    </div>
  );
}

export default Index;
