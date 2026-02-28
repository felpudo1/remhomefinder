import { useState } from "react";
import { Property, PropertyStatus, STATUS_CONFIG } from "@/types/property";
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
import { MapPin, Maximize2, BedDouble, Trash2, XCircle, ExternalLink, CalendarIcon, Building2 } from "lucide-react";
import { currencySymbol } from "@/lib/currency";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

interface PropertyCardProps {
  property: Property;
  onStatusChange: (id: string, status: PropertyStatus, deletedReason?: string, coordinatedDate?: string | null, groupId?: string | null) => void;
  onClick: () => void;
  ownerEmail?: string | null;
}

function formatDateTime(date: Date): string {
  return format(date, "dd/MM/yyyy HH:mm");
}

export function PropertyCard({ property, onStatusChange, onClick, ownerEmail }: PropertyCardProps) {
  const [currentImg, setCurrentImg] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [discardReason, setDiscardReason] = useState("");
  const [showCoordinatedConfirm, setShowCoordinatedConfirm] = useState(false);
  const [coordinatedDateTime, setCoordinatedDateTime] = useState("");
  const config = STATUS_CONFIG[property.status];

  const handleStatusChange = (val: string) => {
    if (val === "eliminado") {
      setShowDeleteConfirm(true);
    } else if (val === "discarded") {
      setShowDiscardConfirm(true);
    } else if (val === "coordinated") {
      setShowCoordinatedConfirm(true);
    } else {
      onStatusChange(property.id, val as PropertyStatus);
    }
  };

  const isEliminated = property.status === "eliminado";
  const isDiscarded = property.status === "discarded";

  return (
    <div
      className={`bg-card rounded-2xl overflow-hidden card-shadow hover:card-shadow-hover transition-all duration-300 cursor-pointer group animate-fade-in ${isEliminated || isDiscarded ? "opacity-60" : ""}`}
      onClick={onClick}
    >
      {/* Image Section */}
      <div className="relative h-48 overflow-hidden bg-muted">
        <img
          src={property.images[currentImg]}
          alt={property.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {property.images.length > 1 && (
          <div
            className="absolute bottom-3 right-3 flex gap-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            {property.images.map((img, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setCurrentImg(i); }}
                className={`w-7 h-7 rounded-md overflow-hidden border-2 transition-all ${i === currentImg ? "border-card opacity-100" : "border-transparent opacity-60 hover:opacity-90"}`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
        {/* Status Badge + who changed it + date */}
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
            {config.label}
          </span>
          {/* Who changed status + date */}
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
              {property.status === "coordinated" && property.coordinatedDate && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-black/50 text-white backdrop-blur-md">
                  <CalendarIcon className="w-3 h-3" />
                  Visita: {formatDateTime(property.coordinatedDate)}
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Source badge or owner email */}
      {property.sourceMarketplaceId ? (
        <div className="px-4 pt-2">
          <span className="inline-flex items-center gap-1 text-[11px] text-primary font-medium">
            <Building2 className="w-3 h-3" />
            De agencia
          </span>
        </div>
      ) : ownerEmail ? (
        <div className="px-4 pt-2">
          <span className="text-[11px] text-muted-foreground">
            Ingresado por {ownerEmail}
          </span>
        </div>
      ) : null}

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Barrio y link */}
        <div className="flex items-center justify-between gap-1 text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">{property.neighborhood}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 gap-1.5 hover:bg-muted text-[10px] font-normal"
            onClick={(e) => { e.stopPropagation(); window.open(property.url, "_blank"); }}
            title="Ver publicación original"
          >
            <span className="text-muted-foreground uppercase tracking-wider">link de la publicación</span>
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-foreground leading-snug line-clamp-2 text-sm">
          {property.title}
        </h3>

        {/* Property stats */}
        <div className="flex items-center gap-3 text-muted-foreground text-xs">
          <span className="flex items-center gap-1">
            <Maximize2 className="w-3.5 h-3.5" />
            {property.sqMeters} m²
          </span>
          <span className="flex items-center gap-1">
            <BedDouble className="w-3.5 h-3.5" />
            {property.rooms} {property.rooms === 1 ? "ambiente" : "ambientes"}
          </span>
        </div>

        {/* Eliminated info */}
        {isEliminated && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-2.5 space-y-1">
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

        {/* Discarded info */}
        {isDiscarded && (
          <div className="bg-status-discarded-bg border border-status-discarded/20 rounded-xl p-2.5 space-y-1">
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

        <div className="border-t border-border" />

        {/* Price Section */}
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-foreground">
                {currencySymbol(property.currency)} {property.totalCost.toLocaleString()}
              </span>
              <span className="text-xs text-muted-foreground">/mes</span>
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Alquiler {currencySymbol(property.currency)} {property.priceRent.toLocaleString()} +{" "}
              Expensas {currencySymbol(property.currency)} {property.priceExpenses.toLocaleString()}
            </div>
          </div>

          {/* Status Selector */}
          <div onClick={(e) => e.stopPropagation()}>
            <Select value={property.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="h-8 text-xs w-auto border-border bg-background px-2 gap-1 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(STATUS_CONFIG) as [PropertyStatus, typeof STATUS_CONFIG[PropertyStatus]][])
                  .filter(([key]) => key !== "eliminado")
                  .map(([key, cfg]) => (
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

            {/* Delete dialog */}
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

            {/* Discard dialog */}
            <AlertDialog open={showDiscardConfirm} onOpenChange={(open) => { setShowDiscardConfirm(open); if (!open) setDiscardReason(""); }}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Descartar esta propiedad?</AlertDialogTitle>
                  <AlertDialogDescription>
                    La propiedad "{property.title}" será marcada como descartada. Indicá el motivo del descarte.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <Textarea
                  placeholder="Motivo del descarte..."
                  value={discardReason}
                  onChange={(e) => setDiscardReason(e.target.value)}
                  className="resize-none text-sm min-h-[80px] rounded-xl"
                />
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onStatusChange(property.id, "discarded", discardReason)}
                    className="bg-status-discarded text-white hover:bg-status-discarded/90"
                  >
                    Descartar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Coordinated date dialog */}
            <AlertDialog open={showCoordinatedConfirm} onOpenChange={(open) => { setShowCoordinatedConfirm(open); if (!open) setCoordinatedDateTime(""); }}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Coordinar visita</AlertDialogTitle>
                  <AlertDialogDescription>
                    Seleccioná la fecha y hora de la visita coordinada para "{property.title}".
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Fecha y hora de la visita</label>
                  <Input
                    type="datetime-local"
                    value={coordinatedDateTime}
                    onChange={(e) => setCoordinatedDateTime(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      const isoDate = coordinatedDateTime ? new Date(coordinatedDateTime).toISOString() : null;
                      onStatusChange(property.id, "coordinated", undefined, isoDate);
                    }}
                    className="bg-status-coordinated text-white hover:bg-status-coordinated/90"
                  >
                    Confirmar visita
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
}
