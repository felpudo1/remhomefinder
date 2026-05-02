import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, ChevronLeft, ChevronRight, Bookmark, Loader2, Share2 } from "lucide-react";
import { currencySymbol } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAnalytics } from "@/hooks/useAnalytics";
import { RequireAuthModal } from "@/components/auth/RequireAuthModal";
import { useCurrentUser } from "@/contexts/AuthProvider";

import { ROUTES } from "@/lib/constants";
import { getUserOrgIdWithRetry } from "@/lib/organizationMembership";

interface PublicProperty {
  id: string;
  title: string;
  neighborhood: string;
  city: string;
  rooms: number;
  sq_meters: number;
  price_rent: number;
  price_expenses: number;
  total_cost: number;
  currency: string;
  images: string[];
  details: string;
  ref: string;
}

const PENDING_SAVE_KEY = "pending_property_save";
const PENDING_SAVE_CONFIRM_KEY = "pending_property_save_require_accept";
const PENDING_SAVE_BACKUP_KEY = "pending_property_save_backup";
const PENDING_SAVE_URL_KEY = "pending_save_url";
const PENDING_SAVE_URL_FALLBACK_KEY = "pending_save_url_fallback";

const getPendingSavePayload = () => {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(PENDING_SAVE_KEY) || localStorage.getItem(PENDING_SAVE_BACKUP_KEY);
};

const persistPendingSaveState = (payload: string, returnUrl?: string) => {
  if (typeof window === "undefined") return;

  sessionStorage.setItem(PENDING_SAVE_KEY, payload);
  localStorage.setItem(PENDING_SAVE_BACKUP_KEY, payload);

  if (returnUrl) {
    sessionStorage.setItem(PENDING_SAVE_URL_KEY, returnUrl);
    localStorage.setItem(PENDING_SAVE_URL_FALLBACK_KEY, returnUrl);
  }
};

const clearPendingSaveState = () => {
  if (typeof window === "undefined") return;

  sessionStorage.removeItem(PENDING_SAVE_KEY);
  sessionStorage.removeItem(PENDING_SAVE_CONFIRM_KEY);
  sessionStorage.removeItem(PENDING_SAVE_URL_KEY);
  localStorage.removeItem(PENDING_SAVE_BACKUP_KEY);
  localStorage.removeItem(PENDING_SAVE_URL_FALLBACK_KEY);

  // Notificar a otros componentes (PhoneRequirementOverlay) que el pending save fue limpiado
  window.dispatchEvent(new CustomEvent("qr_save_completed"));
};

