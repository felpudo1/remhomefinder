import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Property, PropertyStatus, STATUS_CONFIG, MarketplacePropertyStatus } from "@/types/property";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2, XCircle, ExternalLink, CalendarIcon, CalendarPlus, Building2, Users } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { PROPERTY_STATUS_LABELS } from "@/lib/constants";
import { PropertyCardBase } from "@/components/ui/PropertyCardBase";
import { FullScreenGallery } from "@/components/ui/FullScreenGallery";
import { usePropertyRating } from "@/hooks/usePropertyRating";
import { StarRating } from "@/components/ui/StarRating";
import { useFeedbackAttributes } from "@/hooks/useFeedbackAttributes";
import { Checkbox } from "@/components/ui/checkbox";

/** Pros = score 5, contras = score 1 en attribute_scores */
export interface ProsAndConsAttributeIds {
  positiveIds: string[];
  negativeIds: string[];
}

interface PropertyCardProps {
  property: Property;
  onStatusChange: (id: string, status: PropertyStatus, deletedReason?: string, coordinatedDate?: string | null, groupId?: string | null, contactedName?: string, discardedAttributeIds?: string[], prosAndCons?: ProsAndConsAttributeIds) => void;
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
function buildGoogleCalendarUrl(title: string, startDate: Date, details?: string, location?: string): string {
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
  const [selectedAttributeIds, setSelectedAttributeIds] = useState<string[]>([]);
  const [showProsConsConfirm, setShowProsConsConfirm] = useState(false);
  const [pendingProsConsStatus, setPendingProsConsStatus] = useState<"firme_candidato" | "posible_interes" | null>(null);
  const [selectedPositiveIds, setSelectedPositiveIds] = useState<string[]>([]);
  const [selectedNegativeIds, setSelectedNegativeIds] = useState<string[]>([]);
  const { data: feedbackAttributes = [] } = useFeedbackAttributes();
  const [showCoordinatedConfirm, setShowCoordinatedConfirm] = useState(false);
  const [coordinatedDateTime, setCoordinatedDateTime] = useState("");
  const [showContactedConfirm, setShowContactedConfirm] = useState(false);
  const [contactedName, setContactedName] = useState("");
  const { toast } = useToast();
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryInitialImg, setGalleryInitialImg] = useState(0);

  // Hook de calificación por estrellas (solo si hay grupo) — usa el propertyId real, no el user_listing ID
  const { userVote, averageRating, totalVotes, totalGroupMembers, rate } = usePropertyRating(property.propertyId || property.id, property.groupId || null);

  const config = STATUS_CONFIG[property.status];
  const mktOverlay = property.marketplaceStatus ? MARKETPLACE_STATUS_OVERLAY[property.marketplaceStatus] : null;

