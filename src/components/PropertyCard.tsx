import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useSystemConfig } from "@/hooks/useSystemConfig";
import { APP_BRAND_NAME_DEFAULT, APP_BRAND_NAME_KEY } from "@/lib/config-keys";
import { Property, PropertyStatus, STATUS_CONFIG, MarketplacePropertyStatus } from "@/types/property";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusChangeConfirmDialog } from "@/components/ui/StatusChangeConfirmDialog";
import { Trash2, XCircle, ExternalLink, CalendarIcon, CalendarPlus, Building2, Users, Star, MessageCircle, Trophy, Sparkles, Rocket } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { format } from "date-fns";
import { PROPERTY_STATUS_LABELS } from "@/lib/constants";
import { PropertyCardBase } from "@/components/ui/PropertyCardBase";
import { FullScreenGallery } from "@/components/ui/FullScreenGallery";
import { usePropertyRating } from "@/hooks/usePropertyRating";
import { StarRating } from "@/components/ui/StarRating";

/** Pros = score 5, contras = score 1 en attribute_scores */
export interface ProsAndConsAttributeIds {
  positiveIds: string[];
  negativeIds: string[];
}

interface PropertyCardProps {
  property: Property;
  onStatusChange: (
    id: string,
    status: PropertyStatus,
    deletedReason?: string,
    coordinatedDate?: string | null,
    groupId?: string | null,
    contactedName?: string,
    discardedAttributeIds?: string[],
    prosAndCons?: ProsAndConsAttributeIds,
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
    }
  ) => void;
  onClick: () => void;
  ownerEmail?: string | null;
}

function formatDateTime(date: Date): string {
  return format(date, "dd/MM/yyyy HH:mm");
}

