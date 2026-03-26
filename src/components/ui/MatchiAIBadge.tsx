import React from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MatchiAIBadgeProps {
  className?: string;
}

/**
 * Medalla distintiva para avisos encontrados por MatchiAI (REGLA 2 + Diseño Premium)
 * Diseño de medalla redonda sugerido por JP.
 */
export const MatchiAIBadge: React.FC<MatchiAIBadgeProps> = ({ className }) => {
  return (
    <div 
      className={cn(
        "relative flex items-center justify-center w-[84px] h-[84px] rounded-full",
        "bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-700",
        "border-2 border-white/40 shadow-[0_0_25px_rgba(168,85,247,0.5)]",
        "animate-in zoom-in duration-500",
        "hover:scale-110 transition-transform duration-500 select-none",
        className
      )}
    >
      {/* Efecto de brillo rotatorio en el borde */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/20 to-transparent animate-[spin_8s_linear_infinite]" />
      
      <div className="relative flex flex-col items-center justify-center text-center">
        <Sparkles className="w-[18px] h-[18px] text-yellow-300 mb-1 animate-pulse" />
        <span className="text-[12px] font-black text-white leading-none uppercase tracking-tighter">
          Matchi
        </span>
        <span className="text-[16px] font-black text-white leading-none uppercase tracking-widest">
          AI
        </span>
      </div>
      
      {/* Puntos de brillo (sparkles) */}
      <div className="absolute top-2 right-2 w-1 h-1 bg-white rounded-full blur-[0.5px] animate-pulse" />
      <div className="absolute bottom-3 left-2 w-1 h-1 bg-white rounded-full blur-[0.5px] animate-pulse delay-300" />
    </div>
  );
};
