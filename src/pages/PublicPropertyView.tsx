import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, ChevronLeft, ChevronRight, Bookmark, Loader2, Share2 } from "lucide-react";
import { currencySymbol } from "@/lib/currency";
import { Button } from "@/components/ui/button";
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

  // Track if QR scan event was already fired
  const qrTrackedRef = useRef(false);

  const source = searchParams.get("source");
  const pubId = searchParams.get("pub_id");

  // Auth state — user may be null on public view (not behind ProtectedRoute)
  const { user } = useCurrentUser();

  const cachePublicationReferrer = useCallback(async () => {
    if (!pubId || sessionStorage.getItem("hf_referral_id")) return;

    const { data: publication } = await supabase
      .from("agent_publications")
      .select("published_by")
      .eq("id", pubId)
      .maybeSingle();

    if (publication?.published_by) {
      sessionStorage.setItem("hf_referral_id", publication.published_by);
    }
  }, [pubId]);

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

  // Check for pending save after OAuth redirect
  useEffect(() => {
    if (!user?.id || !id) return;
    const pendingSave = sessionStorage.getItem(PENDING_SAVE_KEY);
    if (!pendingSave) {
      setRequiresSaveConfirmation(false);
      setIsPreparingAccount(false);
      return;
    }

    let cancelled = false;

    const restorePendingSave = async () => {
      setIsPreparingAccount(true);

      try {
        const { propertyId } = JSON.parse(pendingSave);
        if (propertyId !== id) {
          if (!cancelled) {
            setIsPreparingAccount(false);
          }
          return;
        }

        const needsConfirmation = sessionStorage.getItem(PENDING_SAVE_CONFIRM_KEY) === "1";
        const orgId = await getUserOrgIdWithRetry(user.id, 7);

        if (cancelled) return;

        if (!orgId) {
          setIsPreparingAccount(false);
          return;
        }

        if (needsConfirmation) {
          setRequiresSaveConfirmation(true);
          setIsPreparingAccount(false);
          return;
        }

        setIsPreparingAccount(false);
        void handleSaveProperty(user.id, orgId);
      } catch {
        sessionStorage.removeItem(PENDING_SAVE_KEY);
        sessionStorage.removeItem(PENDING_SAVE_CONFIRM_KEY);
        if (!cancelled) {
          setRequiresSaveConfirmation(false);
          setIsPreparingAccount(false);
        }
      }
    };

    void restorePendingSave();

    return () => {
      cancelled = true;
    };
  }, [user?.id, id]);

  const handleSaveProperty = useCallback(
    async (userId: string, preloadedOrgId?: string | null) => {
      if (!id || saving || saved) return false;
      setSaving(true);

      try {
        // Claim anonymous analytics events
        if (pubId) {
          await claimAnonymousEvents(userId, id, pubId);
        }

        // Get user's org — retry a few times for new signups (trigger may still be running)
        const orgId = preloadedOrgId ?? await getUserOrgIdWithRetry(userId, 7);

        if (!orgId) {
          toast({
            title: "Error",
            description: "No se encontró una organización asociada a tu cuenta. Intentá nuevamente en unos segundos.",
            variant: "destructive",
          });
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

        // Check if already saved
        const { data: existing } = await supabase
          .from("user_listings")
          .select("id")
          .eq("property_id", propertyId)
          .eq("org_id", orgId)
          .maybeSingle();

        if (existing) {
          setSaved(true);
          setRequiresSaveConfirmation(false);
          sessionStorage.removeItem(PENDING_SAVE_KEY);
          sessionStorage.removeItem(PENDING_SAVE_CONFIRM_KEY);
          toast({ title: "Ya tenés esta propiedad guardada" });
          setSaving(false);
          return true;
        }

        // Insert user listing with status 'ingresado'
        const { error: insertError } = await supabase
          .from("user_listings")
          .insert({
            property_id: propertyId,
            org_id: orgId,
            listing_type: "rent",
            source_publication_id: pubId || null,
            added_by: userId,
          });

        if (insertError) throw insertError;

        // Track listing_saved event
        await trackEvent({
          eventType: "listing_saved",
          propertyId: propertyId,
          sourcePublicationId: pubId,
          userId,
          orgId: orgId,
        });

        setSaved(true);
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
        console.error("Save error:", err);
        toast({
          title: "Error al guardar",
          description: err?.message || "Intentá nuevamente.",
          variant: "destructive",
        });
        return false;
      } finally {
        setSaving(false);
      }
    },
    [id, pubId, saving, saved, toast, navigate, trackEvent, claimAnonymousEvents]
  );

  const handleSaveClick = async () => {
    if (user?.id) {
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
          <div className="bg-muted rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Alquiler mensual</span>
              <span className="font-medium text-foreground">
                {currencySymbol(property.currency)}{" "}
                {property.price_rent.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">G/C</span>
              <span className="font-medium text-foreground">
                {currencySymbol(property.currency)}{" "}
                {property.price_expenses.toLocaleString()}
              </span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between">
              <span className="font-semibold text-foreground">Costo mensual total</span>
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
                Tocá <span className="text-foreground font-medium">Aceptar</span> para guardar esta propiedad en tu listado.
              </p>
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
                  : requiresSaveConfirmation
                    ? "Aceptar"
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
