import { useState } from "react";
import { MapPin, Maximize2, BedDouble } from "lucide-react";
import { currencySymbol } from "@/lib/currency";

interface PropertyCardBaseProps {
    title: string;
    neighborhood: string;
    priceRent: number;
    priceExpenses: number;
    currency: string;
    totalCost: number;
    sqMeters: number;
    rooms: number;
    images: string[];
    onClick?: () => void;
    /** Elementos que aparecen sobre la imagen (badges, overlays) */
    topOverlay?: React.ReactNode;
    /** Elementos adicionales debajo de la imagen (quien lo cargó, etc) */
    subImageContent?: React.ReactNode;
    /** Contenido extra dentro del cuerpo (motivos de eliminación, descripción corta) */
    extraBodyContent?: React.ReactNode;
    /** Botones o selectores de acción en la base de la tarjeta */
    actions?: React.ReactNode;
    /** Clase adicional para el contenedor principal */
    className?: string;
}

/**
 * Componente Base Reutilizable para Tarjetas de Propiedad (REGLA 2)
 * Centraliza el diseño premium, la galería de fotos y la estructura de datos.
 */
export function PropertyCardBase({
    title,
    neighborhood,
    priceRent,
    priceExpenses,
    currency,
    totalCost,
    sqMeters,
    rooms,
    images,
    onClick,
    topOverlay,
    subImageContent,
    extraBodyContent,
    actions,
    className = "",
}: PropertyCardBaseProps) {
    const [currentImg, setCurrentImg] = useState(0);

    return (
        <div
            className={`bg-card rounded-2xl overflow-hidden card-shadow hover:card-shadow-hover transition-all duration-300 cursor-pointer group animate-fade-in ${className}`}
            onClick={onClick}
        >
            {/* Sección de Imagen */}
            <div className="relative h-48 overflow-hidden bg-muted">
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

                {/* Overlay superior (Status badges, Agency name, etc) */}
                {topOverlay && (
                    <div className="absolute top-3 left-3 flex flex-col gap-1">
                        {topOverlay}
                    </div>
                )}
            </div>

            {/* Contenido debajo de la imagen (ej: Ingresado por...) */}
            {subImageContent}

            {/* Cuerpo de la tarjeta */}
            <div className="p-4 space-y-3 text-left">
                {/* Barrio */}
                <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">{neighborhood || "Sin barrio"}</span>
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
                            <span className="text-xs text-muted-foreground">/mes</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                            Alquiler {currencySymbol(currency)} {priceRent.toLocaleString()} +{" "}
                            Expensas {currencySymbol(currency)} {priceExpenses.toLocaleString()}
                        </div>
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
