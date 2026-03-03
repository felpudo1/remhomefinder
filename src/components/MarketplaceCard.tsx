import { MarketplaceProperty } from "@/types/property";
import { Bookmark, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PropertyCardBase } from "@/components/ui/PropertyCardBase";
import { PROPERTY_STATUS_LABELS } from "@/lib/constants";

interface MarketplaceCardProps {
  property: MarketplaceProperty;
  onSave: (property: MarketplaceProperty) => void;
  isSaving?: boolean;
  alreadySaved?: boolean;
}

/**
 * Configuración visual de los overlays de estado sobre la foto.
 * Solo se muestra cuando la propiedad NO está activa.
 * Active y paused no necesitan badge — se entiende que están disponibles.
 */
const STATUS_OVERLAY_CONFIG: Record<string, { label: string; className: string } | null> = {
  active: null,
  paused: null,
  reserved: { label: "Reservada", className: "bg-blue-600/90 text-white" },
  sold: { label: "Vendida", className: "bg-slate-900/90 text-white" },
  rented: { label: "Alquilada", className: "bg-purple-600/90 text-white" },
  deleted: null,
};

export function MarketplaceCard({ property, onSave, isSaving, alreadySaved }: MarketplaceCardProps) {
  const overlay = STATUS_OVERLAY_CONFIG[property.status];

  return (
    <PropertyCardBase
      title={property.title}
      neighborhood={property.neighborhood}
      priceRent={property.priceRent}
      priceExpenses={property.priceExpenses}
      currency={property.currency}
      totalCost={property.totalCost}
      sqMeters={property.sqMeters}
      rooms={property.rooms}
      images={property.images}
      listingType={property.listingType}
      topOverlay={
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/90 text-primary-foreground backdrop-blur-sm">
          <Building2 className="w-3 h-3" />
          {property.agencyName}
        </span>
      }
      statusOverlay={
        overlay ? (
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm shadow-md ${overlay.className}`}>
            {overlay.label}
          </span>
        ) : undefined
      }
      extraBodyContent={
        property.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mt-1">
            {property.description}
          </p>
        )
      }
      actions={
        <Button
          size="sm"
          variant={alreadySaved ? "secondary" : "default"}
          className="gap-1.5 rounded-lg"
          onClick={() => onSave(property)}
          disabled={isSaving || alreadySaved}
        >
          <Bookmark className={`w-3.5 h-3.5 ${alreadySaved ? "fill-current" : ""}`} />
          {alreadySaved ? "Guardada" : "Guardar"}
        </Button>
      }
    />
  );
}
