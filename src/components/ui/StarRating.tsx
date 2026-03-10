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
}: StarRatingProps) {
    const [hoverRating, setHoverRating] = useState(0);

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
            {/* Sección Tu Voto */}
            {!readonly && (
                <div className="space-y-1">
                    <div className="text-[9px] uppercase tracking-widest font-bold text-white/40 mb-1">Tu calificación</div>
                    <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
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
                        ))}
                    </div>
                </div>
            )}

            {/* Sección Promedio Familiar */}
            {(totalVotes > 0 || readonly) && (
                <div className="space-y-1 border-t border-white/5 pt-1.5">
                    <div className="text-[9px] uppercase tracking-widest font-bold text-white/40 mb-1">Promedio familiar</div>
                    <div className="flex items-center justify-between gap-2">
                        {renderFractionalStars(averageRating)}
                        <span className="text-[10px] font-bold text-white/90 tabular-nums flex items-center gap-1">
                            <Users className="w-2.5 h-2.5 opacity-50" />
                            <span>{totalVotes}/{totalGroupMembers}</span>
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
