import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useSystemConfig } from "@/hooks/useSystemConfig";
import { APP_BRAND_NAME_DEFAULT, APP_BRAND_NAME_KEY } from "@/lib/config-keys";
import { Property, PropertyStatus, STATUS_CONFIG } from "@/types/property";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusChangeConfirmDialog } from "@/components/ui/StatusChangeConfirmDialog";
import { XCircle, ExternalLink, CalendarIcon, CalendarPlus, Users, Star } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { PROPERTY_STATUS_LABELS } from "@/lib/constants";
import { PropertyCardBase } from "@/components/ui/PropertyCardBase";
import { FullScreenGallery } from "@/components/ui/FullScreenGallery";
import { usePropertyRating } from "@/hooks/usePropertyRating";
import { usePropertyStatusActions } from "@/hooks/usePropertyStatusActions";
import { formatDateTime, toDatetimeLocalString } from "@/lib/date-utils";

// Componentes modulares de diálogos de estado
import { StatusDiscardDialog, DiscardedSurvey } from "./property-card/dialogs/StatusDiscardDialog";
import { StatusCoordinatedDialog, CoordinatedSurvey } from "./property-card/dialogs/StatusCoordinatedDialog";
import { StatusContactedDialog, ContactedFeedback } from "./property-card/dialogs/StatusContactedDialog";
import { StatusProsConsDialog, ProsConsFeedback } from "./property-card/dialogs/StatusProsConsDialog";
import { StatusMetaDialogs, MetaSurveyFeedback } from "./property-card/dialogs/StatusMetaDialogs";
import { StatusCalendarOfferDialog } from "./property-card/dialogs/StatusCalendarOfferDialog";

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
    },
    closingFeedback?: {
      closePriceScore: number;
      closeConditionScore: number;
      closeSecurityScore: number;
      closeGuaranteeScore: number;
      closeMovingScore: number;
    }
  ) => void;
  onClick: () => void;
  ownerEmail?: string | null;
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
  const [showProsConsConfirm, setShowProsConsConfirm] = useState(false);
  const [pendingProsConsStatus, setPendingProsConsStatus] = useState<"firme_candidato" | "posible_interes" | null>(null);
  const [showCoordinatedConfirm, setShowCoordinatedConfirm] = useState(false);
  const [coordinatedDateTime, setCoordinatedDateTime] = useState("");
  const [isEditingCoordinatedVisit, setIsEditingCoordinatedVisit] = useState(false);
  const [showCalendarOfferConfirm, setShowCalendarOfferConfirm] = useState(false);
  const [calendarOfferDate, setCalendarOfferDate] = useState<Date | null>(null);
  const [calendarMotivationText, setCalendarMotivationText] = useState(
    "🏡✨ Falta menos para ver tu próximo hogar. ¡No te olvides de agendar la cita!"
  );
  const [showContactedConfirm, setShowContactedConfirm] = useState(false);
  const [showMetaAchievedConfirm, setShowMetaAchievedConfirm] = useState(false);
  const [showMetaSurveyConfirm, setShowMetaSurveyConfirm] = useState(false);
  const { toast } = useToast();
  const { value: appBrandName } = useSystemConfig(APP_BRAND_NAME_KEY, APP_BRAND_NAME_DEFAULT);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryInitialImg, setGalleryInitialImg] = useState(0);

  // Hook de acciones y lógica de negocio especializada (Google Calendar, etc)
  const { openVisitCalendarEntry } = usePropertyStatusActions(property, ownerEmail);

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
      setShowProsConsConfirm(true);
    } else {
      onStatusChange(property.id, val as PropertyStatus);
    }
  };

  const handleEditCoordinatedVisit = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setIsEditingCoordinatedVisit(true);
    setCoordinatedDateTime(property.coordinatedDate ? toDatetimeLocalString(property.coordinatedDate) : "");
    setShowCoordinatedConfirm(true);
  };



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

            <StatusDiscardDialog
              open={showDiscardConfirm}
              onOpenChange={setShowDiscardConfirm}
              propertyTitle={property.title}
              onConfirm={(reason, survey) => {
                onStatusChange(property.id, "descartado", reason, undefined, undefined, undefined, undefined, undefined, undefined, undefined, survey);
                setShowDiscardConfirm(false);
              }}
            />

            <StatusProsConsDialog
              open={showProsConsConfirm}
              onOpenChange={setShowProsConsConfirm}
              propertyTitle={property.title}
              status={pendingProsConsStatus}
              onConfirm={(status, feedback) => {
                onStatusChange(property.id, status, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, feedback);
                setShowProsConsConfirm(false);
              }}
            />

            <StatusCoordinatedDialog
              open={showCoordinatedConfirm}
              onOpenChange={setShowCoordinatedConfirm}
              propertyTitle={property.title}
              isEditing={isEditingCoordinatedVisit}
              initialDate={coordinatedDateTime}
              appBrandName={appBrandName}
              onConfirm={(isoDate, survey) => {
                onStatusChange(property.id, "visita_coordinada", undefined, isoDate || null, undefined, undefined, undefined, undefined, undefined, survey);
                setShowCoordinatedConfirm(false);
                if (isoDate) {
                  const randomIndex = Math.floor(Math.random() * calendarMotivationOptions.length);
                  setCalendarMotivationText(calendarMotivationOptions[randomIndex]);
                  setCalendarOfferDate(new Date(isoDate));
                  setShowCalendarOfferConfirm(true);
                }
              }}
            />

            <StatusCalendarOfferDialog
              open={showCalendarOfferConfirm}
              onOpenChange={setShowCalendarOfferConfirm}
              calendarOfferDate={calendarOfferDate}
              calendarMotivationText={calendarMotivationText}
              onConfirm={() => {
                if (calendarOfferDate) openVisitCalendarEntry(calendarOfferDate);
                setShowCalendarOfferConfirm(false);
              }}
            />

            <StatusContactedDialog
              open={showContactedConfirm}
              onOpenChange={setShowContactedConfirm}
              propertyTitle={property.title}
              onConfirm={(name, feedback) => {
                onStatusChange(property.id, "contactado", undefined, undefined, undefined, name, undefined, undefined, feedback);
                setShowContactedConfirm(false);
              }}
            />

            <StatusMetaDialogs
              showTrophy={showMetaAchievedConfirm}
              setShowTrophy={setShowMetaAchievedConfirm}
              showSurvey={showMetaSurveyConfirm}
              setShowSurvey={setShowMetaSurveyConfirm}
              propertyTitle={property.title}
              appBrandName={appBrandName}
              onConfirm={(feedback) => {
                onStatusChange(property.id, "meta_conseguida", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, feedback);
                setShowMetaSurveyConfirm(false);
              }}
            />
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
