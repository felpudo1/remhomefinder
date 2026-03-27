import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useSystemConfig } from "@/hooks/useSystemConfig";
import { APP_BRAND_NAME_DEFAULT, APP_BRAND_NAME_KEY } from "@/lib/config-keys";
import { Property, PropertyStatus, AgentPubStatus } from "@/types/property";
import { PROPERTY_STATUS_LABELS } from "@/lib/constants";
import { ExternalLink, Building2, MessageCircle, Trash2, User, CalendarIcon } from "lucide-react";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { StarRating } from "@/components/ui/StarRating";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { StatusChangeConfirmDialog } from "@/components/ui/StatusChangeConfirmDialog";
import { PropertyCardBase } from "@/components/ui/PropertyCardBase";
import { FullScreenGallery } from "@/components/ui/FullScreenGallery";
import { usePropertyRating } from "@/hooks/usePropertyRating";
import { usePropertyStatusActions } from "@/hooks/usePropertyStatusActions";

// Componentes modulares y hooks extraídos
import { usePropertyCardDialogs } from "@/hooks/usePropertyCardDialogs";
import { PropertyStatusSelector } from "./property-card/PropertyStatusSelector";
import { PropertyCardHeader } from "./property-card/PropertyCardHeader";

// Diálogos modulares
import { StatusDiscardDialog } from "./property-card/dialogs/StatusDiscardDialog";
import { StatusCoordinatedDialog } from "./property-card/dialogs/StatusCoordinatedDialog";
import { StatusContactedDialog } from "./property-card/dialogs/StatusContactedDialog";
import { StatusProsConsDialog, ProsConsFeedback } from "./property-card/dialogs/StatusProsConsDialog";
import { StatusMetaDialogs } from "./property-card/dialogs/StatusMetaDialogs";
import { StatusCalendarOfferDialog } from "./property-card/dialogs/StatusCalendarOfferDialog";

export interface ProsAndConsAttributeIds {
  positiveIds: string[];
  negativeIds: string[];
}

interface PropertyCardProps {
  property: Property;
  /** Si true, las fotos se muestran expandidas (como HFMarket con “Mostrar fotos”). Si false, modo colapsable. */
  forceExpandImages?: boolean;
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
  disponible: null,
  pausado: { label: "Pausada", className: "bg-amber-500/90 text-white" },
  reservado: { label: "Reservada", className: "bg-blue-600/90 text-white" },
  vendido: { label: "Vendida", className: "bg-slate-900/90 text-white" },
  alquilado: { label: "Alquilada", className: "bg-purple-600/90 text-white" },
  eliminado: null,
};

/**
 * Componente principal que representa una propiedad en formato de tarjeta.
 * Ahora refactorizado (Regla 2) para delegar estados y sub-vistas a hooks y componentes especializados.
 */