/** Formato YYYY-MM-DDTHH:mm para input datetime-local (hora local). */
function toDatetimeLocalString(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Genera URL de Google Calendar para agregar el evento. Formato: YYYYMMDDTHHmmss (local). */
function buildGoogleCalendarUrl(
  title: string,
  startDate: Date,
  details?: string,
  location?: string,
  attendees?: string[]
): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = startDate.getFullYear();
  const m = pad(startDate.getMonth() + 1);
  const d = pad(startDate.getDate());
  const h = pad(startDate.getHours());
  const min = pad(startDate.getMinutes());
  const sec = pad(startDate.getSeconds());
  const start = `${y}${m}${d}T${h}${min}${sec}`;
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
  const end = `${endDate.getFullYear()}${pad(endDate.getMonth() + 1)}${pad(endDate.getDate())}T${pad(endDate.getHours())}${pad(endDate.getMinutes())}${pad(endDate.getSeconds())}`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${start}/${end}`,
  });
  if (details) params.set("details", details);
  if (location) params.set("location", location);
  if (attendees && attendees.length > 0) params.set("add", attendees.join(","));
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

const MARKETPLACE_STATUS_OVERLAY: Record<string, { label: string; className: string } | null> = {
  active: null,
  paused: null,
  reserved: { label: "Reservada", className: "bg-blue-600/90 text-white" },
  sold: { label: "Vendida", className: "bg-slate-900/90 text-white" },
  rented: { label: "Alquilada", className: "bg-purple-600/90 text-white" },
  deleted: null,
};

export function PropertyCard({ property, onStatusChange, onClick, ownerEmail }: PropertyCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [discardReasonText, setDiscardReasonText] = useState("");
  const [showProsConsConfirm, setShowProsConsConfirm] = useState(false);
  const [pendingProsConsStatus, setPendingProsConsStatus] = useState<"firme_candidato" | "posible_interes" | null>(null);
  const [closePriceScore, setClosePriceScore] = useState(0);
  const [closeConditionScore, setCloseConditionScore] = useState(0);
  const [closeSecurityScore, setCloseSecurityScore] = useState(0);
  const [closeGuaranteeScore, setCloseGuaranteeScore] = useState(0);
  const [closeMovingScore, setCloseMovingScore] = useState(0);
  const [showCoordinatedConfirm, setShowCoordinatedConfirm] = useState(false);
  const [coordinatedDateTime, setCoordinatedDateTime] = useState("");
  const [coordinatedResponseSpeed, setCoordinatedResponseSpeed] = useState(0);
  const [coordinatedAttentionQuality, setCoordinatedAttentionQuality] = useState(0);
  const [coordinatedAppHelpScore, setCoordinatedAppHelpScore] = useState(0);
  const [isEditingCoordinatedVisit, setIsEditingCoordinatedVisit] = useState(false);
  const [showCalendarOfferConfirm, setShowCalendarOfferConfirm] = useState(false);
  const [calendarOfferDate, setCalendarOfferDate] = useState<Date | null>(null);
  const [calendarMotivationText, setCalendarMotivationText] = useState(
    "🏡✨ Falta menos para ver tu próximo hogar. ¡No te olvides de agendar la cita!"
  );
  const [familyMemberEmails, setFamilyMemberEmails] = useState<string[]>([]);
  const [showContactedConfirm, setShowContactedConfirm] = useState(false);
  const [showMetaAchievedConfirm, setShowMetaAchievedConfirm] = useState(false);
  const [showMetaSurveyConfirm, setShowMetaSurveyConfirm] = useState(false);
  const [metaAgentPunctuality, setMetaAgentPunctuality] = useState(0);
  const [metaAgentAttention, setMetaAgentAttention] = useState(0);
  const [metaAppPerformance, setMetaAppPerformance] = useState(0);
  const [metaAppSupport, setMetaAppSupport] = useState(0);
  const [metaAppPrice, setMetaAppPrice] = useState(0);
  const [contactedName, setContactedName] = useState("");
  const [contactedInterest, setContactedInterest] = useState(0);
  const [contactedUrgency, setContactedUrgency] = useState(0);
  const [discardedOverallCondition, setDiscardedOverallCondition] = useState(0);
  const [discardedSurroundings, setDiscardedSurroundings] = useState(0);
  const [discardedHouseSecurity, setDiscardedHouseSecurity] = useState(0);
  const [discardedExpectedSize, setDiscardedExpectedSize] = useState(0);
  const [discardedPhotosReality, setDiscardedPhotosReality] = useState(0);
  const { toast } = useToast();
  const { value: appBrandName } = useSystemConfig(APP_BRAND_NAME_KEY, APP_BRAND_NAME_DEFAULT);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryInitialImg, setGalleryInitialImg] = useState(0);

  // Hook de calificación por estrellas (solo si hay grupo) — usa el propertyId real, no el user_listing ID
  const { userVote, averageRating, totalVotes, totalGroupMembers, rate } = usePropertyRating(property.propertyId || property.id, property.groupId || null);

  const config = STATUS_CONFIG[property.status];
  const mktOverlay = property.marketplaceStatus ? MARKETPLACE_STATUS_OVERLAY[property.marketplaceStatus] : null;
  const marketplaceAgentPhoneDigits = (property.marketplaceAgentPhone || "").replace(/\D/g, "");
  const marketplaceAgentWhatsappUrl = marketplaceAgentPhoneDigits ? `https://wa.me/${marketplaceAgentPhoneDigits}` : null;
  const statusOptions: PropertyStatus[] = ["ingresado", "contactado", "visita_coordinada", "posible_interes", "firme_candidato", "meta_conseguida", "descartado"];
  const statusTransitionsByOrigin: Partial<Record<PropertyStatus, Set<PropertyStatus>>> = {
    ingresado: new Set<PropertyStatus>(["contactado", "descartado"]),
    contactado: new Set<PropertyStatus>(["visita_coordinada", "descartado"]),
    visita_coordinada: new Set<PropertyStatus>(["firme_candidato", "posible_interes", "descartado"]),
    posible_interes: new Set<PropertyStatus>(["firme_candidato", "meta_conseguida", "descartado"]),
    firme_candidato: new Set<PropertyStatus>(["meta_conseguida", "descartado"]),
  };
  const allowedNextStatuses = statusTransitionsByOrigin[property.status];

  const handleStatusChange = (val: string) => {
    if (val === "eliminado") {
      setShowDeleteConfirm(true);
    } else if (val === "descartado") {
      setShowDiscardConfirm(true);
    } else if (val === "visita_coordinada") {
      setIsEditingCoordinatedVisit(false);
      setShowCoordinatedConfirm(true);
    } else if (val === "contactado") {
      setShowContactedConfirm(true);
    } else if (val === "meta_conseguida") {
      setShowMetaAchievedConfirm(true);
    } else if (val === "firme_candidato" || val === "posible_interes") {
      setPendingProsConsStatus(val);
      setClosePriceScore(0);
      setCloseConditionScore(0);
      setCloseSecurityScore(0);
      setCloseGuaranteeScore(0);
      setCloseMovingScore(0);
      setShowProsConsConfirm(true);
    } else {
      onStatusChange(property.id, val as PropertyStatus);
    }
  };

  const handleEditCoordinatedVisit = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setIsEditingCoordinatedVisit(true);
    if (property.coordinatedDate) {
      setCoordinatedDateTime(toDatetimeLocalString(property.coordinatedDate));
    } else {
      setCoordinatedDateTime("");
    }
    setCoordinatedResponseSpeed(0);
    setCoordinatedAttentionQuality(0);
    setCoordinatedAppHelpScore(0);
    setShowCoordinatedConfirm(true);
  };

  const openVisitCalendarEntry = (visitDate: Date) => {
    const location = [property.neighborhood, property.city].filter(Boolean).join(", ") || undefined;
    const contactName = property.marketplaceAgentName || ownerEmail || property.createdByEmail || "Sin nombre";
    const attendees = Array.from(
      new Set(
        familyMemberEmails
          .map((email) => email.trim())
          .filter((email) => email.includes("@"))
      )
    );
    const url = buildGoogleCalendarUrl(
      `Visita: ${property.title}. Contacto ${contactName}`,
      visitDate,
      property.url ? `Publicación: ${property.url}` : undefined,
      location,
      attendees
    );
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const groupIdForCalendar = property.groupId || null;
  const propertyIdForCalendar = property.id;
  useEffect(() => {
    const loadFamilyEmails = async () => {
      if (!groupIdForCalendar) {
        setFamilyMemberEmails([]);
        return;
      }
      const { data: members, error: membersError } = await supabase
        .from("organization_members")
        .select("user_id")
        .eq("org_id", groupIdForCalendar)
        .eq("is_active", true);
      if (membersError || !members || members.length === 0) {
        setFamilyMemberEmails([]);
        return;
      }
      const userIds = Array.from(new Set(members.map((m) => m.user_id).filter(Boolean)));
      if (userIds.length === 0) {
        setFamilyMemberEmails([]);
        return;
      }
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, email")
        .in("user_id", userIds);
      if (profilesError || !profilesData) {
        setFamilyMemberEmails([]);
        return;
      }
      setFamilyMemberEmails(
        profilesData
          .map((p) => p.email || "")
          .filter((email) => email.includes("@"))
      );
    };
    loadFamilyEmails();
  }, [groupIdForCalendar, propertyIdForCalendar]);

  const calendarMotivationOptions = [
    "🏡✨ Falta menos para ver tu próximo hogar. ¡No te olvides de agendar la cita!",
    "🧠💘 Modo cabecita de novio: que no se te escape la cita, agendala ahora.",
    "📅🔥 Para vos que no te olvidás ni de la cabeza porque la tenés pegada: ¡agendate la visita!",
    "🚀🏠 Un clic más y estás más cerca de comprar. Sumala al calendario ahora.",
    "⏰💡 Tu yo del futuro te lo agradece: dejá la visita agendada y listo.",
  ];

  const isEliminated = property.status === "eliminado";
  const isDiscarded = property.status === "descartado";
  const isAgentDeleted = property.status === "eliminado_agencia";

  const renderFiveStars = (
    value: number,
    onChange: (next: number) => void,
    label: string
  ) => (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-blue-200/70 bg-blue-50/70 px-3 py-2">
      <label className="text-sm font-medium text-blue-900 text-left leading-snug max-w-[70%]">
        {label}
      </label>
      <div className="flex items-center gap-1 shrink-0">
        {[1, 2, 3, 4, 5].map((starValue) => (
          <button
            key={`${label}-${starValue}`}
            type="button"
            onClick={() => onChange(starValue)}
            className="p-1 rounded-md hover:bg-blue-100 transition-colors"
            aria-label={`${label}: ${starValue} de 5`}
          >
            <Star
              className={cn(
                "w-5 h-5 transition-colors",
                starValue <= value ? "fill-amber-400 text-amber-400" : "text-blue-300/80"
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );

  const renderPriorityStars = (
    value: number,
    onChange: (next: number) => void,
    label: string
  ) => (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-blue-200/70 bg-blue-50/70 px-3 py-2">
      <label className="text-sm font-medium text-blue-900 text-left leading-snug max-w-[70%]">
        {label}
      </label>
      <div className="flex items-center gap-1 shrink-0">
        {[1, 2, 3, 4, 5].map((starValue) => (
          <button
            key={`${label}-${starValue}`}
            type="button"
            onClick={() => onChange(starValue)}
            className="p-1 rounded-md hover:bg-blue-100 transition-colors"
            aria-label={`${label}: ${starValue} de 5`}
          >
            <Star
              className={cn(
                "w-5 h-5 transition-colors",
                starValue <= value ? "fill-amber-400 text-amber-400" : "text-blue-300/80"
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <PropertyCardBase
        title={property.title}
        neighborhood={property.neighborhood}
        city={property.city}
        priceRent={property.priceRent}
        priceExpenses={property.priceExpenses}
        currency={property.currency}
        totalCost={property.totalCost}
        sqMeters={property.sqMeters}
        rooms={property.rooms}
        images={[...(property.images || []), ...(property.privateImages || [])]}
        listingType={property.listingType}
        onClick={onClick}
        onImageClick={(index) => {
          setGalleryInitialImg(index);
          setIsGalleryOpen(true);
        }}
        collapsibleImages
        className={isEliminated || isDiscarded || isAgentDeleted ? "opacity-60" : ""}
        statusOverlay={
          mktOverlay ? (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm shadow-md ${mktOverlay.className}`}>
              {mktOverlay.label}
            </span>
          ) : undefined
        }
        topOverlay={
          <>
            {property.isSharedListing && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/50 text-white backdrop-blur-md">
                <Users className="w-3 h-3" />
                Compartido por {ownerEmail || property.createdByEmail}
              </span>
            )}
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
              {config.label}
            </span>
            {property.hasUnreadComments && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-600 text-white backdrop-blur-md">
                {property.unreadCommentsCount || 0} comentario{(property.unreadCommentsCount || 0) === 1 ? "" : "s"} nuevo{(property.unreadCommentsCount || 0) === 1 ? "" : "s"}
              </span>
            )}
            {property.status === "ingresado" ? (
              <span className="inline-flex flex-col items-start px-2 py-1 rounded-lg text-[10px] bg-black/50 text-white backdrop-blur-md max-w-[200px] leading-relaxed">
                <span className="truncate w-full">por {ownerEmail || property.createdByEmail}</span>
                <span>{formatDateTime(property.createdAt)}</span>
              </span>
            ) : (
              <>
                {property.statusChangedByEmail && (
                  <span className="inline-flex flex-col items-start px-2 py-1 rounded-lg text-[10px] bg-black/50 text-white backdrop-blur-md max-w-[200px] leading-relaxed">
                    <span className="truncate w-full">por {property.statusChangedByEmail}</span>
                    {property.statusChangedAt && <span>{formatDateTime(property.statusChangedAt)}</span>}
                  </span>
                )}
                {property.status === "visita_coordinada" && (
                  <>
                    {property.coordinatedBy && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-black/50 text-white backdrop-blur-md">
                        Coordinado por {property.coordinatedBy}
                      </span>
                    )}
                    {property.coordinatedDate && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-black/50 text-white backdrop-blur-md">
                        <CalendarIcon className="w-3 h-3" />
                        Visita: {formatDateTime(property.coordinatedDate)}
                      </span>
                    )}
                  </>
                )}
                {property.status === "contactado" && (
                  <>
                    {property.contactedBy && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-black/50 text-white backdrop-blur-md">
                        Contactado por {property.contactedBy}
                      </span>
                    )}
                    {property.contactedName && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-black/50 text-white backdrop-blur-md">
                        Contacto: {property.contactedName}
                      </span>
                    )}
                  </>
                )}
              </>
            )}
          </>
        }
        ratingOverlay={
          property.groupId && (
            <div className={cn(
              "flex flex-col gap-2",
              mktOverlay && "mt-10" // Si hay badge de estado, bajamos las estrellas para no taparlo
            )}>
              <StarRating
                rating={userVote}
                averageRating={averageRating}
                totalVotes={totalVotes}
                totalGroupMembers={totalGroupMembers}
                onRate={rate}
                readonly={isDiscarded}
              />
            </div>
          )
        }
        subImageContent={
          <div className="px-4 pt-2 space-y-1">
            {/* Fila 1: Ingresado por / De agencia (izq) + Badge Alquiler/Venta (der). */}
            <div className="flex items-center justify-between gap-2">
              {property.sourceMarketplaceId ? (
                <div className="flex flex-col gap-0.5">
                  <span className="inline-flex items-center gap-1 text-[11px] text-primary font-medium">
                    <Building2 className="w-3 h-3" />
                    De agencia
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Agente: {property.marketplaceAgentName || "Agente no disponible"}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!marketplaceAgentWhatsappUrl) return;
                      window.open(marketplaceAgentWhatsappUrl, "_blank", "noopener,noreferrer");
                    }}
                    disabled={!marketplaceAgentWhatsappUrl}
                    className="inline-flex w-fit items-center gap-1 text-[11px] font-medium text-emerald-700 hover:text-emerald-800 hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
                  >
                    <MessageCircle className="w-3 h-3" />
                    Enviar WhatsApp
                  </button>
                </div>
              ) : ownerEmail ? (
                <span className="text-[11px] text-muted-foreground">
                  Ingresado por {ownerEmail}
                </span>
              ) : <span />}
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide shrink-0 ${property.listingType === "sale"
                ? "bg-accent/15 text-accent-foreground"
                : "bg-primary/10 text-primary"
                }`}>
                {property.listingType === "sale" ? "Venta" : "Alquiler"}
              </span>
            </div>
          </div>
        }
        extraBodyContent={
          <>
            <div className="flex justify-end">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 gap-1.5 hover:bg-muted text-[10px] font-normal -mt-2"
                  onClick={(e) => { e.stopPropagation(); window.open(property.url, "_blank"); }}
                  title="Ver publicación original"
                >
                  <span className="text-muted-foreground uppercase tracking-wider">link de la publicación</span>
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {isEliminated && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-2.5 space-y-1 mt-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-destructive">
                  <Trash2 className="w-3.5 h-3.5" />
                  Eliminado por {property.deletedByEmail || "desconocido"}
                </div>
                {property.deletedReason && (
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Motivo: {property.deletedReason}
                  </p>
                )}
              </div>
            )}

            {isDiscarded && (
              <div className="bg-status-discarded-bg border border-status-discarded/20 rounded-xl p-2.5 space-y-1 mt-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-status-discarded">
                  <XCircle className="w-3.5 h-3.5" />
                  Descartado por {property.discardedByEmail || "desconocido"}
                </div>
                {property.discardedReason && (
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Motivo: {property.discardedReason}
                  </p>
                )}
              </div>
            )}

            {isAgentDeleted && (
              <div className="bg-slate-100 border border-slate-200 rounded-xl p-2.5 space-y-1 mt-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <XCircle className="w-3.5 h-3.5" />
                  AVISO FINALIZADO POR AGENCIA
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Esta publicación ya no está disponible en el HFMarket. Podés conservarla aquí para tu historial familiar y ver tus notas.
                </p>
              </div>
            )}
          </>
        }
        actions={
          <>
            <Select
              value={property.status}
              onValueChange={handleStatusChange}
              disabled={isAgentDeleted}
            >
              <SelectTrigger className={cn(
                "h-8 text-xs w-auto border-border bg-background px-2 gap-1 rounded-lg",
                isAgentDeleted && "opacity-50 cursor-not-allowed"
              )}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(
                  statusOptions
                  .map((key) => [key, STATUS_CONFIG[key]] as const)
                ).map(([key, cfg]) => (
                    <SelectItem
                      key={key}
                      value={key}
                      className="text-xs data-[disabled]:text-muted-foreground/40"
                      disabled={!!allowedNextStatuses && !allowedNextStatuses.has(key)}
                    >
                      <span className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <StatusChangeConfirmDialog
              open={showDeleteConfirm}
              onOpenChange={(open) => {
                setShowDeleteConfirm(open);
                if (!open) setDeleteReason("");
              }}
              title="¿Eliminar esta propiedad?"
              description={`La propiedad "${property.title}" será marcada como eliminada. Indicá el motivo de la eliminación.`}
              confirmLabel="Eliminar"
              confirmClassName="bg-blue-600 text-white hover:bg-blue-700"
              onConfirm={() => onStatusChange(property.id, "eliminado", deleteReason)}
            >
              <Textarea
                placeholder="Motivo de la eliminación..."
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                className="resize-none text-sm min-h-[80px] rounded-xl"
              />
            </StatusChangeConfirmDialog>

            <StatusChangeConfirmDialog
              open={showDiscardConfirm}
              onOpenChange={(open) => {
                setShowDiscardConfirm(open);
                if (!open) {
                  setDiscardReasonText("");
                  setDiscardedOverallCondition(0);
                  setDiscardedSurroundings(0);
                  setDiscardedHouseSecurity(0);
                  setDiscardedExpectedSize(0);
                  setDiscardedPhotosReality(0);
                }
              }}
              title="💬 Antes de descartar, contanos tu experiencia"
              description={`Queremos aprender de tu visita a "${property.title}" ✨. Tu feedback ayuda a mejorar las recomendaciones del Market.`}
              confirmLabel="🧡 Confirmar descarte"
              confirmDisabled={
                !discardReasonText.trim() ||
                discardedOverallCondition === 0 ||
                discardedSurroundings === 0 ||
                discardedHouseSecurity === 0 ||
                discardedExpectedSize === 0 ||
                discardedPhotosReality === 0
              }
              confirmClassName="bg-gradient-to-r from-status-discarded to-rose-500 text-white hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none"
              onConfirm={async () => {
                await onStatusChange(
                  property.id,
                  "descartado",
                  discardReasonText.trim(),
                  undefined,
                  undefined,
                  undefined,
                  undefined,
                  undefined,
                  undefined,
                  undefined,
                  {
                    overallCondition: discardedOverallCondition,
                    surroundings: discardedSurroundings,
                    houseSecurity: discardedHouseSecurity,
                    expectedSize: discardedExpectedSize,
                    photosReality: discardedPhotosReality,
                  }
                );
                setShowDiscardConfirm(false);
                setDiscardReasonText("");
              }}
            >
              <div className="space-y-4 py-2">
                <label className="text-sm font-medium text-foreground text-left block">🧾 Motivo del descarte</label>
                <Textarea
                  placeholder="Contanos brevemente por qué descartás esta propiedad..."
                  value={discardReasonText}
                  onChange={(e) => setDiscardReasonText(e.target.value)}
                  className="resize-none text-sm min-h-[80px] rounded-xl"
                />
                {renderFiveStars(discardedOverallCondition, setDiscardedOverallCondition, "🏠 Estado general de la propiedad")}
                {renderFiveStars(discardedSurroundings, setDiscardedSurroundings, "🌳 Entorno (casas linderas y barrio)")}
                {renderFiveStars(discardedHouseSecurity, setDiscardedHouseSecurity, "🔐 Seguridad de la casa")}
                {renderFiveStars(discardedExpectedSize, setDiscardedExpectedSize, "📐 El tamaño era el esperado")}
                {renderFiveStars(discardedPhotosReality, setDiscardedPhotosReality, "📸 Las fotos mostraban la realidad")}
              </div>
            </StatusChangeConfirmDialog>

            <StatusChangeConfirmDialog
              open={showProsConsConfirm}
              onOpenChange={(open) => {
                setShowProsConsConfirm(open);
                if (!open) {
                  setPendingProsConsStatus(null);
                  setClosePriceScore(0);
                  setCloseConditionScore(0);
                  setCloseSecurityScore(0);
                  setCloseGuaranteeScore(0);
                  setCloseMovingScore(0);
                }
              }}
              title={pendingProsConsStatus === "firme_candidato" ? "Alta prioridad" : "Interesado"}
              description={`✨ Queremos darte una mano proactiva para que estés cada vez más cerca de disfrutar "${property.title}" como tu próximo hogar 🏡💙.`}
              confirmLabel="Confirmar"
              confirmDisabled={
                closePriceScore === 0 ||
                closeConditionScore === 0 ||
                closeSecurityScore === 0 ||
                closeGuaranteeScore === 0 ||
                closeMovingScore === 0
              }
              confirmClassName="bg-blue-600 text-white hover:bg-blue-700"
              onConfirm={async () => {
                if (!pendingProsConsStatus) return;
                await onStatusChange(property.id, pendingProsConsStatus);
                setShowProsConsConfirm(false);
                setPendingProsConsStatus(null);
                setClosePriceScore(0);
                setCloseConditionScore(0);
                setCloseSecurityScore(0);
                setCloseGuaranteeScore(0);
                setCloseMovingScore(0);
              }}
            >
              <div className="space-y-3 py-2">
                {renderPriorityStars(closePriceScore, setClosePriceScore, "💰 ¿Considerás que la relación calidad-precio es acorde? (5 acorde)")}
                {renderPriorityStars(closeConditionScore, setCloseConditionScore, "🏠 ¿Calificarías como bueno el estado general de la casa para avanzar? (5 bueno)")}
                {renderPriorityStars(closeSecurityScore, setCloseSecurityScore, "🛡️ ¿Son suficientes y satisfactorios los elementos de seguridad de esta propiedad para poder avanzar? (5 suficientes)")}
                {renderPriorityStars(closeGuaranteeScore, setCloseGuaranteeScore, "🧾 ¿Ya tenés solucionada la garantía/crédito para lograr tu objetivo? (5 solucionado)")}
                {renderPriorityStars(closeMovingScore, setCloseMovingScore, "🚚 ¿Ya tenés cubierta la mudanza o creés que puede ser un dolor de cabeza? (5 cubierta)")}
              </div>
            </StatusChangeConfirmDialog>

            <StatusChangeConfirmDialog
              open={showCoordinatedConfirm}
              onOpenChange={(open) => {
                setShowCoordinatedConfirm(open);
                if (!open) {
                  setCoordinatedDateTime("");
                  setCoordinatedResponseSpeed(0);
                  setCoordinatedAttentionQuality(0);
                  setCoordinatedAppHelpScore(0);
                  setIsEditingCoordinatedVisit(false);
                }
              }}
              title={isEditingCoordinatedVisit ? "✏️ Editar visita" : "🗓️ Coordinar visita"}
              description={
                isEditingCoordinatedVisit
                  ? `Actualizá solo la fecha y hora de visita para "${property.title}".`
                  : `Elegí la fecha y hora de visita para "${property.title}" y calificá la gestión del agente ✨.`
              }
              confirmLabel={isEditingCoordinatedVisit ? "Guardar nueva fecha" : "🚀 Confirmar visita"}
              confirmDisabled={
                !coordinatedDateTime.trim() ||
                new Date(coordinatedDateTime) <= new Date() ||
                (!isEditingCoordinatedVisit && (
                  coordinatedResponseSpeed === 0 ||
                  coordinatedAttentionQuality === 0 ||
                  coordinatedAppHelpScore === 0
                ))
              }
              confirmClassName="bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none"
              onConfirm={async () => {
                const isoDate = coordinatedDateTime ? new Date(coordinatedDateTime).toISOString() : null;
                await onStatusChange(
                  property.id,
                  "visita_coordinada",
                  undefined,
                  isoDate,
                  undefined,
                  undefined,
                  undefined,
                  undefined,
                  undefined,
                  isEditingCoordinatedVisit
                    ? undefined
                    : { agentResponseSpeed: coordinatedResponseSpeed, attentionQuality: coordinatedAttentionQuality, appHelpScore: coordinatedAppHelpScore }
                );
                setShowCoordinatedConfirm(false);
                setCoordinatedDateTime("");
                setCoordinatedResponseSpeed(0);
                setCoordinatedAttentionQuality(0);
                setCoordinatedAppHelpScore(0);
                setIsEditingCoordinatedVisit(false);
                if (isoDate) {
                  const randomIndex = Math.floor(Math.random() * calendarMotivationOptions.length);
                  setCalendarMotivationText(calendarMotivationOptions[randomIndex]);
                  setCalendarOfferDate(new Date(isoDate));
                  setShowCalendarOfferConfirm(true);
                }
              }}
            >
              <div className="space-y-4">
                <label className="text-sm font-medium text-foreground text-left block">📅 Fecha y hora de la visita</label>
                <Input
                  type="datetime-local"
                  value={coordinatedDateTime}
                  onChange={(e) => setCoordinatedDateTime(e.target.value)}
                  min={toDatetimeLocalString(new Date())}
                  className="rounded-xl border-status-coordinated/40 focus-visible:ring-status-coordinated"
                />
                {!isEditingCoordinatedVisit && (
                  <>
                    {renderFiveStars(coordinatedResponseSpeed, setCoordinatedResponseSpeed, "⚡ ¿Cómo sentiste los tiempos de respuesta del agente?")}
                    {renderFiveStars(coordinatedAttentionQuality, setCoordinatedAttentionQuality, "🤝 La atención te resultó clara y amable")}
                    {renderFiveStars(coordinatedAppHelpScore, setCoordinatedAppHelpScore, `🚀 ¿Cuánto te ayudó ${appBrandName} a avanzar más rápido y con menos estrés?`)}
                  </>
                )}
              </div>
            </StatusChangeConfirmDialog>

            <StatusChangeConfirmDialog
              open={showCalendarOfferConfirm}
              onOpenChange={(open) => {
                setShowCalendarOfferConfirm(open);
                if (!open) setCalendarOfferDate(null);
              }}
              title="🏡✨ Falta menos para ver tu próximo hogar"
              description={
                <>
                  ⏰💡 Tu yo del futuro te lo agradece: dejá la visita agendada y listo.
                  <br />
                  <br />
                  👨‍👩‍👧‍👦 Esta cita les llegará a todos los miembros del grupo familiar.
                </>
              }
              cancelLabel="Ahora no"
              confirmLabel="Agendar/editar visita"
              confirmClassName="bg-blue-600 text-white hover:bg-blue-700"
              onConfirm={() => {
                if (!calendarOfferDate) return;
                openVisitCalendarEntry(calendarOfferDate);
                setShowCalendarOfferConfirm(false);
                setCalendarOfferDate(null);
              }}
            />

            <StatusChangeConfirmDialog
              open={showContactedConfirm}
              onOpenChange={(open) => {
                setShowContactedConfirm(open);
                if (!open) {
                  setContactedName("");
                  setContactedInterest(0);
                  setContactedUrgency(0);
                }
              }}
              title="📞 Registrar contacto"
              description={`Contanos con quién hablaste por "${property.title}" ✨. Completá el nombre y marcá interés + urgencia para avanzar 🚀.`}
              confirmLabel="🔥 Confirmar contacto"
              confirmDisabled={!contactedName.trim() || contactedInterest === 0 || contactedUrgency === 0}
              confirmClassName="bg-blue-600 text-white hover:bg-blue-700"
              onConfirm={async () => {
                await onStatusChange(
                  property.id,
                  "contactado",
                  undefined,
                  undefined,
                  undefined,
                  contactedName,
                  undefined,
                  undefined,
                  { interest: contactedInterest, urgency: contactedUrgency }
                );
                setShowContactedConfirm(false);
                setContactedName("");
                setContactedInterest(0);
                setContactedUrgency(0);
              }}
            >
              <div className="space-y-4">
                <label className="text-sm font-medium text-foreground text-left block">👤 Nombre del contacto</label>
                <Input
                  placeholder="Ej: Juan Perez ✍️"
                  value={contactedName}
                  onChange={(e) => setContactedName(e.target.value)}
                  className="rounded-xl border-status-contacted/40 focus-visible:ring-status-contacted"
                />
                {renderFiveStars(
                  contactedInterest,
                  setContactedInterest,
                  "⭐ A primera vista, ¿qué impresión le generó la publicación?"
                )}
                {renderFiveStars(
                  contactedUrgency,
                  setContactedUrgency,
                  "⏰ ¿Qué tan urgente es su mudanza?"
                )}
              </div>
            </StatusChangeConfirmDialog>

            <Dialog
              open={showMetaAchievedConfirm}
              onOpenChange={setShowMetaAchievedConfirm}
            >
              <DialogContent className="max-w-md rounded-[2rem] p-0 overflow-hidden border-none shadow-[0_0_50px_rgba(20,184,166,0.35)]">
                <div className="bg-gradient-to-br from-[#072a2a] via-[#0f4c4c] to-[#0a2f3a] p-8 text-white relative overflow-hidden text-center">
                  <div className="absolute -top-10 -left-10 w-36 h-36 bg-teal-300/20 rounded-full blur-3xl animate-pulse" />
                  <div className="absolute -bottom-10 -right-10 w-36 h-36 bg-cyan-300/20 rounded-full blur-3xl animate-pulse" />

                  <div className="relative z-10 space-y-5">
                    <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 backdrop-blur-md px-4 py-1.5 rounded-full">
                      <Sparkles className="w-4 h-4 text-yellow-300" />
                      <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-teal-100">
                        Objetivo cumplido
                      </span>
                    </div>

                    <div className="mx-auto w-20 h-20 rounded-3xl bg-gradient-to-b from-teal-300 to-cyan-500 flex items-center justify-center shadow-2xl">
                      <Trophy className="w-10 h-10 text-teal-950" />
                    </div>

                    <h3 className="text-3xl font-black tracking-tight leading-tight">
                      🎯 Meta conseguida
                    </h3>

                    <p className="text-sm text-teal-50/90 leading-relaxed px-2">
                      Excelente avance con <strong>{property.title}</strong>.
                      <br />
                      Confirmá este estado para dejar registro de cierre en {appBrandName}.
                    </p>

                    <div className="grid grid-cols-3 gap-2 text-[10px] uppercase tracking-wider font-bold text-teal-100/90">
                      <div className="rounded-xl bg-white/10 border border-white/15 px-2 py-2">Cierre</div>
                      <div className="rounded-xl bg-white/10 border border-white/15 px-2 py-2">Logro</div>
                      <div className="rounded-xl bg-white/10 border border-white/15 px-2 py-2">Objetivo</div>
                    </div>

                    <div className="pt-2 flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 rounded-xl border-white/30 bg-white/5 text-white hover:bg-white/10"
                        onClick={() => setShowMetaAchievedConfirm(false)}
                      >
                        Volver
                      </Button>
                      <Button
                        className="flex-1 rounded-xl bg-gradient-to-r from-teal-300 via-cyan-300 to-sky-300 text-slate-900 hover:opacity-95 font-bold gap-2"
                        onClick={() => {
                          setShowMetaAchievedConfirm(false);
                          setShowMetaSurveyConfirm(true);
                        }}
                      >
                        <Rocket className="w-4 h-4" />
                        Siguiente
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <StatusChangeConfirmDialog
              open={showMetaSurveyConfirm}
              onOpenChange={(open) => {
                setShowMetaSurveyConfirm(open);
                if (!open) {
                  setMetaAgentPunctuality(0);
                  setMetaAgentAttention(0);
                  setMetaAppPerformance(0);
                  setMetaAppSupport(0);
                  setMetaAppPrice(0);
                }
              }}
              title="✨ Último paso: ayudanos con tu feedback"
              description={`Tu experiencia nos ayuda a mejorar el acompañamiento del agente y de ${appBrandName}.`}
              confirmLabel="🎯 Confirmar meta conseguida"
              confirmDisabled={
                metaAgentPunctuality === 0 ||
                metaAgentAttention === 0 ||
                metaAppPerformance === 0 ||
                metaAppSupport === 0 ||
                metaAppPrice === 0
              }
              confirmClassName="bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none"
              onConfirm={async () => {
                await onStatusChange(
                  property.id,
                  "meta_conseguida",
                  undefined,
                  undefined,
                  undefined,
                  undefined,
                  undefined,
                  undefined,
                  undefined,
                  undefined,
                  undefined,
                  {
                    agentPunctuality: metaAgentPunctuality,
                    agentAttention: metaAgentAttention,
                    appPerformance: metaAppPerformance,
                    appSupport: metaAppSupport,
                    appPrice: metaAppPrice,
                  }
                );
                setShowMetaSurveyConfirm(false);
                setMetaAgentPunctuality(0);
                setMetaAgentAttention(0);
                setMetaAppPerformance(0);
                setMetaAppSupport(0);
                setMetaAppPrice(0);
              }}
            >
              <div className="space-y-3 py-2">
                {renderFiveStars(metaAgentPunctuality, setMetaAgentPunctuality, "⏱️ Puntualidad del agente")}
                {renderFiveStars(metaAgentAttention, setMetaAgentAttention, "🤝 Atención del agente")}
                {renderFiveStars(metaAppPerformance, setMetaAppPerformance, "⚙️ Funcionamiento de la app")}
                {renderFiveStars(metaAppSupport, setMetaAppSupport, "🛟 Soporte de la app")}
                {renderFiveStars(metaAppPrice, setMetaAppPrice, "💸 Precio de la app respecto al valor")}
              </div>
            </StatusChangeConfirmDialog>
          </>
        }
        bottomContent={
          property.status === "visita_coordinada" && property.coordinatedDate ? (
            <div className="w-full mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openVisitCalendarEntry(property.coordinatedDate!);
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-medium bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 transition-colors touch-manipulation"
              >
                <CalendarPlus className="w-4 h-4 shrink-0" />
                <span className="truncate">Agendar/editar visita</span>
              </button>
            </div>
          ) : undefined
        }
      />
      <FullScreenGallery
        images={[...(property.images || []), ...(property.privateImages || [])]}
        isOpen={isGalleryOpen}
        initialIndex={galleryInitialImg}
        onClose={() => setIsGalleryOpen(false)}
      />
    </>
  );
}
