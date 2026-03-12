import { useState } from "react";
import { MarketplaceProperty } from "@/types/property";
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import {
    MapPin,
    Maximize2,
    BedDouble,
    ExternalLink,
    ChevronLeft,
    ChevronRight,
    Share2,
    Building2,
} from "lucide-react";
import { currencySymbol } from "@/lib/currency";
import { FullScreenGallery } from "@/components/ui/FullScreenGallery";

interface MarketplacePropertyDetailModalProps {
    property: MarketplaceProperty | null;
    open: boolean;
    onClose: () => void;
}

export function MarketplacePropertyDetailModal({
    property,
    open,
    onClose,
}: MarketplacePropertyDetailModalProps) {
    const [activeImg, setActiveImg] = useState(0);
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);

    if (!property) return null;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-2xl">
                {/* Image Gallery */}
                <div className="relative h-64 bg-muted rounded-t-2xl overflow-hidden cursor-zoom-in" onClick={() => setIsGalleryOpen(true)}>
                    <img
                        src={property.images[activeImg] || "/placeholder.svg"}
                        alt={property.title}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/5 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Maximize2 className="w-8 h-8 text-white drop-shadow-lg" />
                    </div>
                    {property.images.length > 1 && (
                        <>
                            <button
                                onClick={(e) => { e.stopPropagation(); setActiveImg((p) => (p - 1 + property.images.length) % property.images.length); }}
                                className="absolute left-3 top-1/2 -translate-y-1/2 bg-card/90 rounded-full p-1.5 hover:bg-card transition-colors shadow-lg z-10"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); setActiveImg((p) => (p + 1) % property.images.length); }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 bg-card/90 rounded-full p-1.5 hover:bg-card transition-colors shadow-lg z-10"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                                {property.images.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={(e) => { e.stopPropagation(); setActiveImg(i); }}
                                        className={`w-2 h-2 rounded-full transition-all ${i === activeImg ? "bg-card scale-125 shadow-md" : "bg-card/50"
                                            }`}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Acciones Rápidas */}
                <div className="px-6 pt-4 grid grid-cols-2 gap-3">
                    <Button
                        variant="outline"
                        className="h-11 rounded-xl gap-2 font-medium border-border hover:bg-muted w-full"
                        onClick={(e) => {
                            e.stopPropagation();
                            const publicUrl = `${window.location.origin}/p/${property.id}`;
                            navigator.clipboard.writeText(publicUrl);
                            toast({ title: "¡Copiado!", description: "Link listo para compartir." });
                        }}
                    >
                        <Share2 className="w-4 h-4" />
                        Compartir
                    </Button>
                    <Button
                        variant="secondary"
                        className="h-11 rounded-xl gap-2 font-medium bg-secondary/50 hover:bg-secondary w-full"
                        onClick={(e) => {
                            e.stopPropagation();
                            window.open(property.url, "_blank");
                        }}
                    >
                        <ExternalLink className="w-4 h-4" />
                        Ver original
                    </Button>
                </div>

                <div className="px-6 pb-6 pt-2 space-y-5">
                    {/* Header */}
                    <div>
                        <div className="flex items-start justify-between gap-4 mb-2">
                            <h2 className="text-xl font-bold leading-tight text-foreground">{property.title}</h2>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            <span className="text-sm">{property.neighborhood}{property.city ? `, ${property.city}` : ""}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-2">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                                <Building2 className="w-3 h-3" />
                                {property.agencyName}
                            </span>
                        </div>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-muted rounded-xl p-3 text-center transition-colors hover:bg-muted/80">
                            <div className="text-lg font-bold text-foreground">{property.sqMeters}</div>
                            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">m²</div>
                        </div>
                        <div className="bg-muted rounded-xl p-3 text-center transition-colors hover:bg-muted/80">
                            <div className="text-lg font-bold text-foreground">{property.rooms || "—"}</div>
                            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{property.rooms === 1 ? "Ambiente" : "Ambientes"}</div>
                        </div>
                        <div className="bg-muted rounded-xl p-3 text-center transition-colors hover:bg-muted/80">
                            <div className="text-lg font-bold text-foreground">{currencySymbol(property.currency)}</div>
                            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Moneda</div>
                        </div>
                    </div>

                    {/* Price Breakdown */}
                    <div className="bg-muted/50 rounded-2xl p-5 space-y-3 border border-border/50">
                        <div className="flex justify-between text-sm items-center">
                            <span className="text-muted-foreground font-medium">{property.listingType === "sale" ? "Precio de venta" : "Alquiler mensual"}</span>
                            <span className="font-semibold text-foreground">{currencySymbol(property.currency)} {property.priceRent.toLocaleString()}</span>
                        </div>
                        {property.listingType === "rent" && (
                            <div className="flex justify-between text-sm items-center">
                                <span className="text-muted-foreground font-medium">Gastos comunes</span>
                                <span className="font-semibold text-foreground">{currencySymbol(property.currency)} {property.priceExpenses.toLocaleString()}</span>
                            </div>
                        )}
                        <div className="border-t border-border/80 pt-3 flex justify-between items-end">
                            <span className="font-bold text-foreground">Total {property.listingType === "sale" ? "" : "por mes"}</span>
                            <div className="text-right">
                                <span className="font-black text-primary text-2xl tracking-tight">
                                    {currencySymbol(property.currency)} {property.totalCost.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Descripción / Detalles */}
                    {property.description && (
                        <div className="space-y-3">
                            <div className="text-sm font-bold text-foreground uppercase tracking-widest text-primary/80">Descripción y Detalles</div>
                            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line font-medium italic">
                                    {property.description}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <FullScreenGallery
                    images={property.images}
                    isOpen={isGalleryOpen}
                    initialIndex={activeImg}
                    onClose={() => setIsGalleryOpen(false)}
                />
            </DialogContent>
        </Dialog>
    );
}
