import { MarketplaceProperty } from "@/types/property";
import { Bookmark, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PropertyCardBase } from "@/components/ui/PropertyCardBase";

interface MarketplaceCardProps {
  property: MarketplaceProperty;
  onSave: (property: MarketplaceProperty) => void;
  isSaving?: boolean;
  alreadySaved?: boolean;
}

export function MarketplaceCard({ property, onSave, isSaving, alreadySaved }: MarketplaceCardProps) {
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
      topOverlay={
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/90 text-primary-foreground backdrop-blur-sm">
          <Building2 className="w-3 h-3" />
          {property.agencyName}
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
