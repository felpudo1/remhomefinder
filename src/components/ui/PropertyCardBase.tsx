import { useEffect, useState } from "react";
import { MapPin, Maximize2, BedDouble, ChevronDown, ChevronUp, ImageIcon, ImageOff } from "lucide-react";
import { currencySymbol } from "@/lib/currency";
import { ListingType } from "@/types/property";

interface PropertyCardBaseProps {
    title: string;
    neighborhood: string;
    city?: string;
    priceRent: number;
    priceExpenses: number;
    currency: string;
    totalCost: number;
    sqMeters: number;
    rooms: number;
    images: string[];
    listingType?: ListingType;
    onClick?: () => void;
    /** Elementos que aparecen sobre la imagen (badges, overlays) */
    topOverlay?: React.ReactNode;
    /** Badge de estado sobre la imagen, esquina superior derecha (reservada, vendida, alquilada) */
    statusOverlay?: React.ReactNode;
    /** Badge de estado inline junto al barrio */
    statusBadge?: React.ReactNode;
    /** Referencia de la publicación (ej: REF-12345), se muestra a la derecha del barrio */
    refText?: string;
    /** Elementos adicionales debajo de la imagen (quien lo cargó, etc) */
    subImageContent?: React.ReactNode;
    /** Contenido extra dentro del cuerpo (motivos de eliminación, descripción corta) */
    extraBodyContent?: React.ReactNode;
    /** Botones o selectores de acción en la base de la tarjeta */
    actions?: React.ReactNode;
    /** Contenido adicional al final de la tarjeta (debajo de precio/acciones) */
    bottomContent?: React.ReactNode;
    /** Clase adicional para el contenedor principal */
    className?: string;
    /** Overlay de estrellas sobre la imagen */
    ratingOverlay?: React.ReactNode;
    /** Manejador de click específico para la imagen (para abrir galería sin abrir detalle) */
    onImageClick?: (index: number) => void;
    /** Si true, la sección de fotos es colapsable y empieza colapsada (para listados densos) */
    collapsibleImages?: boolean;
    /** Si true, rota automáticamente las fotos de la tarjeta */
    autoRotateImages?: boolean;
    /** Define el estilo de transición de imagen al cambiar */
    imageTransitionMode?: "fade" | "flip" | "kenburns" | "push";
}

/**
 * Componente Base Reutilizable para Tarjetas de Propiedad (REGLA 2)
 * Centraliza el diseño premium, la galería de fotos y la estructura de datos.
 */
