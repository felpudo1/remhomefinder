import { useState } from "react";
import { MapPin, Maximize2, BedDouble } from "lucide-react";
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
    /** Elementos adicionales debajo de la imagen (quien lo cargó, etc) */
    subImageContent?: React.ReactNode;
    /** Contenido extra dentro del cuerpo (motivos de eliminación, descripción corta) */
    extraBodyContent?: React.ReactNode;
    /** Botones o selectores de acción en la base de la tarjeta */
    actions?: React.ReactNode;
    /** Clase adicional para el contenedor principal */
    className?: string;
    /** Overlay de estrellas sobre la imagen */
    ratingOverlay?: React.ReactNode;
    /** Manejador de click específico para la imagen (para abrir galería sin abrir detalle) */
    onImageClick?: (index: number) => void;
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
    subImageContent,
    extraBodyContent,
    actions,
    className = "",
    onImageClick,
    ratingOverlay,
}: PropertyCardBaseProps) {
    const [currentImg, setCurrentImg] = useState(0);

    const handleImageContainerClick = (e: React.MouseEvent) => {
        if (onImageClick) {
            e.stopPropagation();
            onImageClick(currentImg);
        }
    };

    return (
        <div
            className={`bg-card rounded-2xl overflow-hidden card-shadow hover:card-shadow-hover transition-all duration-300 cursor-pointer group animate-fade-in ${className}`}
            onClick={onClick}
        >
            {/* Sección de Imagen */}
            <div
                className="relative h-48 md:h-64 lg:h-72 overflow-hidden bg-muted cursor-zoom-in"
                onClick={handleImageContainerClick}
            >
                <img
                    src={images[currentImg] || "/placeholder.svg"}
                    alt={title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Thumbnails si hay más de una foto */}
                {images.length > 1 && (
                    <div
                        className="absolute bottom-3 right-3 flex gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {images.slice(0, 4).map((img, i) => (
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

                {/* Overlay superior izquierdo (Agency name, type badge) */}
                {topOverlay && (
                    <div className="absolute top-3 left-3 flex flex-col gap-1">
                        {topOverlay}
                    </div>
                )}

                {/* Overlay de estado superior derecho (Reservada, Vendida, Alquilada) */}
                {statusOverlay && (
                    <div className="absolute top-3 right-3">
                        {statusOverlay}
                    </div>
                )}

                {/* Overlay de estrellas (puntuación familiar) */}
                {ratingOverlay && (
                    <div className="absolute top-3 right-3">
                        {ratingOverlay}
                    </div>
                )}
            </div>

            {/* Contenido debajo de la imagen (ej: Ingresado por...) */}
            {subImageContent}

            {/* Cuerpo de la tarjeta */}
            <div className="p-4 space-y-3 text-left">
                {/* Barrio + Estado */}
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 text-muted-foreground min-w-0">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-xs font-medium truncate">
                            {neighborhood || "Sin barrio"}{city ? `, ${city}` : ""}
                        </span>
                    </div>
                    {statusBadge}
                </div>

                {/* Título */}
                <h3 className="font-semibold text-foreground leading-snug line-clamp-2 text-sm">
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

                <div className="border-t border-border" />

                {/* Sección de Precio y Acciones */}
                <div className="flex items-end justify-between">
                    <div>
                        <div className="flex items-baseline gap-1">
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

                    {/* Botones o selectores de acción */}
                    <div onClick={(e) => e.stopPropagation()}>
                        {actions}
                    </div>
                </div>
            </div>
        </div>
    );
}
