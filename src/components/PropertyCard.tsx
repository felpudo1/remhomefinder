import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Property, PropertyStatus } from "@/types/property";
import { PROPERTY_STATUS_LABELS } from "@/lib/constants";
import { ExternalLink, Building2, MessageCircle, User, CalendarIcon } from "lucide-react";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { PropertyRatingBadge } from "@/components/ui/StarRating";
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
import { GenericStatusFeedbackDialog } from "./property-card/dialogs/GenericStatusFeedbackDialog";
import { StatusCalendarOfferDialog } from "./property-card/dialogs/StatusCalendarOfferDialog";

export interface ProsAndConsAttributeIds {
  positiveIds: string[];
  negativeIds: string[];
}

interface PropertyCardProps {
  property: Property;
  /** Si true, las fotos se muestran expandidas (como HFMarket con "Mostrar fotos"). Si false, modo colapsable. */
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
    metaAchievedFeedback?: any,
    closingFeedback?: any,
    metadata?: Record<string, any>
  ) => void;
  onClick: () => void;
  ownerEmail?: string | null;
  /** Si true, agrega un ID especial para el tour guiado */
  isFirstCard?: boolean;
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
  isFirstCard = false,
}: PropertyCardProps) {
  // Hook centralizado para estados de diálogos y galería
  const dialogs = usePropertyCardDialogs(property);
  
  const { toast } = useToast();

  // Hook de acciones y lógica de negocio especializada (Google Calendar, etc)
  const { openVisitCalendarEntry } = usePropertyStatusActions(property, ownerEmail);

  // Hook de calificación por estrellas (solo si hay grupo)
  const { userVote, averageRating, totalVotes, totalGroupMembers, rate, marketplaceAverageRating, marketplaceTotalVotes } = usePropertyRating(
    property.propertyId || property.id,
    property.groupId || null,
    property.sourceMarketplaceId || null
  );

  const mktOverlay = property.marketplaceStatus ? MARKETPLACE_STATUS_OVERLAY[property.marketplaceStatus] : null;
  const marketplaceAgentPhoneDigits = (property.marketplaceAgentPhone || "").replace(/\D/g, "");
  const marketplaceAgentWhatsappUrl = marketplaceAgentPhoneDigits ? `https://wa.me/${marketplaceAgentPhoneDigits}` : null;

  /**
   * Manejador de cambio de estado: detecta qué acción requiere un diálogo de confirmación adicional.
   */
  const handleStatusChangeRequest = (val: string) => {
    const statusVal = val as PropertyStatus;
    if (statusVal === "eliminado") {
      dialogs.setShowDeleteConfirm(true);
    } else if (["contactado", "visita_coordinada", "descartado", "firme_candidato", "posible_interes", "meta_conseguida"].includes(statusVal)) {
      dialogs.setPendingStatus(statusVal);
      dialogs.setShowGenericFeedback(true);
    } else {
      onStatusChange(property.id, statusVal);
    }
  };

  const isEliminated = property.status === "eliminado";
  const isDiscarded = property.status === "descartado";
  const isAgentDeleted = property.status === "eliminado_agencia";
  
  /**
   * La propiedad aparece en gris (opacity-60) cuando:
   * - El usuario la eliminó/descartó de su listado
   * - El agente cambió el estado de la publicación a pausado/reservado/vendido/alquilado/eliminado
   */
  const isMarketplaceUnavailable = property.marketplaceStatus 
    && property.marketplaceStatus !== "disponible";
  const isGrayedOut = isEliminated || isDiscarded || isAgentDeleted || !!isMarketplaceUnavailable;

  return (
    <>
      <PropertyCardBase
        id={isFirstCard ? "property-card-first" : undefined}
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
        className={isGrayedOut ? "opacity-60" : ""}
        statusOverlay={undefined}
        topOverlay={
          <PropertyCardHeader
            property={property}
            ownerEmail={ownerEmail}
          />
        }
        ratingOverlay={
          (property.groupId || property.sourceMarketplaceId) && (
            <div className={cn("flex flex-col gap-2", mktOverlay && "mt-10")}>
              <PropertyRatingBadge
                marketplaceAverageRating={marketplaceAverageRating}
                marketplaceTotalVotes={marketplaceTotalVotes}
                userVote={userVote}
                familyAverageRating={averageRating}
                familyTotalVotes={totalVotes}
                totalGroupMembers={totalGroupMembers}
                onRate={rate}
                readonly={isDiscarded}
                hasFamilyGroup={totalGroupMembers > 1}
              />
            </div>
          )
        }
        subImageContent={
          <div className="px-4 pt-2 pb-1 flex items-center justify-between gap-2">
            <span className="text-[11px] text-muted-foreground truncate">
              {property.sourceMarketplaceId ? (
                <span className="inline-flex items-center gap-1 text-primary font-medium">
                  <Building2 className="w-3 h-3" />
                  {property.marketplaceOrgName || "Agencia"}
                </span>
              ) : ownerEmail ? (
                <>Ingresado por <span className="text-foreground/80">{ownerEmail}</span></>
              ) : ""}
            </span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide shrink-0 ${property.listingType === "sale"
              ? "bg-accent/15 text-accent-foreground"
              : "bg-primary/10 text-primary"
              }`}>
              {property.listingType === "sale" ? "Venta" : "Alquiler"}
            </span>
          </div>
        }
        bottomContent={
          property.status === "visita_coordinada" ? (
            <div className="flex justify-end pt-0" onClick={(e) => e.stopPropagation()}>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-7 px-2 text-[10px] font-medium rounded-lg shadow-md bg-black/60 text-white border-0 hover:bg-black/75 backdrop-blur-md"
                onClick={(e) => {
                  e.stopPropagation();
                  const visitAt = property.coordinatedDate ?? new Date();
                  if (!property.coordinatedDate) {
                    toast({
                      title: "Sin fecha guardada en el historial",
                      description:
                        "Se abrió Google Calendar con la hora actual. Ajustá fecha y hora en el evento.",
                    });
                  }
                  openVisitCalendarEntry(visitAt);
                }}
                title="Agendar en Google Calendar"
              >
                <CalendarIcon className="w-3 h-3 mr-1 shrink-0" />
                Agendar visita
              </Button>
            </div>
          ) : undefined
        }
        statsRightContent={
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-1.5 gap-1 hover:bg-muted text-[10px] font-normal"
            onClick={(e) => { e.stopPropagation(); window.open(property.url, "_blank"); }}
            title="Ver publicación original"
          >
            <span className="text-muted-foreground uppercase tracking-wider">link</span>
            <ExternalLink className="h-3 w-3" />
          </Button>
        }
        extraBodyContent={
          <>
            {/* Contacto inline minimalista (debajo del título) */}
            {(property.sourceMarketplaceId
              ? (property.marketplaceAgentName || marketplaceAgentWhatsappUrl)
              : (property.contactName || property.contactPhone)) && (
              <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-[11px] text-muted-foreground -mt-1">
                {property.sourceMarketplaceId ? (
                  <>
                    {property.marketplaceAgentName && (
                      <span className="inline-flex items-center gap-1 text-primary font-medium min-w-0">
                        <User className="w-3 h-3 shrink-0" />
                        <span className="truncate">{property.marketplaceAgentName}</span>
                      </span>
                    )}
                    {property.marketplaceAgentPhone && (
                      <>
                        <span className="text-muted-foreground/60">·</span>
                        <span>{property.marketplaceAgentPhone}</span>
                      </>
                    )}
                    {marketplaceAgentWhatsappUrl && (
                      <>
                        <span className="text-muted-foreground/60">·</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(marketplaceAgentWhatsappUrl, "_blank", "noopener,noreferrer");
                          }}
                          className="inline-flex items-center gap-1 font-medium text-emerald-700 hover:text-emerald-800 hover:underline"
                        >
                          <MessageCircle className="w-3 h-3" />
                          WhatsApp
                        </button>
                      </>
                    )}
                    {property.marketplaceStatus && (
                      <span className={`ml-auto inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide ${
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
                  </>
                ) : (
                  <>
                    {property.contactName && (
                      <span className="inline-flex items-center gap-1 text-primary font-medium min-w-0">
                        <User className="w-3 h-3 shrink-0" />
                        <span className="truncate">{property.contactName}</span>
                      </span>
                    )}
                    {property.contactPhone && (
                      <>
                        <span className="text-muted-foreground/60">·</span>
                        <span>{property.contactPhone}</span>
                        <span className="text-muted-foreground/60">·</span>
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
                          className="inline-flex items-center gap-1 font-medium text-emerald-700 hover:text-emerald-800 hover:underline"
                        >
                          <MessageCircle className="w-3 h-3" />
                          WhatsApp
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            )}


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
              marketplaceStatus={property.marketplaceStatus}
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

            <GenericStatusFeedbackDialog
              open={dialogs.showGenericFeedback}
              onOpenChange={dialogs.setShowGenericFeedback}
              propertyTitle={property.title}
              status={dialogs.pendingStatus || "ingresado"}
              onConfirm={(metadata) => {
                onStatusChange(property.id, dialogs.pendingStatus!, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, metadata);
                dialogs.setShowGenericFeedback(false);
                
                // Si coordinamos visita y hay fecha en la metadata, ofrecemos calendario
                if (dialogs.pendingStatus === "visita_coordinada" && metadata.coordinated_date) {
                  dialogs.handleCalendarOffer(metadata.coordinated_date);
                }
              }}
            />

            <StatusCalendarOfferDialog
              open={dialogs.showCalendarOfferConfirm}
              onOpenChange={dialogs.setShowCalendarOfferConfirm}
              calendarOfferDate={dialogs.calendarOfferDate}
              onConfirm={() => {
                if (dialogs.calendarOfferDate) openVisitCalendarEntry(dialogs.calendarOfferDate);
                dialogs.setShowCalendarOfferConfirm(false);
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
