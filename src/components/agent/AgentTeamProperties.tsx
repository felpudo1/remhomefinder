import { Loader2, Users, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PropertyCardBase } from "@/components/ui/PropertyCardBase";
import { FullScreenGallery } from "@/components/ui/FullScreenGallery";
import { MarketplacePropertyDetailModal } from "@/components/MarketplacePropertyDetailModal";
import { useAgencySharedProperties, SharedMarketplaceProperty } from "@/hooks/useAgencySharedProperties";
import { MarketplaceProperty } from "@/types/property";
import { PROPERTY_STATUS_LABELS } from "@/lib/constants";
import { useState } from "react";

interface AgentTeamPropertiesProps {
  activeGroupId: string | null;
  onOpenGroups: () => void;
}

export const AgentTeamProperties = ({ activeGroupId, onOpenGroups }: AgentTeamPropertiesProps) => {
  const { sharedProperties, isLoading } = useAgencySharedProperties(activeGroupId);
  const [selectedProperty, setSelectedProperty] = useState<MarketplaceProperty | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryIndex, setGalleryIndex] = useState(0);

  if (!activeGroupId) {
    return (
      <div className="border border-border rounded-2xl bg-card p-10 text-center space-y-4">
        <Users className="w-12 h-12 text-muted-foreground mx-auto" />
        <div className="space-y-1">
          <h3 className="font-semibold text-foreground">Sin equipo seleccionado</h3>
          <p className="text-muted-foreground text-sm">
            Seleccioná o creá un grupo para ver las propiedades compartidas por tu equipo.
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={onOpenGroups}>
          <UserPlus className="w-4 h-4" /> Gestionar equipos
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (sharedProperties.length === 0) {
    return (
      <div className="border border-border rounded-2xl bg-card p-10 text-center space-y-3">
        <Users className="w-10 h-10 text-muted-foreground mx-auto" />
        <p className="text-muted-foreground text-sm">
          Todavía no hay propiedades compartidas en este equipo.<br />
          Compartí desde "Mis Propiedades" usando el botón de compartir.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <Users className="w-5 h-5" /> Propiedades del Equipo ({sharedProperties.length})
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sharedProperties.map((p: SharedMarketplaceProperty) => (
          <PropertyCardBase
            key={p.id}
            title={p.title}
            neighborhood={p.neighborhood}
            city={p.city}
            priceRent={p.priceRent}
            priceExpenses={p.priceExpenses}
            totalCost={p.totalCost}
            currency={p.currency}
            sqMeters={p.sqMeters}
            rooms={p.rooms}
            images={p.images}
            listingType={p.listingType}
            onClick={() => {
              setSelectedProperty(p);
              setIsDetailOpen(true);
            }}
            onImageClick={(index) => {
              setGalleryImages(p.images);
              setGalleryIndex(index);
              setIsGalleryOpen(true);
            }}
            statusOverlay={
              <Badge
                variant="outline"
                className={`text-xs font-bold border-none ${
                  p.status === "active"
                    ? "bg-green-500/90 text-white"
                    : p.status === "paused"
                    ? "bg-yellow-500/90 text-white"
                    : "bg-blue-600/90 text-white"
                }`}
              >
                {PROPERTY_STATUS_LABELS[p.status] || p.status}
              </Badge>
            }
            subImageContent={
              <div className="px-4 pt-2 text-xs text-muted-foreground">
                Compartido por <span className="font-medium text-foreground">{p.sharedByName}</span>
              </div>
            }
          />
        ))}
      </div>

      <MarketplacePropertyDetailModal
        property={selectedProperty}
        open={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />

      <FullScreenGallery
        images={galleryImages}
        isOpen={isGalleryOpen}
        initialIndex={galleryIndex}
        onClose={() => setIsGalleryOpen(false)}
      />
    </div>
  );
};
