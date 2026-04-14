import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, ChevronLeft, ChevronRight, Bookmark, Loader2, Share2, ExternalLink, CheckCircle2 } from "lucide-react";
import { currencySymbol } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAnalytics } from "@/hooks/useAnalytics";
import { RequireAuthModal } from "@/components/auth/RequireAuthModal";
import { useCurrentUser } from "@/contexts/AuthProvider";
import { useProfile } from "@/hooks/useProfile";

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

  // Track if QR scan event was already fired
  const qrTrackedRef = useRef(false);
  // Track if auto-save was already triggered (prevents double-fire)
  const autoSaveTriggeredRef = useRef(false);

  const source = searchParams.get("source");
  const pubId = searchParams.get("pub_id");
  const refParam = searchParams.get("ref");

  // Auth state — user may be null on public view (not behind ProtectedRoute)
  const { user } = useCurrentUser();
  const { data: profile, isLoading: isProfileLoading } = useProfile();
  const isGoogleUser = user?.app_metadata?.provider === "google";
  const isPhoneReady = !isGoogleUser || Boolean(profile?.phone?.trim());
  const hasPendingSave = typeof window !== "undefined"
    ? Boolean(sessionStorage.getItem(PENDING_SAVE_KEY))
    : false;
  

  /**
   * Guarda el referral ID en localStorage para que el modal de registro lo use.
   * Prioridad: 1) parámetro ?ref= de la URL (viene del QR), 2) consulta a BD.
   */
  const cachePublicationReferrer = useCallback(async () => {
    // Si ya hay un referral cacheado, no sobreescribir
    if (localStorage.getItem("hf_referral_id")) return;

    // Prioridad 1: usar ?ref= de la URL (viene directo del QR, no necesita BD)
    if (refParam) {
      localStorage.setItem("hf_referral_id", refParam);
      return;
    }

    // Prioridad 2: fallback a consulta BD (si no vino ?ref= en la URL)
    if (!pubId) return;

    const { data: publication } = await supabase
      .from("agent_publications")
      .select("published_by")
      .eq("id", pubId)
      .maybeSingle();

    if (publication?.published_by) {
      localStorage.setItem("hf_referral_id", publication.published_by);
    }
  }, [pubId, refParam]);

  // Fetch property data
  useEffect(() => {
    if (!id) return;
    const fetchProperty = async () => {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from("properties")
        .select("id, title, neighborhood, city, rooms, m2_total, price_amount, price_expenses, total_cost, currency, images, details, ref")
        .eq("id", id)
        .single();

      if (fetchError || !data) {
        setError("No se encontró la propiedad.");
      } else {
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
    if (!id || !source || source !== "qr" || qrTrackedRef.current) return;
    qrTrackedRef.current = true;
    trackEvent({
      eventType: "qr_scan",
      propertyId: id,
      sourcePublicationId: pubId,
      userId: user?.id || null,
      metadata: { qr_source: "qr", user_agent: navigator.userAgent },
    });
  }, [id, source, pubId, user?.id, trackEvent]);

  // Track property view event
  useEffect(() => {
    if (!id) return;
    trackEvent({
      eventType: "property_view",
      propertyId: id,
      sourcePublicationId: pubId,
      userId: user?.id || null,
    });
  }, [id, pubId, user?.id, trackEvent]);

  const handleSaveProperty = useCallback(
    async (userId: string, preloadedOrgId?: string | null) => {
      if (!id || saving || saved) return false;
      setSaving(true);

      try {
        console.log("[PublicPropertyView] Iniciando guardado QR", {
          propertyId: id,
          publicationId: pubId,
          userId,
          preloadedOrgId: preloadedOrgId ?? null,
          isGoogleUser,
          phoneReady: isPhoneReady,
          referredById: profile?.referredById ?? null,
        });

        if (isGoogleUser && !isPhoneReady) {
          console.warn("[PublicPropertyView] Guardado pausado: falta teléfono para usuario Google", {
            userId,
            propertyId: id,
          });
          setIsPreparingAccount(false);
          setRequiresSaveConfirmation(true);
          autoSaveTriggeredRef.current = false;
          toast({
            title: "Falta tu celular",
            description: "Guardalo para terminar de guardar este aviso en tu listado.",
          });
          return false;
        }

        // Forzar refresh del JWT para asegurar que auth.uid() esté sincronizado en la BD.
        // Esto resuelve el race condition post-Google OAuth donde el token local
        // puede no haberse propagado correctamente al servidor.
        try {
          await supabase.auth.refreshSession();
        } catch {
          // Continuar aunque falle el refresh — el token actual podría funcionar
          console.warn("[PublicPropertyView] refreshSession falló, continuando con token actual");
        }

        // Claim anonymous analytics events
        if (pubId) {
          await claimAnonymousEvents(userId, id, pubId);
        }

        // Get user's org — retry a few times for new signups (trigger may still be running)
        const orgId = preloadedOrgId ?? await getUserOrgIdWithRetry(userId, 7);

        console.log("[PublicPropertyView] Resultado org lookup", {
          userId,
          orgId,
          propertyId: id,
        });

        if (!orgId) {
          console.warn("[PublicPropertyView] No se encontró organización para guardar", {
            userId,
            propertyId: id,
            publicationId: pubId,
          });
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
        let propertyId = id;
        if (pubId) {
          const { data: pub } = await supabase
            .from("agent_publications")
            .select("property_id")
            .eq("id", pubId)
            .single();
          if (pub) propertyId = pub.property_id;
        }

        console.log("[PublicPropertyView] Property final para guardar", {
          propertyId,
          sourcePublicationId: pubId,
          orgId,
          userId,
        });

        // Check if already saved
        const { data: existing } = await supabase
          .from("user_listings")
          .select("id")
          .eq("property_id", propertyId)
          .eq("org_id", orgId)
          .maybeSingle();

        if (existing) {
          console.log("[PublicPropertyView] La propiedad ya existía en user_listings", {
            propertyId,
            orgId,
            userId,
            listingId: existing.id,
          });
          setSaved(true);
          setIsPreparingAccount(false);
          setRequiresSaveConfirmation(false);
          sessionStorage.removeItem(PENDING_SAVE_KEY);
          sessionStorage.removeItem(PENDING_SAVE_CONFIRM_KEY);
          toast({ title: "Ya tenés esta propiedad guardada", description: "Podés verla en tu listado personal." });
          setSaving(false);
          return true;
        }

        // Insert user listing with status 'ingresado'
        // Reintentos con backoff para absorber race conditions de RLS post-OAuth
        let lastInsertError: any = null;
        const MAX_INSERT_ATTEMPTS = 3;
        for (let attempt = 1; attempt <= MAX_INSERT_ATTEMPTS; attempt++) {
          console.log("[PublicPropertyView] Intentando insert en user_listings", {
            attempt,
            maxAttempts: MAX_INSERT_ATTEMPTS,
            propertyId,
            orgId,
            userId,
            sourcePublicationId: pubId || null,
          });

          const { error: attemptError } = await supabase
            .from("user_listings")
            .insert({
              property_id: propertyId,
              org_id: orgId,
              listing_type: "rent",
              source_publication_id: pubId || null,
              added_by: userId,
            });

          if (!attemptError) {
            console.log("[PublicPropertyView] Insert en user_listings OK", {
              propertyId,
              orgId,
              userId,
            });
            lastInsertError = null;
            break;
          }

          lastInsertError = attemptError;
          console.error("[PublicPropertyView] Insert en user_listings falló", {
            attempt,
            propertyId,
            orgId,
            userId,
            message: attemptError.message,
          });
          const isRlsError = /row-level security|policy|permission|denied|violates/i.test(
            attemptError.message || ""
          );

          if (isRlsError && attempt < MAX_INSERT_ATTEMPTS) {
            console.warn(
              `[PublicPropertyView] Insert intento ${attempt}/${MAX_INSERT_ATTEMPTS} bloqueado por RLS, reintentando en ${attempt * 2}s...`,
              attemptError.message
            );
            await new Promise((r) => setTimeout(r, attempt * 2000));
            // Refresh JWT antes del siguiente intento
            try {
              await supabase.auth.refreshSession();
            } catch { /* ignorar */ }
          } else {
            break;
          }
        }

        if (lastInsertError) throw lastInsertError;

        // Track listing_saved event
        await trackEvent({
          eventType: "listing_saved",
          propertyId: propertyId,
          sourcePublicationId: pubId,
          userId,
          orgId: orgId,
        });

        setSaved(true);
        setIsPreparingAccount(false);
        setRequiresSaveConfirmation(false);
        sessionStorage.removeItem(PENDING_SAVE_KEY);
        sessionStorage.removeItem(PENDING_SAVE_CONFIRM_KEY);
        toast({
          title: "¡Propiedad guardada!",
          description: "La encontrarás en tu listado personal.",
        });

        // Redirect to dashboard after short delay
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
    [id, pubId, saving, saved, toast, navigate, trackEvent, claimAnonymousEvents, isGoogleUser, isPhoneReady, profile?.referredById]
  );

  // Check for pending save after OAuth redirect — AUTO-SAVE
  useEffect(() => {
    if (!user?.id || !id || saving || saved) return;
    const pendingSave = sessionStorage.getItem(PENDING_SAVE_KEY);
    if (!pendingSave) {
      setRequiresSaveConfirmation(false);
      setIsPreparingAccount(false);
      return;
    }

    try {
      const { propertyId } = JSON.parse(pendingSave);
      if (propertyId !== id) {
        setIsPreparingAccount(false);
        return;
      }

      if (isGoogleUser && (isProfileLoading || !isPhoneReady)) {
        console.log("[PublicPropertyView] Esperando teléfono antes del auto-guardado", {
          userId: user.id,
          propertyId: id,
          phoneReady: isPhoneReady,
          isProfileLoading,
          referredById: profile?.referredById ?? null,
        });
        setIsPreparingAccount(false);
        autoSaveTriggeredRef.current = false;
        return;
      }

      // AUTO-SAVE: Disparar el guardado automáticamente tras OAuth redirect.
      // Usamos un ref para evitar que se dispare más de una vez.
      if (!autoSaveTriggeredRef.current) {
        autoSaveTriggeredRef.current = true;
        setIsPreparingAccount(true);
        setRequiresSaveConfirmation(false);

        // Delay de 3s para dar tiempo al trigger de BD (handle_new_user_profile)
        // a crear la organización + membresía, y al JWT a sincronizarse.
        const timer = setTimeout(() => {
          console.log("[PublicPropertyView] Auto-save triggered", {
            userId: user.id,
            propertyId: id,
            publicationId: pubId,
            phoneReady: isPhoneReady,
            referredById: profile?.referredById ?? null,
          });
          handleSaveProperty(user.id);
        }, 3000);

        return () => clearTimeout(timer);
      }

    } catch {
      sessionStorage.removeItem(PENDING_SAVE_KEY);
      sessionStorage.removeItem(PENDING_SAVE_CONFIRM_KEY);
      setRequiresSaveConfirmation(false);
      setIsPreparingAccount(false);
    }
  }, [user?.id, id, saving, saved, handleSaveProperty, isGoogleUser, isPhoneReady, isProfileLoading, pubId, profile?.referredById]);


  const handleSaveClick = async () => {
    if (user?.id) {
      console.log("[PublicPropertyView] Reintento manual de guardado", {
        userId: user.id,
        propertyId: id,
        publicationId: pubId,
        phoneReady: isPhoneReady,
      });
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

      // Store pending save state
      sessionStorage.setItem(
        PENDING_SAVE_KEY,
        JSON.stringify({ propertyId: id, publicationId: pubId })
      );
      sessionStorage.setItem(PENDING_SAVE_CONFIRM_KEY, "1");
      setShowAuthModal(true);
    }
  };

  const handleAuthenticated = (userId: string) => {
    setShowAuthModal(false);
    handleSaveProperty(userId);
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

          {/* Actions */}
          {user?.id && hasPendingSave && isGoogleUser && !isProfileLoading && !isPhoneReady && (
            <div className="rounded-xl border border-border bg-muted p-4 space-y-1.5">
              <p className="text-sm font-semibold text-foreground">Paso 1 de 2: guardá tu celular.</p>
              <p className="text-sm text-muted-foreground">
                Apenas completes ese dato, volvemos a intentar guardar este aviso automáticamente.
              </p>
            </div>
          )}

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
              <p className="text-sm font-semibold text-foreground">Paso 2 de 2: tu cuenta ya fue creada.</p>
              <p className="text-sm text-muted-foreground">
                Si el guardado automático no salió, tocá <span className="text-foreground font-medium">Guardar en mi listado</span> para reintentarlo.
              </p>
            </div>
          )}

          {saved && (
            <div className="rounded-xl border border-border bg-green-50 dark:bg-green-950/30 p-4 space-y-3">
              <p className="text-sm font-semibold text-green-800 dark:text-green-300">
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

      <RequireAuthModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthenticated={handleAuthenticated}
        returnUrl={window.location.pathname + window.location.search}
      />
    </div>
  );
}
