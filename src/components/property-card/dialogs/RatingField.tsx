import React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingFieldProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  variant?: "blue" | "priority";
}

/**
 * Componente reutilizable para campos de calificación con estrellas en formularios de feedback.
 * Proporciona una interfaz consistente y animaciones suaves para las encuestas de estado.
 */
export function RatingField({ value, onChange, label, variant = "blue" }: RatingFieldProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-blue-200/70 bg-blue-50/70 px-3 py-2">
      <label className="text-sm font-medium text-blue-900 text-left leading-snug max-w-[70%]">
        {label}
      </label>
      <div className="flex items-center gap-1 shrink-0">
        {[1, 2, 3, 4, 5].map((starValue) => (
          <button
            key={`${label}-${starValue}`}
            type="button"
            onClick={() => onChange(starValue)}
            className="p-1 rounded-md hover:bg-blue-100 transition-colors"
            aria-label={`${label}: ${starValue} de 5`}
          >
            <Star
              className={cn(
                "w-5 h-5 transition-colors",
                starValue <= value ? "fill-amber-400 text-amber-400" : "text-blue-300/80"
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