export default function PublicPropertyView() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { trackEvent, claimAnonymousEvents } = useAnalytics();

  const [property, setProperty] = useState<PublicProperty | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImg, setActiveImg] = useState(0);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [requiresSaveConfirmation, setRequiresSaveConfirmation] = useState(false);
  const [isPreparingAccount, setIsPreparingAccount] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingAuthUserId, setPendingAuthUserId] = useState<string | null>(null);
  const [resolvedPropertyId, setResolvedPropertyId] = useState<string | null>(null);
  const [resolvedPublicationId, setResolvedPublicationId] = useState<string | null>(null);

  // Track if QR scan event was already fired
  const qrTrackedRef = useRef(false);
  // Track if auto-save was already triggered (prevents double-fire)
  const autoSaveTriggeredRef = useRef(false);

  const source = searchParams.get("source");
  const pubId = searchParams.get("pub_id");
  const effectivePropertyId = resolvedPropertyId || id;
  const effectivePublicationId = pubId || resolvedPublicationId;
  const refParam = searchParams.get("ref");

  // Auth state — user may be null on public view (not behind ProtectedRoute)
  const { user } = useCurrentUser();

  // URL completa de esta propiedad para mostrar en el modal de confirmación
  const propertyUrl = typeof window !== "undefined" ? window.location.href : "";

  /**
   * Guarda el referral ID en localStorage para que el modal de registro lo use.
   */
  const cachePublicationReferrer = useCallback(async () => {
    if (localStorage.getItem("hf_referral_id")) return;

    if (refParam) {
      localStorage.setItem("hf_referral_id", refParam);
      return;
    }

    if (!pubId) return;

    const { data: publication } = await supabase
        .from("agent_publications")
      .select("published_by")
        .eq("id", effectivePublicationId)
      .maybeSingle();

    if (publication?.published_by) {
      localStorage.setItem("hf_referral_id", publication.published_by);
    }
  }, [effectivePublicationId, refParam]);

  // Fetch property data
  useEffect(() => {
    if (!id) return;
    const fetchProperty = async () => {
      setLoading(true);
      let lookupPropertyId = id;
      let lookupPublicationId: string | null = null;

      let { data, error: fetchError } = await supabase
        .from("properties")
        .select("id, title, neighborhood, city, rooms, m2_total, price_amount, price_expenses, total_cost, currency, images, details, ref")
        .eq("id", id)
        .maybeSingle();

      if (!data || fetchError) {
        const { data: listing } = await supabase
          .from("user_listings")
          .select("property_id, source_publication_id")
          .eq("id", id)
          .maybeSingle();

        if (listing?.property_id) {
          lookupPropertyId = listing.property_id;
          lookupPublicationId = listing.source_publication_id || null;
          const fallback = await supabase
            .from("properties")
            .select("id, title, neighborhood, city, rooms, m2_total, price_amount, price_expenses, total_cost, currency, images, details, ref")
            .eq("id", lookupPropertyId)
            .maybeSingle();
          data = fallback.data;
          fetchError = fallback.error;
        }
      }

      if (fetchError || !data) {
        setError("No se encontró la propiedad.");
      } else {
        setResolvedPropertyId(lookupPropertyId);
        setResolvedPublicationId(lookupPublicationId);
        setProperty({
          id: data.id,
          title: data.title,
          neighborhood: data.neighborhood,
          city: data.city || "",
          rooms: data.rooms,
          sq_meters: Number(data.m2_total),
          price_rent: Number(data.price_amount),
          price_expenses: Number(data.price_expenses),
          total_cost: Number(data.total_cost),
          currency: data.currency,
          images: data.images || [],
          details: data.details || "",
          ref: data.ref || "",
        });
      }
      setLoading(false);
    };
    fetchProperty();
  }, [id]);

  // Track QR scan event (once)
  useEffect(() => {
    if (!effectivePropertyId || !source || source !== "qr" || qrTrackedRef.current) return;
    qrTrackedRef.current = true;
    trackEvent({
      eventType: "qr_scan",
      propertyId: effectivePropertyId,
      sourcePublicationId: effectivePublicationId,
      userId: user?.id || null,
      metadata: { qr_source: "qr", user_agent: navigator.userAgent },
    });
  }, [effectivePropertyId, source, effectivePublicationId, user?.id, trackEvent]);

  // Track property view event
  useEffect(() => {
    if (!effectivePropertyId) return;
    trackEvent({
      eventType: "property_view",
      propertyId: effectivePropertyId,
      sourcePublicationId: effectivePublicationId,
      userId: user?.id || null,
    });
  }, [effectivePropertyId, effectivePublicationId, user?.id, trackEvent]);

  const handleSaveProperty = useCallback(
    async (userId: string, preloadedOrgId?: string | null) => {
      if (!effectivePropertyId || saving || saved) return false;
      setSaving(true);

      try {
        console.log("[PublicPropertyView] Iniciando guardado QR", {
          propertyId: effectivePropertyId,
          publicationId: effectivePublicationId,
          userId,
          preloadedOrgId: preloadedOrgId ?? null,
        });

        // Forzar refresh del JWT
        try {
          await supabase.auth.refreshSession();
        } catch {
          console.warn("[PublicPropertyView] refreshSession falló, continuando con token actual");
        }

        // Claim anonymous analytics events
        if (effectivePublicationId) {
          await claimAnonymousEvents(userId, effectivePropertyId, effectivePublicationId);
        }

        // Get user's org — retry for new signups
        const orgId = preloadedOrgId ?? await getUserOrgIdWithRetry(userId, 7);

        console.log("[PublicPropertyView] Resultado org lookup", { userId, orgId, propertyId: effectivePropertyId });

        if (!orgId) {
          console.warn("[PublicPropertyView] No se encontró organización para guardar");
          toast({
            title: "Error",
            description: "No se encontró una organización asociada a tu cuenta. Intentá nuevamente en unos segundos.",
            variant: "destructive",
          });
          setIsPreparingAccount(false);
          setRequiresSaveConfirmation(true);
          autoSaveTriggeredRef.current = false;
          setSaving(false);
          return false;
        }

        // Get property_id from publication if available
        let propertyId = effectivePropertyId;
        if (effectivePublicationId) {
          const { data: pub } = await supabase
            .from("agent_publications")
            .select("property_id")
            .eq("id", effectivePublicationId)
            .single();
          if (pub) propertyId = pub.property_id;
        }

        console.log("[PublicPropertyView] Property final para guardar", {
          propertyId, sourcePublicationId: effectivePublicationId, orgId, userId,
        });

        // Check if already saved
        const { data: existing } = await supabase
          .from("user_listings")
          .select("id")
          .eq("property_id", propertyId)
          .eq("org_id", orgId)
          .maybeSingle();

        if (existing) {
          console.log("[PublicPropertyView] La propiedad ya existía en user_listings");
          setSaved(true);
          setPendingAuthUserId(null);
          setIsPreparingAccount(false);
          setRequiresSaveConfirmation(false);
          clearPendingSaveState();
          toast({ title: "Ya tenés esta propiedad guardada", description: "Podés verla en tu listado personal." });
          setSaving(false);
          return true;
        }

        // Insert user listing with retries
        let lastInsertError: any = null;
        const MAX_INSERT_ATTEMPTS = 3;
        for (let attempt = 1; attempt <= MAX_INSERT_ATTEMPTS; attempt++) {
          console.log("[PublicPropertyView] Intentando insert en user_listings", { attempt, propertyId, orgId, userId });

          const { error: attemptError } = await supabase
            .from("user_listings")
            .insert({
              property_id: propertyId,
              org_id: orgId,
              listing_type: "rent",
              source_publication_id: effectivePublicationId || null,
              added_by: userId,
            });

          if (!attemptError) {
            console.log("[PublicPropertyView] Insert en user_listings OK");
            lastInsertError = null;
            break;
          }

          lastInsertError = attemptError;
          console.error("[PublicPropertyView] Insert falló", { attempt, message: attemptError.message });
          const isRlsError = /row-level security|policy|permission|denied|violates/i.test(attemptError.message || "");

          if (isRlsError && attempt < MAX_INSERT_ATTEMPTS) {
            await new Promise((r) => setTimeout(r, attempt * 2000));
            try { await supabase.auth.refreshSession(); } catch { /* ignorar */ }
          } else {
            break;
          }
        }

        if (lastInsertError) throw lastInsertError;

        // Track listing_saved event
        await trackEvent({
          eventType: "listing_saved",
          propertyId: propertyId,
          sourcePublicationId: effectivePublicationId,
          userId,
          orgId: orgId,
        });

        setSaved(true);
        setPendingAuthUserId(null);
        setIsPreparingAccount(false);
        setRequiresSaveConfirmation(false);
        clearPendingSaveState();
        toast({
          title: "¡Propiedad guardada!",
          description: "La encontrarás en tu listado personal.",
        });

        setTimeout(() => navigate(ROUTES.DASHBOARD), 1500);
        return true;
      } catch (err: any) {
        console.error("[PublicPropertyView] Save error", err);
        setIsPreparingAccount(false);
        setRequiresSaveConfirmation(true);
        autoSaveTriggeredRef.current = false;
        toast({
          title: "Error crítico BD",
          description: err?.message || JSON.stringify(err) || "El registro fue rechazado por Supabase.",
          variant: "destructive",
        });
        return false;
      } finally {
        setSaving(false);
      }
    },
    [effectivePropertyId, effectivePublicationId, saving, saved, toast, navigate, trackEvent, claimAnonymousEvents]
  );

  // Check for pending save after OAuth redirect — show confirm modal instead of auto-save
  useEffect(() => {
    if ((!user?.id && !pendingAuthUserId) || !id || saving || saved) return;

    const pendingSave = getPendingSavePayload();
    const requiresAccept = sessionStorage.getItem(PENDING_SAVE_CONFIRM_KEY) === "1";

    console.log("[PublicPropertyView] Evaluando apertura del modal de confirmación", {
      currentPropertyId: id,
      currentUserId: user?.id ?? pendingAuthUserId ?? null,
      hasPendingSave: Boolean(pendingSave),
      requiresAccept,
      showConfirmModal,
      autoSaveAlreadyTriggered: autoSaveTriggeredRef.current,
      currentUrl: typeof window !== "undefined" ? window.location.href : null,
    });

    if (!pendingSave) {
      setRequiresSaveConfirmation(false);
      setIsPreparingAccount(false);
      return;
    }

    try {
      const { propertyId, publicationId } = JSON.parse(pendingSave);

      if (propertyId !== id) {
        console.log("[PublicPropertyView] El pending save corresponde a otra propiedad", {
          pendingPropertyId: propertyId,
          currentPropertyId: id,
          publicationId,
        });
        setIsPreparingAccount(false);
        return;
      }

      // Mostrar modal de confirmación con el link antes de guardar
      if (!showConfirmModal && (!autoSaveTriggeredRef.current || requiresAccept)) {
        autoSaveTriggeredRef.current = true;
        console.log("[PublicPropertyView] Abriendo modal de confirmación", {
          propertyId,
          publicationId,
          triggeredFrom: requiresAccept ? "confirm-flag" : "pending-save-detected",
        });
        setShowConfirmModal(true);
      }

    } catch {
      console.error("[PublicPropertyView] No se pudo parsear pending_property_save. Limpiando estado.");
      clearPendingSaveState();
      setRequiresSaveConfirmation(false);
      setIsPreparingAccount(false);
    }
  }, [user?.id, pendingAuthUserId, id, saving, saved, showConfirmModal]);

  /** Usuario acepta en el modal de confirmación → se procede a guardar */
  const handleConfirmSave = () => {
    const confirmedUserId = user?.id ?? pendingAuthUserId;

    console.log("[PublicPropertyView] Usuario confirmó guardado", {
      confirmedUserId: confirmedUserId ?? null,
      propertyId: id,
      publicationId: pubId,
      propertyUrl,
    });

    setShowConfirmModal(false);
    sessionStorage.removeItem(PENDING_SAVE_CONFIRM_KEY);

    if (!confirmedUserId) {
      autoSaveTriggeredRef.current = false;
      toast({
        title: "Falta sesión",
        description: "Todavía no terminamos de sincronizar tu cuenta. Intentá nuevamente en unos segundos.",
        variant: "destructive",
      });
      return;
    }

    setIsPreparingAccount(true);
    setRequiresSaveConfirmation(false);

    // Delay de 3s para dar tiempo al trigger de BD
    setTimeout(() => {
      console.log("[PublicPropertyView] Guardado post-confirmación", { userId: confirmedUserId, propertyId: id });
      void handleSaveProperty(confirmedUserId);
    }, 3000);
  };

  const handleSaveClick = async () => {
    if (user?.id) {
      console.log("[PublicPropertyView] Reintento manual de guardado", { userId: user.id, propertyId: id });
      if (requiresSaveConfirmation) {
        setRequiresSaveConfirmation(false);
      }
      void handleSaveProperty(user.id);
    } else {
      try {
        await cachePublicationReferrer();
      } catch (error) {
        console.error("Error caching publication referrer:", error);
      }

      const pendingPayload = JSON.stringify({ propertyId: id, publicationId: pubId });
      const returnUrl = window.location.pathname + window.location.search;

      persistPendingSaveState(pendingPayload, returnUrl);
      sessionStorage.setItem(PENDING_SAVE_CONFIRM_KEY, "1");

      console.log("[PublicPropertyView] Guardado pendiente persistido antes de auth", {
        propertyId: id,
        publicationId: pubId,
        returnUrl,
        referralId: localStorage.getItem("hf_referral_id"),
      });

      setShowAuthModal(true);
    }
  };

  const handleAuthenticated = (userId: string) => {
    if (id) {
      const pendingPayload = JSON.stringify({ propertyId: id, publicationId: pubId });
      persistPendingSaveState(pendingPayload, window.location.pathname + window.location.search);
    }

    console.log("[PublicPropertyView] Auth completado dentro del modal", {
      userId,
      propertyId: id,
      publicationId: pubId,
    });

    setPendingAuthUserId(userId);
    setShowAuthModal(false);
    setRequiresSaveConfirmation(false);
    sessionStorage.setItem(PENDING_SAVE_CONFIRM_KEY, "1");
    autoSaveTriggeredRef.current = true;
    setShowConfirmModal(true);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: property?.title, url });
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copiado" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold text-foreground">Propiedad no encontrada</p>
          <p className="text-sm text-muted-foreground">
            Es posible que el link sea incorrecto o la propiedad fue eliminada.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-start justify-center py-8 px-4">
      <div className="w-full max-w-2xl bg-card rounded-2xl shadow-lg overflow-hidden border border-border">
        {/* Image carousel */}
        <div className="relative h-72 sm:h-80 bg-muted">
          {property.images.length > 0 ? (
            <img
              src={property.images[activeImg]}
              alt={property.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              Sin imágenes
            </div>
          )}
          {property.images.length > 1 && (
            <>
              <button
                onClick={() =>
                  setActiveImg(
                    (p) => (p - 1 + property.images.length) % property.images.length
                  )
                }
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-card/90 rounded-full p-1.5 hover:bg-card transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() =>
                  setActiveImg((p) => (p + 1) % property.images.length)
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-card/90 rounded-full p-1.5 hover:bg-card transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {property.images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      i === activeImg ? "bg-card scale-125" : "bg-card/50"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="p-6 space-y-5">
          <div>
            <h1 className="text-xl font-bold text-foreground leading-tight">
              {property.title}
            </h1>
            <div className="flex items-center gap-1.5 text-muted-foreground mt-1">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">
                {property.neighborhood}
                {property.city ? `, ${property.city}` : ""}
              </span>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-muted rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-foreground">{property.sq_meters}</div>
              <div className="text-xs text-muted-foreground">m²</div>
            </div>
            <div className="bg-muted rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-foreground">{property.rooms}</div>
              <div className="text-xs text-muted-foreground">
                {property.rooms === 1 ? "Ambiente" : "Ambientes"}
              </div>
            </div>
            <div className="bg-muted rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-foreground">
                {currencySymbol(property.currency)}
              </div>
              <div className="text-xs text-muted-foreground">Moneda</div>
            </div>
          </div>

          {/* Price breakdown */}
          <div className="bg-muted rounded-xl p-4">
            <div className="flex justify-between">
              <span className="font-semibold text-foreground">Costo</span>
              <span className="font-bold text-foreground text-lg">
                {currencySymbol(property.currency)}{" "}
                {property.total_cost.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Details */}
          {property.details && (
            <div className="text-sm text-muted-foreground whitespace-pre-line">
              {property.details}
            </div>
          )}

          {/* Status messages */}
          {isPreparingAccount && (
            <div className="rounded-xl border border-border bg-muted p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                Estamos preparando tu cuenta.
              </div>
              <p className="text-sm text-muted-foreground">
                Esperá unos segundos mientras se crea tu espacio para guardar la propiedad.
              </p>
            </div>
          )}

          {requiresSaveConfirmation && (
            <div className="rounded-xl border border-border bg-muted p-4 space-y-1.5">
              <p className="text-sm font-semibold text-foreground">Tu cuenta ya fue creada.</p>
              <p className="text-sm text-muted-foreground">
                Si el guardado automático no salió, tocá <span className="text-foreground font-medium">Guardar en mi listado</span> para reintentarlo.
              </p>
            </div>
          )}

          {saved && (
            <div className="rounded-xl border border-border bg-primary/5 p-4 space-y-3">
              <p className="text-sm font-semibold text-primary">
                ✓ Ya tenés esta propiedad guardada en tu listado.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => navigate(ROUTES.DASHBOARD)}
                  className="flex-1 gap-2"
                  variant="secondary"
                >
                  Ir a Mi Listado
                </Button>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              className="flex-1 gap-2"
              size="lg"
              onClick={handleSaveClick}
              disabled={saving || saved || isPreparingAccount}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isPreparingAccount ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Bookmark className={`w-4 h-4 ${saved ? "fill-current" : ""}`} />
              )}
              {saved
                ? "Guardada"
                : isPreparingAccount
                  ? "Preparando cuenta..."
                  : "Guardar en mi listado"}
            </Button>
            <Button variant="outline" size="lg" onClick={handleShare}>
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Modal de autenticación */}
      <RequireAuthModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthenticated={handleAuthenticated}
        returnUrl={window.location.pathname + window.location.search}
      />

      {/* Modal de confirmación antes de guardar */}
      <Dialog open={showConfirmModal} onOpenChange={() => {}}>
        <DialogContent
          className="max-w-md rounded-2xl border-none shadow-2xl [&>button]:hidden"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <div className="p-2 space-y-5">
            <div className="space-y-2 text-center">
              <div className="mx-auto w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-3">
                <Bookmark className="w-7 h-7 text-primary" />
              </div>
              <DialogTitle className="text-xl font-bold text-foreground">
                ¿Guardar esta propiedad?
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Se va a guardar en tu listado personal para que puedas hacer seguimiento.
              </DialogDescription>
            </div>

            {/* Link de la propiedad */}
            <div className="bg-muted rounded-xl p-3 space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Link de la propiedad</p>
              <p className="text-sm text-foreground font-mono break-all select-all">
                {propertyUrl}
              </p>
            </div>

            {property && (
              <div className="bg-muted rounded-xl p-3">
                <p className="text-sm font-semibold text-foreground truncate">{property.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {property.neighborhood}{property.city ? `, ${property.city}` : ""}
                </p>
              </div>
            )}

            <Button
              className="w-full h-12 rounded-xl font-bold text-base"
              onClick={handleConfirmSave}
            >
              Aceptar y guardar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
