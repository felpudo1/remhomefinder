import { MarketplaceProperty } from "@/types/property";
import { Bookmark, Building2, Star, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PropertyCardBase } from "@/components/ui/PropertyCardBase";
import { PROPERTY_STATUS_LABELS } from "@/lib/constants";
import { FullScreenGallery } from "@/components/ui/FullScreenGallery";
import { MarketplacePropertyDetailModal } from "@/components/MarketplacePropertyDetailModal";
import { useState } from "react";
import { MatchiAIBadge } from "@/components/ui/MatchiAIBadge";
import { StarRating } from "@/components/ui/StarRating";
import { cn } from "@/lib/utils";
import { QRCodeModal } from "@/components/marketplace/QRCodeModal";

interface MarketplaceCardProps {
  property: MarketplaceProperty;
  onSave: (property: MarketplaceProperty) => void;
  isSaving?: boolean;
  alreadySaved?: boolean;
  isReferred?: boolean;
  forceExpandImages?: boolean;
  isMatchAIMagicActive?: boolean;
  matchAIRank?: number;
  userOrgId?: string | null;
}

/**
 * Configuración visual de los overlays/badges de estado sobre la foto.
 * Las claves coinciden con agent_pub_status en la BD (español).
 */
const STATUS_OVERLAY_CONFIG: Record<string, { label: string; className: string } | null> = {
  disponible: { label: "Disponible", className: "bg-emerald-600/90 text-white" },
  pausado: { label: "Pausada", className: "bg-amber-500/90 text-white" },
  reservado: { label: "Reservada", className: "bg-blue-600/90 text-white" },
  vendido: { label: "Vendida", className: "bg-slate-900/90 text-white" },
  alquilado: { label: "Alquilada", className: "bg-purple-600/90 text-white" },
  eliminado: null,
};

export function MarketplaceCard({
  property,
  onSave,
  isSaving,
  alreadySaved,
  isReferred,
  forceExpandImages,
  isMatchAIMagicActive = false,
  matchAIRank = 0,
  userOrgId,
}: MarketplaceCardProps) {
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isQROpen, setIsQROpen] = useState(false);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const overlay = STATUS_OVERLAY_CONFIG[property.status];
  const isSaveCtaHighlighted = Boolean(isMatchAIMagicActive && !alreadySaved && !isSaving);

  // En el marketplace solo mostramos el promedio global (no se califica desde aquí)
  const averageRating = property.averageRating || 0;
  const totalVotes = property.totalVotes || 0;

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
        onClick={() => setIsDetailOpen(true)}
        onImageClick={(index) => {
          setCurrentImgIndex(index);
          setIsGalleryOpen(true);
        }}
        collapsibleImages={!forceExpandImages}
        autoRotateImages
        imageTransitionMode="push"
        topOverlay={
          <div className="flex flex-col gap-1.5 items-start">
            {isReferred && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-yellow-500 text-black shadow-lg animate-pulse">
                <Star className="w-3 h-3 fill-current" />
                TU AGENTE
              </span>
            )}
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-sm shadow-md ${
              isReferred
                ? "bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-400 text-black font-bold shadow-[0_0_15px_rgba(234,179,8,0.6),0_0_30px_rgba(234,179,8,0.3),0_0_45px_rgba(234,179,8,0.15)] animate-[shimmer_2s_ease-in-out_infinite] border border-yellow-300/60"
                : "bg-primary/90 text-primary-foreground"
            }`}>
              <Building2 className={`w-3 h-3 ${isReferred ? "drop-shadow-[0_0_4px_rgba(0,0,0,0.3)]" : ""}`} />
              {property.orgName}
              {isReferred && <Star className="w-3 h-3 fill-current drop-shadow-[0_0_4px_rgba(0,0,0,0.3)]" />}
            </span>
            {overlay && (
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold backdrop-blur-sm shadow-md ${overlay.className}`}>
                {overlay.label}
              </span>
            )}
          </div>
        }
        ratingOverlay={
          <StarRating
            rating={0}
            averageRating={averageRating}
            totalVotes={totalVotes}
            totalGroupMembers={Math.max(totalVotes, 1)}
            readonly={true}
            showUserRating={false}
            marketplaceMode={true}
          />
        }
        bottomLeftOverlay={
          isMatchAIMagicActive ? <MatchiAIBadge /> : undefined
        }
        subImageContent={
          <div className="px-4 pt-2 flex items-center justify-end">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide ${property.listingType === "sale"
              ? "bg-accent/15 text-accent-foreground"
              : "bg-primary/10 text-primary"
              }`}>
              {property.listingType === "sale" ? "Venta" : "Alquiler"}
            </span>
          </div>
        }
        actions={
          <Button
            size="sm"
            variant={alreadySaved ? "secondary" : "default"}
            className={`gap-1.5 rounded-lg ${isSaveCtaHighlighted ? "matchai-save-cta-glow" : ""}`}
            style={isSaveCtaHighlighted ? { animationDelay: `${Math.min(matchAIRank * 90, 700)}ms` } : undefined}
            onClick={(e) => {
              e.stopPropagation();
              onSave(property);
            }}
            disabled={isSaving || alreadySaved}
          >
            <Bookmark className={`w-3.5 h-3.5 ${alreadySaved ? "fill-current" : ""}`} />
            {alreadySaved ? "Guardada" : "Guardar"}
          </Button>
        }
      />

      <MarketplacePropertyDetailModal
        property={property}
        open={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />

      <FullScreenGallery
        images={property.images}
        isOpen={isGalleryOpen}
        initialIndex={currentImgIndex}
        onClose={() => setIsGalleryOpen(false)}
      />
    </>
  );
}
