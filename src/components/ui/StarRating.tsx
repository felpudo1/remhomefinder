import { useState } from "react";
import { Star, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
    rating: number; // El voto del usuario actual
    averageRating?: number; // El promedio del grupo
    totalVotes?: number; // Cuánta gente votó
    totalGroupMembers?: number; // Total de integrantes del grupo
    onRate?: (rating: number) => void;
    readonly?: boolean;
    className?: string;
    showUserRating?: boolean; // Nueva prop opcional para forzar u ocultar
    marketplaceMode?: boolean; // Si true, muestra solo estrellas y cantidad de votos (sin "Promedio")
}

/**
 * Componente de Calificación por Estrellas (REGLA 2)
 * Diseño premium con soporte para interacción y visualización de promedios con medias estrellas.
 */
export function StarRating({
    rating,
    averageRating = 0,
    totalVotes = 0,
    totalGroupMembers = 0,
    onRate,
    readonly = false,
    className = "",
    showUserRating,
    marketplaceMode = false,
}: StarRatingProps) {
    const [hoverRating, setHoverRating] = useState(0);
    const showFamilyAverage = totalGroupMembers > 1 || (readonly && showUserRating === false);

    // Helper para renderizar estrellas fraccionarias (promedio)
    const renderFractionalStars = (val: number) => {
        return (
            <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => {
                    const diff = val - (s - 1);
                    let fillPercent = 0;
                    if (diff >= 1) fillPercent = 100;
                    else if (diff > 0) fillPercent = diff * 100;

                    return (
                        <div key={s} className="relative w-3 h-3">
                            <Star className="absolute inset-0 w-3 h-3 text-white/20 fill-transparent" />
                            <div
                                className="absolute inset-0 overflow-hidden"
                                style={{ width: `${fillPercent}%` }}
                            >
                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div
            className={cn(
                "flex flex-col gap-2 bg-black/50 backdrop-blur-xl p-2.5 rounded-2xl border border-white/10 shadow-2xl min-w-[120px]",
                className
            )}
            onClick={(e) => e.stopPropagation()}
        >
            {/* Sección Tu Voto — solo se muestra si tiene puntaje o no es readonly */}
            {(showUserRating ?? (!readonly || rating > 0)) && (
                <div className="space-y-1">
                    <div className="text-[9px] uppercase tracking-widest font-bold text-white/40 mb-1">Tu calificación</div>
                    <div className="flex items-center gap-1">
                        {readonly ? (
                            [1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    className={cn(
                                        "w-4 h-4",
                                        star <= rating ? "fill-yellow-400 text-yellow-400" : "text-white/20 fill-transparent"
                                    )}
                                />
                            ))
                        ) : (
                            [1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    onClick={() => onRate?.(star)}
                                    className="transition-all duration-200 transform hover:scale-125 active:scale-90"
                                >
                                    <Star
                                        className={cn(
                                            "w-4 h-4 transition-colors",
                                            star <= (hoverRating || rating)
                                                ? "fill-yellow-400 text-yellow-400"
                                                : "text-white/20 fill-transparent"
                                        )}
                                    />
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Si no hay grupo familiar (1 integrante), mostramos solo "Tu calificación". */}
            {showFamilyAverage && (
                marketplaceMode ? (
                    // HFMarket: Calificacion Gral con estrellas y cantidad de votos
                    <div className="space-y-0.5">
                        <div className="text-[8px] uppercase tracking-widest font-bold text-white/40">Calificacion Gral</div>
                        <div className="flex items-center justify-between gap-2">
                            {renderFractionalStars(averageRating)}
                            <span className="text-[9px] font-bold text-white/90 tabular-nums flex items-center gap-1">
                                <Users className="w-2.5 h-2.5 opacity-50" />
                                <span>{totalVotes}</span>
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-1 border-t border-white/5 pt-1.5">
                        <div className="text-[9px] uppercase tracking-widest font-bold text-white/40 mb-1">Promedio</div>
                        <div className="flex items-center justify-between gap-2">
                            {renderFractionalStars(averageRating)}
                            <span className="text-[10px] font-bold text-white/90 tabular-nums flex items-center gap-1">
                                <Users className="w-2.5 h-2.5 opacity-50" />
                                <span>{totalVotes}/{totalGroupMembers}</span>
                            </span>
                        </div>
                    </div>
                )
            )}
        </div>
    );
}

/**
 * Badge de calificación para "Mi Listado" con 3 secciones:
 * 1. Calificación general (promedio del marketplace)
 * 2. Tu calificación
 * 3. Calificación familiar (solo si tiene grupo)
 */
interface PropertyRatingBadgeProps {
    marketplaceAverageRating?: number;
    marketplaceTotalVotes?: number;
    userVote?: number;
    familyAverageRating?: number;
    familyTotalVotes?: number;
    totalGroupMembers?: number;
    onRate?: (rating: number) => void;
    readonly?: boolean;
    hasFamilyGroup?: boolean;
}

export function PropertyRatingBadge({
    marketplaceAverageRating = 0,
    marketplaceTotalVotes = 0,
    userVote = 0,
    familyAverageRating = 0,
    familyTotalVotes = 0,
    totalGroupMembers = 0,
    onRate,
    readonly = false,
    hasFamilyGroup = false,
}: PropertyRatingBadgeProps) {
    const hasMarketplaceRating = marketplaceTotalVotes > 0;
    const hasFamilyRating = hasFamilyGroup && familyTotalVotes > 0;

    // Helper para renderizar estrellas fraccionarias
    const renderFractionalStars = (val: number, size: "xs" | "sm" | "md" = "sm") => {
        const starSize = size === "xs" ? "w-2 h-2" : size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3";
        return (
            <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => {
                    const diff = val - (s - 1);
                    let fillPercent = 0;
                    if (diff >= 1) fillPercent = 100;
                    else if (diff > 0) fillPercent = diff * 100;

                    return (
                        <div key={s} className={`relative ${starSize}`}>
                            <Star className={`absolute inset-0 ${starSize} text-white/20 fill-transparent`} />
                            <div
                                className="absolute inset-0 overflow-hidden"
                                style={{ width: `${fillPercent}%` }}
                            >
                                <Star className={`${starSize} fill-yellow-400 text-yellow-400`} />
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-0.5 bg-black/70 backdrop-blur-xl p-1.5 rounded-xl border border-white/10 shadow-2xl min-w-[100px] max-w-[120px]">
            {/* 1. Calificación General (Marketplace) */}
            {hasMarketplaceRating && (
                <div className="space-y-0.5">
                    <div className="text-[7px] uppercase tracking-widest font-bold text-white/40 text-right">Calificacion Gral</div>
                    <div className="flex items-center justify-between gap-1">
                        {renderFractionalStars(marketplaceAverageRating, "xs")}
                        <span className="text-[8px] font-bold text-white/90 tabular-nums flex items-center gap-0.5">
                            <Users className="w-2 h-2 opacity-50" />
                            <span>{marketplaceTotalVotes}</span>
                        </span>
                    </div>
                </div>
            )}

            {/* 2. Tu Calificación (editable) */}
            <div className="space-y-0.5 border-t border-white/5 pt-1.5 bg-white/5 rounded -mx-0.5 px-0.5">
                <div className="text-[7px] uppercase tracking-widest font-bold text-white/40 text-right">Tu calificación</div>
                <div className="flex items-center gap-0.5">
                    {readonly ? (
                        [1, 2, 3, 4, 5].map((star) => (
                            <Star
                                key={star}
                                className={`w-3.5 h-3.5 ${star <= userVote ? "fill-yellow-400 text-yellow-400" : "text-white/20 fill-transparent"}`}
                            />
                        ))
                    ) : (
                        [1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRate?.(star);
                                }}
                                className="transition-all duration-200 transform hover:scale-125 active:scale-90"
                            >
                                <Star
                                    className={`w-3.5 h-3.5 transition-colors ${star <= userVote ? "fill-yellow-400 text-yellow-400" : "text-white/20 fill-transparent"}`}
                                />
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* 3. Calificación Familiar (solo si tiene grupo) */}
            {hasFamilyGroup && (
                <div className="space-y-0.5 border-t border-white/5 pt-1.5">
                    <div className="text-[7px] uppercase tracking-widest font-bold text-white/40 text-right">Calificacion Flia</div>
                    <div className="flex items-center justify-between gap-1">
                        {hasFamilyRating ? (
                            renderFractionalStars(familyAverageRating, "xs")
                        ) : (
                            <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <Star key={s} className="w-2 h-2 text-white/10 fill-transparent" />
                                ))}
                            </div>
                        )}
                        <span className="text-[8px] font-bold text-white/90 tabular-nums flex items-center gap-0.5">
                            <Users className="w-2 h-2 opacity-50" />
                            <span>{familyTotalVotes}/{totalGroupMembers}</span>
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}

