import React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingFieldProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  variant?: "blue" | "priority";
  inline?: boolean;
}

/**
 * Componente reutilizable para campos de calificación con estrellas en formularios de feedback.
 * Proporciona una interfaz consistente y animaciones suaves para las encuestas de estado.
 * 
 * @param inline - Si es true, muestra solo las estrellas sin label ni fondo (para layout personalizado)
 */
export function RatingField({ value, onChange, label, variant = "blue", inline = false }: RatingFieldProps) {
  if (inline) {
    return (
      <div className="flex items-center justify-end gap-px">
        {[1, 2, 3, 4, 5].map((starValue) => (
          <button
            key={`star-${starValue}`}
            type="button"
            onClick={() => onChange(starValue)}
            className="rounded p-px hover:bg-blue-100/80 transition-colors"
            aria-label={`${starValue} de 5`}
          >
            <Star
              className={cn(
                "h-3 w-3 shrink-0 transition-colors sm:h-4 sm:w-4",
                starValue <= value ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"
              )}
            />
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex w-full min-w-0 flex-row items-center gap-2 rounded-xl border border-blue-200/70 bg-blue-50/70 px-3 py-2">
      <label className="min-w-0 flex-[4] text-left text-sm font-medium leading-snug text-blue-900 break-words pr-1">
        {label}
      </label>
      <div className="flex min-w-0 flex-[1] shrink-0 items-center justify-end gap-px">
        {[1, 2, 3, 4, 5].map((starValue) => (
          <button
            key={`${label}-${starValue}`}
            type="button"
            onClick={() => onChange(starValue)}
            className="rounded p-px hover:bg-blue-100 transition-colors"
            aria-label={`${label}: ${starValue} de 5`}
          >
            <Star
              className={cn(
                "h-4 w-4 shrink-0 transition-colors",
                starValue <= value ? "fill-amber-400 text-amber-400" : "text-blue-300/80"
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