export function PropertyCard({
  property,
  forceExpandImages = true,
  onStatusChange,
  onClick,
  ownerEmail,
}: PropertyCardProps) {
  // Hook centralizado para estados de diálogos y galería
  const dialogs = usePropertyCardDialogs(property);
  
  const { toast } = useToast();
  const { value: appBrandName } = useSystemConfig(APP_BRAND_NAME_KEY, APP_BRAND_NAME_DEFAULT);

  // Hook de acciones y lógica de negocio especializada (Google Calendar, etc)
  const { openVisitCalendarEntry } = usePropertyStatusActions(property, ownerEmail);

  // Hook de calificación por estrellas (solo si hay grupo)
  const { userVote, averageRating, totalVotes, totalGroupMembers, rate } = usePropertyRating(
    property.propertyId || property.id, 
    property.groupId || null
  );

  const mktOverlay = property.marketplaceStatus ? MARKETPLACE_STATUS_OVERLAY[property.marketplaceStatus] : null;
  const marketplaceAgentPhoneDigits = (property.marketplaceAgentPhone || "").replace(/\D/g, "");
  const marketplaceAgentWhatsappUrl = marketplaceAgentPhoneDigits ? `https://wa.me/${marketplaceAgentPhoneDigits}` : null;

  /**
   * Manejador de cambio de estado: detecta qué acción requiere un diálogo de confirmación adicional.
   */
  const handleStatusChangeRequest = (val: string) => {
    if (val === "eliminado") {
      dialogs.setShowDeleteConfirm(true);
    } else if (val === "descartado") {
      dialogs.setShowDiscardConfirm(true);
    } else if (val === "visita_coordinada") {
      dialogs.setIsEditingCoordinatedVisit(false);
      dialogs.setShowCoordinatedConfirm(true);
    } else if (val === "contactado") {
      dialogs.setShowContactedConfirm(true);
    } else if (val === "meta_conseguida") {
      dialogs.setShowMetaAchievedConfirm(true);
    } else if (val === "firme_candidato" || val === "posible_interes") {
      dialogs.setPendingProsConsStatus(val);
      dialogs.setShowProsConsConfirm(true);
    } else {
      onStatusChange(property.id, val as PropertyStatus);
    }
  };

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
          dialogs.setGalleryInitialImg(index);
          dialogs.setIsGalleryOpen(true);
        }}
        collapsibleImages={!forceExpandImages}
        className={isEliminated || isDiscarded || isAgentDeleted ? "opacity-60" : ""}
        statusOverlay={undefined}
        topOverlay={
          <PropertyCardHeader
            property={property}
            ownerEmail={ownerEmail}
          />
        }
        ratingOverlay={
          property.groupId && (
            <div className={cn("flex flex-col gap-2", mktOverlay && "mt-10")}>
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
            <div className="flex items-center justify-between gap-2">
              {property.sourceMarketplaceId ? (
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 text-[11px] text-primary font-medium">
                      <Building2 className="w-3 h-3" />
                      {property.marketplaceOrgName || "Agencia"}
                    </span>
                    {property.marketplaceStatus && (
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide ${
                        property.marketplaceStatus === "disponible" ? "bg-emerald-100 text-emerald-700" :
                        property.marketplaceStatus === "pausado" ? "bg-amber-100 text-amber-700" :
                        property.marketplaceStatus === "reservado" ? "bg-blue-100 text-blue-700" :
                        property.marketplaceStatus === "vendido" ? "bg-slate-200 text-slate-700" :
                        property.marketplaceStatus === "alquilado" ? "bg-purple-100 text-purple-700" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {PROPERTY_STATUS_LABELS[property.marketplaceStatus] || property.marketplaceStatus}
                      </span>
                    )}
                  </div>
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
              ) : property.contactName || property.contactPhone ? (
                <div className="flex flex-col gap-0.5 min-w-0">
                  {/* Publicaciones propias: user_listings.contact_name / contact_phone (columnas en BD, no JSON) */}
                  {property.contactName && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-primary font-medium min-w-0">
                      <User className="w-3 h-3 shrink-0" />
                      <span className="truncate">{property.contactName}</span>
                    </span>
                  )}
                  {property.contactPhone && (
                    <span className="text-[11px] text-muted-foreground truncate">{property.contactPhone}</span>
                  )}
                  {property.contactPhone && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(
                          buildWhatsAppUrl(property.contactPhone!, `Hola, vi tu publicación "${property.title}" y me interesa.`),
                          "_blank",
                          "noopener,noreferrer"
                        );
                      }}
                      className="inline-flex w-fit items-center gap-1 text-[11px] font-medium text-emerald-700 hover:text-emerald-800 hover:underline"
                    >
                      <MessageCircle className="w-3 h-3" />
                      Enviar WhatsApp
                    </button>
                  )}
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
        bottomContent={
          property.status === "visita_coordinada" && property.coordinatedDate ? (
            <div className="flex justify-end pt-0" onClick={(e) => e.stopPropagation()}>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-7 px-2 text-[10px] font-medium rounded-lg shadow-md bg-black/60 text-white border-0 hover:bg-black/75 backdrop-blur-md"
                onClick={(e) => {
                  e.stopPropagation();
                  openVisitCalendarEntry(property.coordinatedDate!);
                }}
                title="Agendar en Google Calendar"
              >
                <CalendarIcon className="w-3 h-3 mr-1 shrink-0" />
                Agendar visita
              </Button>
            </div>
          ) : undefined
        }
        extraBodyContent={
          <>
            <div className="flex justify-end">
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

            {isEliminated && (
               <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-2.5 space-y-1 mt-2">
                <p className="text-xs font-medium text-destructive">Eliminado por {property.deletedByEmail || "desconocido"}</p>
                {property.deletedReason && <p className="text-xs text-muted-foreground">Motivo: {property.deletedReason}</p>}
              </div>
            )}

            {isDiscarded && (
              <div className="bg-status-discarded-bg border border-status-discarded/20 rounded-xl p-2.5 space-y-1 mt-2">
                <p className="text-xs font-medium text-status-discarded">Descartado por {property.discardedByEmail || "desconocido"}</p>
                {property.discardedReason && <p className="text-xs text-muted-foreground">Motivo: {property.discardedReason}</p>}
              </div>
            )}

            {isAgentDeleted && (
              <div className="bg-slate-100 border border-slate-200 rounded-xl p-2.5 space-y-1 mt-2">
                <p className="text-xs font-semibold text-slate-700">AVISO FINALIZADO POR AGENCIA</p>
                <p className="text-[10px] text-muted-foreground">Podés conservarla aquí para tu historial familiar y ver tus notas.</p>
              </div>
            )}
          </>
        }
        actions={
          <>
            <PropertyStatusSelector 
              currentStatus={property.status} 
              onStatusChange={handleStatusChangeRequest} 
              disabled={isAgentDeleted} 
            />

            <StatusChangeConfirmDialog
              open={dialogs.showDeleteConfirm}
              onOpenChange={(open) => {
                dialogs.setShowDeleteConfirm(open);
                if (!open) dialogs.setDeleteReason("");
              }}
              title="¿Eliminar esta propiedad?"
              description={`La propiedad "${property.title}" será marcada como eliminada.`}
              confirmLabel="Eliminar"
              onConfirm={() => onStatusChange(property.id, "eliminado", dialogs.deleteReason)}
            >
              <Textarea
                placeholder="Motivo de la eliminación..."
                value={dialogs.deleteReason}
                onChange={(e) => dialogs.setDeleteReason(e.target.value)}
                className="resize-none text-sm min-h-[80px] rounded-xl"
              />
            </StatusChangeConfirmDialog>

            <StatusDiscardDialog
              open={dialogs.showDiscardConfirm}
              onOpenChange={dialogs.setShowDiscardConfirm}
              propertyTitle={property.title}
              onConfirm={(reason, survey) => {
                onStatusChange(property.id, "descartado", reason, undefined, undefined, undefined, undefined, undefined, undefined, undefined, survey);
                dialogs.setShowDiscardConfirm(false);
              }}
            />

            <StatusProsConsDialog
              open={dialogs.showProsConsConfirm}
              onOpenChange={dialogs.setShowProsConsConfirm}
              propertyTitle={property.title}
              status={dialogs.pendingProsConsStatus}
              onConfirm={(status, feedback) => {
                onStatusChange(property.id, status, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, feedback);
                dialogs.setShowProsConsConfirm(false);
              }}
            />

            <StatusCoordinatedDialog
              open={dialogs.showCoordinatedConfirm}
              onOpenChange={dialogs.setShowCoordinatedConfirm}
              propertyTitle={property.title}
              isEditing={dialogs.isEditingCoordinatedVisit}
              initialDate={dialogs.coordinatedDateTime}
              appBrandName={appBrandName}
              onConfirm={(isoDate, survey) => {
                onStatusChange(property.id, "visita_coordinada", undefined, isoDate || null, undefined, undefined, undefined, undefined, undefined, survey);
                dialogs.setShowCoordinatedConfirm(false);
                if (isoDate) dialogs.handleCalendarOffer(isoDate);
              }}
            />

            <StatusCalendarOfferDialog
              open={dialogs.showCalendarOfferConfirm}
              onOpenChange={dialogs.setShowCalendarOfferConfirm}
              calendarOfferDate={dialogs.calendarOfferDate}
              calendarMotivationText={dialogs.calendarMotivationText}
              onConfirm={() => {
                if (dialogs.calendarOfferDate) openVisitCalendarEntry(dialogs.calendarOfferDate);
                dialogs.setShowCalendarOfferConfirm(false);
              }}
            />

            <StatusContactedDialog
              open={dialogs.showContactedConfirm}
              onOpenChange={dialogs.setShowContactedConfirm}
              propertyTitle={property.title}
              onConfirm={(name, feedback) => {
                onStatusChange(property.id, "contactado", undefined, undefined, undefined, name, undefined, undefined, feedback);
                dialogs.setShowContactedConfirm(false);
              }}
            />

            <StatusMetaDialogs
              showTrophy={dialogs.showMetaAchievedConfirm}
              setShowTrophy={dialogs.setShowMetaAchievedConfirm}
              showSurvey={dialogs.showMetaSurveyConfirm}
              setShowSurvey={dialogs.setShowMetaSurveyConfirm}
              propertyTitle={property.title}
              appBrandName={appBrandName}
              onConfirm={(feedback) => {
                onStatusChange(property.id, "meta_conseguida", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, feedback);
                dialogs.setShowMetaSurveyConfirm(false);
              }}
            />
          </>
        }
      />
      
      <FullScreenGallery
        images={[...(property.images || []), ...(property.privateImages || [])]}
        isOpen={dialogs.isGalleryOpen}
        initialIndex={dialogs.galleryInitialImg}
        onClose={() => dialogs.setIsGalleryOpen(false)}
      />
    </>
  );
}