export function PropertyCardBase({
    title,
    neighborhood,
    city,
    priceRent,
    priceExpenses,
    currency,
    totalCost,
    sqMeters,
    rooms,
    images,
    listingType = "rent",
    onClick,
    topOverlay,
    statusOverlay,
    statusBadge,
    refText,
    subImageContent,
    extraBodyContent,
    actions,
    bottomContent,
    className = "",
    onImageClick,
    ratingOverlay,
    collapsibleImages = false,
    autoRotateImages = false,
    imageTransitionMode = "fade",
}: PropertyCardBaseProps) {
    const [currentImg, setCurrentImg] = useState(0);
    const [imagesExpanded, setImagesExpanded] = useState(!collapsibleImages);
    const hasImages = images.length > 0;
    const activeImageSrc = hasImages ? images[Math.min(currentImg, images.length - 1)] : "";

    useEffect(() => {
        if (currentImg >= images.length) setCurrentImg(0);
    }, [images.length, currentImg]);

    // Si el padre cambia collapsibleImages (ej. switch "Mostrar fotos" en marketplace),
    // hay que sincronizar: modo expandido forzado → siempre fotos visibles; modo colapsable → empezar colapsado.
    useEffect(() => {
        if (!collapsibleImages) {
            setImagesExpanded(true);
        } else {
            setImagesExpanded(false);
        }
    }, [collapsibleImages]);

    useEffect(() => {
        if (!autoRotateImages) return;
        if (images.length <= 1) return;
        if (collapsibleImages && !imagesExpanded) return;

        const intervalId = window.setInterval(() => {
            setCurrentImg((prev) => (prev + 1) % images.length);
        }, 3500);

        return () => window.clearInterval(intervalId);
    }, [autoRotateImages, images.length, collapsibleImages, imagesExpanded]);

    const handleImageContainerClick = (e: React.MouseEvent) => {
        if (!hasImages || !onImageClick) return;
        e.stopPropagation();
        onImageClick(Math.min(currentImg, images.length - 1));
    };

    const handleToggleImages = (e: React.MouseEvent) => {
        e.stopPropagation();
        setImagesExpanded((v) => !v);
    };

    return (
        <div
            className={`bg-card rounded-2xl overflow-hidden border-[4px] border-foreground/40 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] hover:border-primary/50 transition-all duration-300 cursor-pointer group animate-fade-in flex flex-col h-full min-h-0 ${className}`}
            onClick={onClick}
        >
            {/* Sección de Imagen (colapsable o fija). Sin fotos: nunca fila colapsada vacía; solo bloque “sin fotos”. */}
            {collapsibleImages && !imagesExpanded && hasImages ? (
                <div
                    className="flex shrink-0 items-center justify-between gap-2 px-3 py-2 bg-muted/80 hover:bg-muted cursor-pointer border-b border-border"
                    onClick={handleToggleImages}
                >
                    <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
                        <ImageIcon className="w-4 h-4" />
                        Ver fotos ({images.length})
                    </div>
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </div>
            ) : (
                <div
                    className={`relative h-48 md:h-64 lg:h-72 shrink-0 overflow-hidden bg-muted ${hasImages ? "cursor-zoom-in" : "cursor-default"}`}
                    onClick={(e) => {
                        const target = e.target as HTMLElement;
                        if (target.closest("[data-collapse-btn]")) return;
                        handleImageContainerClick(e);
                    }}
                >
                    {collapsibleImages && hasImages && (
                        <button
                            data-collapse-btn
                            type="button"
                            className="absolute top-2 right-2 z-10 p-1.5 rounded-lg bg-background/80 hover:bg-background border border-border shadow-sm transition-colors"
                            onClick={handleToggleImages}
                            title="Colapsar fotos"
                        >
                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        </button>
                    )}
                    {hasImages ? (
                    <img
                        key={activeImageSrc}
                        src={activeImageSrc}
                        alt={title}
                        className={`w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-105 ${
                            imageTransitionMode === "flip"
                                ? "hf-card-image-flip"
                                : imageTransitionMode === "kenburns"
                                    ? "hf-card-image-kenburns"
                                    : imageTransitionMode === "push"
                                        ? "hf-card-image-push"
                                    : "animate-fade-in"
                        }`}
                    />
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground px-4">
                            <ImageOff className="w-10 h-10 opacity-50" />
                            <span className="text-xs font-medium">Sin fotos</span>
                        </div>
                    )}
                    {images.length > 1 && (
                        <div
                            className="absolute bottom-3 right-3 flex gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {images.slice(0, 4).map((img, i) => (
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
                    {topOverlay && (
                        <div className="absolute top-3 left-3 flex flex-col gap-1">
                            {topOverlay}
                        </div>
                    )}
                    {statusOverlay && (
                        <div className="absolute top-3 right-3">
                            {statusOverlay}
                        </div>
                    )}
                    {ratingOverlay && (
                        <div className="absolute top-3 right-3">
                            {ratingOverlay}
                        </div>
                    )}
                </div>
            )}

            {/* Contenido debajo de la imagen (badge alquiler/venta, etc.) */}
            {subImageContent ? <div className="shrink-0">{subImageContent}</div> : null}

            {/* Cuerpo: crece para igualar altura en grillas; precio queda abajo */}
            <div className="p-4 flex flex-col flex-1 min-h-0 text-left">
                <div className="flex flex-col gap-3 shrink-0">
                    {/* Barrio + Ciudad | Ref */}
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-col gap-0.5 text-muted-foreground min-w-0">
                            <div className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 shrink-0" />
                                <span className="text-xs font-medium truncate">{neighborhood || "Sin barrio"}</span>
                            </div>
                            {city && (
                                <span className="text-xs font-medium truncate pl-5">{city}</span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            {refText !== undefined && (
                                <div className="flex items-center gap-1">
                                    <span className="text-xs font-mono font-bold text-foreground bg-muted/80 px-3 py-1 rounded min-h-[2.5rem] inline-flex items-center justify-center">
                                        ref:
                                    </span>
                                    <span className="text-xs font-mono font-bold text-foreground bg-muted/80 px-3 py-1 rounded min-w-[6rem] min-h-[2.5rem] inline-flex items-center justify-center tracking-widest">
                                        {refText || "\u00A0"}
                                    </span>
                                </div>
                            )}
                            {statusBadge}
                        </div>
                    </div>

                    {/* Título: altura fija para 2 líneas (text-sm + leading-snug) */}
                    <h3 className="font-semibold text-foreground leading-snug line-clamp-2 text-sm min-h-[2.75rem]">
                        {title}
                    </h3>

                    {/* Stats (m2, Ambientes) */}
                    <div className="flex items-center gap-3 text-muted-foreground text-xs">
                        <span className="flex items-center gap-1">
                            <Maximize2 className="w-3.5 h-3.5" />
                            {sqMeters} m²
                        </span>
                        <span className="flex items-center gap-1">
                            <BedDouble className="w-3.5 h-3.5" />
                            {rooms} {rooms === 1 ? "ambiente" : "ambientes"}
                        </span>
                    </div>

                    {/* Contenido extra (motivos de descarte, descripción, etc) */}
                    {extraBodyContent}
                </div>

                {/* Ocupa el espacio vertical sobrante en la misma fila de la grilla */}
                <div className="flex-1 min-h-2" aria-hidden="true" />

                <div className="border-t border-border shrink-0 pt-3 space-y-3">
                    {/* Sección de Precio y Acciones */}
                    <div className="flex items-end justify-between gap-2">
                        <div className="min-w-0">
                            <div className="flex items-baseline gap-1 flex-wrap">
                                <span className="text-xl font-bold text-foreground">
                                    {currencySymbol(currency)} {totalCost.toLocaleString()}
                                </span>
                                {listingType === "rent" && (
                                    <span className="text-xs text-muted-foreground">/mes</span>
                                )}
                            </div>
                            {listingType === "rent" ? (
                                <div className="text-xs text-muted-foreground mt-0.5">
                                    Alquiler {currencySymbol(currency)} {priceRent.toLocaleString()} +{" "}
                                    Gastos comunes {currencySymbol(currency)} {priceExpenses.toLocaleString()}
                                </div>
                            ) : (
                                <div className="text-xs text-muted-foreground mt-0.5">
                                    Precio de venta
                                </div>
                            )}
                        </div>

                        <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                            {actions}
                        </div>
                    </div>

                    {bottomContent}
                </div>
            </div>
        </div>
    );
}
