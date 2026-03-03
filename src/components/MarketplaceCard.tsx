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

/** Configuración visual de los badges de estado */
const STATUS_COLOR_CONFIG: Record<string, { bg: string; text: string; dot: string }> = {
  active:   { bg: "bg-emerald-500/10", text: "text-emerald-600", dot: "bg-emerald-500" },
  paused:   { bg: "bg-amber-500/10",   text: "text-amber-600",   dot: "bg-amber-500" },
  reserved: { bg: "bg-blue-500/10",    text: "text-blue-600",    dot: "bg-blue-500" },
  sold:     { bg: "bg-slate-500/10",   text: "text-slate-600",   dot: "bg-slate-500" },
  rented:   { bg: "bg-purple-500/10",  text: "text-purple-600",  dot: "bg-purple-500" },
  deleted:  { bg: "bg-red-500/10",     text: "text-red-600",     dot: "bg-red-500" },
};

export function MarketplaceCard({ property, onSave, isSaving, alreadySaved }: MarketplaceCardProps) {
  const colors = STATUS_COLOR_CONFIG[property.status] || STATUS_COLOR_CONFIG.active;
  const label = PROPERTY_STATUS_LABELS[property.status] || property.status;

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
      statusBadge={
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold shrink-0 ${colors.bg} ${colors.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
          {label}
        </span>
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
