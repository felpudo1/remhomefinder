import { useState } from "react";
import { MarketplaceProperty } from "@/types/property";
import { MapPin, Maximize2, BedDouble, Bookmark, Building2 } from "lucide-react";
import { currencySymbol } from "@/lib/currency";
import { Button } from "@/components/ui/button";

interface MarketplaceCardProps {
  property: MarketplaceProperty;
  onSave: (property: MarketplaceProperty) => void;
  isSaving?: boolean;
  alreadySaved?: boolean;
}

export function MarketplaceCard({ property, onSave, isSaving, alreadySaved }: MarketplaceCardProps) {
  const [currentImg, setCurrentImg] = useState(0);

  return (
    <div className="bg-card rounded-2xl overflow-hidden card-shadow hover:card-shadow-hover transition-all duration-300 group animate-fade-in">
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-muted">
        <img
          src={property.images[currentImg]}
          alt={property.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {property.images.length > 1 && (
          <div className="absolute bottom-3 right-3 flex gap-1.5">
            {property.images.slice(0, 4).map((img, i) => (
              <button
                key={i}
                onClick={() => setCurrentImg(i)}
                className={`w-7 h-7 rounded-md overflow-hidden border-2 transition-all ${i === currentImg ? "border-card opacity-100" : "border-transparent opacity-60 hover:opacity-90"}`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
        {/* Agency badge */}
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/90 text-primary-foreground backdrop-blur-sm">
            <Building2 className="w-3 h-3" />
            {property.agencyName}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-1 text-muted-foreground">
          <MapPin className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">{property.neighborhood || "Sin barrio"}</span>
        </div>

        <h3 className="font-semibold text-foreground leading-snug line-clamp-2 text-sm">
          {property.title}
        </h3>

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

        {property.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {property.description}
          </p>
        )}

        <div className="border-t border-border" />

        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-foreground">
                {currencySymbol(property.currency)} {property.totalCost.toLocaleString()}
              </span>
              <span className="text-xs text-muted-foreground">/mes</span>
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Alquiler {currencySymbol(property.currency)} {property.priceRent.toLocaleString()} + Expensas {currencySymbol(property.currency)} {property.priceExpenses.toLocaleString()}
            </div>
          </div>

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
        </div>
      </div>
    </div>
  );
}
