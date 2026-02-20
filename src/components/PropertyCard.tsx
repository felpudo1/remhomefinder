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
import { MapPin, Maximize2, BedDouble, DollarSign } from "lucide-react";

interface PropertyCardProps {
  property: Property;
  onStatusChange: (id: string, status: PropertyStatus) => void;
  onClick: () => void;
}

export function PropertyCard({ property, onStatusChange, onClick }: PropertyCardProps) {
  const [currentImg, setCurrentImg] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const config = STATUS_CONFIG[property.status];

  const handleStatusChange = (val: string) => {
    if (val === "eliminado") {
      setShowDeleteConfirm(true);
    } else {
      onStatusChange(property.id, val as PropertyStatus);
    }
  };

  return (
    <div
      className="bg-card rounded-2xl overflow-hidden card-shadow hover:card-shadow-hover transition-all duration-300 cursor-pointer group animate-fade-in"
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
                className={`w-7 h-7 rounded-md overflow-hidden border-2 transition-all ${
                  i === currentImg ? "border-card opacity-100" : "border-transparent opacity-60 hover:opacity-90"
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

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Price Section */}
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-foreground">
                {property.currency} {property.totalCost.toLocaleString()}
              </span>
              <span className="text-xs text-muted-foreground">/mes</span>
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Alquiler {property.currency} {property.priceRent.toLocaleString()} +{" "}
              Expensas {property.currency} {property.priceExpenses.toLocaleString()}
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

            <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar esta propiedad?</AlertDialogTitle>
                  <AlertDialogDescription>
                    La propiedad "{property.title}" será marcada como eliminada y no se mostrará más en la lista. Esta acción se puede revertir desde la base de datos.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onStatusChange(property.id, "eliminado")}
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
