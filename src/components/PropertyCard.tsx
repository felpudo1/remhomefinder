import { useState } from "react";
import { Property, PropertyStatus, STATUS_CONFIG } from "@/types/property";
import { Badge } from "@/components/ui/badge";
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
import { MapPin, Maximize2, BedDouble, DollarSign, Trash2 } from "lucide-react";
import { currencySymbol } from "@/lib/currency";
import { Textarea } from "@/components/ui/textarea";

interface PropertyCardProps {
  property: Property;
  onStatusChange: (id: string, status: PropertyStatus, deletedReason?: string) => void;
  onClick: () => void;
  ownerEmail?: string | null;
}

export function PropertyCard({ property, onStatusChange, onClick, ownerEmail }: PropertyCardProps) {
  const [currentImg, setCurrentImg] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const config = STATUS_CONFIG[property.status];

  const handleStatusChange = (val: string) => {
    if (val === "eliminado") {
      setShowDeleteConfirm(true);
    } else {
      onStatusChange(property.id, val as PropertyStatus);
    }
  };

  const isEliminated = property.status === "eliminado";

  return (
    <div
      className={`bg-card rounded-2xl overflow-hidden card-shadow hover:card-shadow-hover transition-all duration-300 cursor-pointer group animate-fade-in ${isEliminated ? "opacity-60" : ""}`}
      onClick={onClick}
    >
      {/* Image Section */}
      <div className="relative h-48 overflow-hidden bg-muted">
        <img
          src={property.images[currentImg]}
          alt={property.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Image thumbnails */}
        {property.images.length > 1 && (
          <div
            className="absolute bottom-3 right-3 flex gap-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            {property.images.map((img, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setCurrentImg(i); }}
                className={`w-7 h-7 rounded-md overflow-hidden border-2 transition-all ${i === currentImg ? "border-card opacity-100" : "border-transparent opacity-60 hover:opacity-90"
                  }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
            {config.label}
          </span>
        </div>
        {/* Owner Email Badge */}
        {ownerEmail && (
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-black/60 text-white backdrop-blur-md">
              {ownerEmail}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Neighborhood */}
        <div className="flex items-center gap-1 text-muted-foreground">
          <MapPin className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">{property.neighborhood}</span>
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

        {/* Divider */}
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
            <Select
              value={property.status}
              onValueChange={handleStatusChange}
            >
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
          </div>
        </div>
      </div>
    </div>
  );
}