  const handleStatusChange = (val: string) => {
    if (val === "eliminado") {
      setShowDeleteConfirm(true);
    } else if (val === "descartado") {
      setShowDiscardConfirm(true);
    } else if (val === "visita_coordinada") {
      setShowCoordinatedConfirm(true);
    } else if (val === "contactado") {
      setShowContactedConfirm(true);
    } else if (val === "firme_candidato" || val === "posible_interes") {
      setPendingProsConsStatus(val);
      setSelectedPositiveIds([]);
      setSelectedNegativeIds([]);
      setShowProsConsConfirm(true);
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
        images={property.images}
        listingType={property.listingType}
        onClick={onClick}
        onImageClick={(index) => {
          setGalleryInitialImg(index);
          setIsGalleryOpen(true);
        }}
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
            {property.groupId && (
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
            {/* Fila 1: Ingresado por / De agencia (izq) + Badge Alquiler/Venta (der). Si visita_coordinada: botón calendario + badge en el mismo renglón */}
            <div className="flex items-center justify-between gap-2">
              {property.status === "visita_coordinada" && property.coordinatedDate ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const location = [property.neighborhood, property.city].filter(Boolean).join(", ") || undefined;
                    const url = buildGoogleCalendarUrl(
                      `Visita: ${property.title}`,
                      property.coordinatedDate!,
                      property.url ? `Publicación: ${property.url}` : undefined,
                      location
                    );
                    window.open(url, "_blank", "noopener,noreferrer");
                  }}
                  className="flex-1 min-w-0 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-medium bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 transition-colors touch-manipulation"
                >
                  <CalendarPlus className="w-4 h-4 shrink-0" />
                  <span className="truncate">Agregar visita al calendario</span>
                </button>
              ) : (
                property.sourceMarketplaceId ? (
                  <span className="inline-flex items-center gap-1 text-[11px] text-primary font-medium">
                    <Building2 className="w-3 h-3" />
                    De agencia
                  </span>
                ) : ownerEmail ? (
                  <span className="text-[11px] text-muted-foreground">
                    Ingresado por {ownerEmail}
                  </span>
                ) : <span />
              )}
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
                  (["ingresado", "contactado", "visita_coordinada", "firme_candidato", "posible_interes", "descartado"] as PropertyStatus[])
                  .map((key) => [key, STATUS_CONFIG[key]] as const)
                ).map(([key, cfg]) => (
                    <SelectItem key={key} value={key} className="text-xs">
                      <span className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                    </SelectItem>
                  ))}
                <SelectItem value="eliminado" className="text-xs text-destructive">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gray-500" />
                    Eliminar
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Dialogs */}
            <AlertDialog open={showDeleteConfirm} onOpenChange={(open) => { setShowDeleteConfirm(open); if (!open) setDeleteReason(""); }}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar esta propiedad?</AlertDialogTitle>
                  <AlertDialogDescription>
                    La propiedad "{property.title}" será marcada como eliminada. Indicá el motivo de la eliminación.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <Textarea
                  placeholder="Motivo de la eliminación..."
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  className="resize-none text-sm min-h-[80px] rounded-xl"
                />
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onStatusChange(property.id, "eliminado", deleteReason)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={showDiscardConfirm} onOpenChange={(open) => { setShowDiscardConfirm(open); if (!open) setSelectedAttributeIds([]); }}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Descartar esta propiedad?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Lamentamos que la propiedad "{property.title}" no haya colmado tus expectativas. Por suerte quedan cientos de posibilidades dentro del Market en la aplicación. Podrías darnos una última ayuda marcando los items que no fueron de tu agrado?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 py-2">
                  {feedbackAttributes.map((attr) => (
                    <label
                      key={attr.id}
                      className="flex items-center gap-2 cursor-pointer rounded-lg px-2 py-1.5 hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        checked={selectedAttributeIds.includes(attr.id)}
                        onCheckedChange={(checked) => {
                          setSelectedAttributeIds((prev) =>
                            checked ? [...prev, attr.id] : prev.filter((id) => id !== attr.id)
                          );
                        }}
                      />
                      <span className="text-sm font-medium text-foreground">{attr.name}</span>
                    </label>
                  ))}
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onStatusChange(property.id, "descartado", undefined, undefined, undefined, undefined, selectedAttributeIds)}
                    className="bg-status-discarded text-white hover:bg-status-discarded/90"
                  >
                    Descartar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={showProsConsConfirm} onOpenChange={(open) => { setShowProsConsConfirm(open); if (!open) { setPendingProsConsStatus(null); setSelectedPositiveIds([]); setSelectedNegativeIds([]); } }}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{pendingProsConsStatus === "firme_candidato" ? "Firme candidato" : "Posible interés"}</AlertDialogTitle>
                  <AlertDialogDescription>
                    Contanos qué te gustó y qué podría mejorar de "{property.title}". Nos ayuda a mejorar las recomendaciones.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-4 py-2">
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">¿Qué te gustó?</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      {feedbackAttributes.map((attr) => (
                        <label key={attr.id} className="flex items-center gap-2 cursor-pointer rounded-lg px-2 py-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors">
                          <Checkbox
                            checked={selectedPositiveIds.includes(attr.id)}
                            onCheckedChange={(checked) => {
                              setSelectedPositiveIds((prev) => checked ? [...prev, attr.id] : prev.filter((id) => id !== attr.id));
                            }}
                          />
                          <span className="text-sm font-medium text-foreground">{attr.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">¿Qué no te gustó o podría mejorar?</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      {feedbackAttributes.map((attr) => (
                        <label key={attr.id} className="flex items-center gap-2 cursor-pointer rounded-lg px-2 py-1.5 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors">
                          <Checkbox
                            checked={selectedNegativeIds.includes(attr.id)}
                            onCheckedChange={(checked) => {
                              setSelectedNegativeIds((prev) => checked ? [...prev, attr.id] : prev.filter((id) => id !== attr.id));
                            }}
                          />
                          <span className="text-sm font-medium text-foreground">{attr.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <Button
                    type="button"
                    className={pendingProsConsStatus === "firme_candidato" ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-amber-600 text-white hover:bg-amber-700"}
                    onClick={async () => {
                      if (!pendingProsConsStatus) return;
                      try {
                        await onStatusChange(property.id, pendingProsConsStatus, undefined, undefined, undefined, undefined, undefined, { positiveIds: selectedPositiveIds, negativeIds: selectedNegativeIds });
                        setShowProsConsConfirm(false);
                        setPendingProsConsStatus(null);
                        setSelectedPositiveIds([]);
                        setSelectedNegativeIds([]);
                      } catch {
                        // Error ya mostrado en toast; el modal permanece abierto
                      }
                    }}
                  >
                    Confirmar
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={showCoordinatedConfirm} onOpenChange={(open) => { setShowCoordinatedConfirm(open); if (!open) setCoordinatedDateTime(""); }}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Coordinar visita</AlertDialogTitle>
                  <AlertDialogDescription>
                    Seleccioná la fecha y hora de la visita coordinada para "{property.title}". La fecha debe ser posterior a hoy.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground text-left block">Fecha y hora de la visita</label>
                  <Input
                    type="datetime-local"
                    value={coordinatedDateTime}
                    onChange={(e) => setCoordinatedDateTime(e.target.value)}
                    min={toDatetimeLocalString(new Date())}
                    className="rounded-xl"
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <Button
                    type="button"
                    disabled={!coordinatedDateTime.trim() || new Date(coordinatedDateTime) <= new Date()}
                    onClick={() => {
                      const isoDate = coordinatedDateTime ? new Date(coordinatedDateTime).toISOString() : null;
                      onStatusChange(property.id, "visita_coordinada", undefined, isoDate);
                    }}
                    className="bg-status-coordinated text-white hover:bg-status-coordinated/90 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    Confirmar visita
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={showContactedConfirm} onOpenChange={(open) => { setShowContactedConfirm(open); if (!open) setContactedName(""); }}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Registrar contacto</AlertDialogTitle>
                  <AlertDialogDescription>
                    Ingresá el nombre de la persona con la que te contactaste por "{property.title}".
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground text-left block">Nombre del contacto</label>
                  <Input
                    placeholder="Ej: Juan Pérez"
                    value={contactedName}
                    onChange={(e) => setContactedName(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      onStatusChange(property.id, "contactado", undefined, undefined, undefined, contactedName);
                    }}
                    className="bg-status-contacted text-white hover:bg-status-contacted/90"
                  >
                    Confirmar contacto
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        }
      />
      <FullScreenGallery
        images={property.images}
        isOpen={isGalleryOpen}
        initialIndex={galleryInitialImg}
        onClose={() => setIsGalleryOpen(false)}
      />
    </>
  );
}
