import { Badge } from "@/components/ui/badge";
import { User, Phone, Sparkles } from "lucide-react";

interface MatchLeadsListProps {
  matches: any[];
}

/**
 * Muestra el listado de usuarios interesados (leads) que coinciden con una propiedad.
 * (REGLA 2: Refactorizado a componente independiente para mejor mantenibilidad).
 */
export const MatchLeadsList = ({ matches }: MatchLeadsListProps) => {
  if (!matches || matches.length === 0) return null;

  return (
    <div className="mt-4 pt-4 border-t border-primary/10 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-center gap-1.5 mb-3 px-1">
        <Sparkles className="w-3.5 h-3.5 text-purple-500" />
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Usuarios Interesados ({matches.length})
        </span>
      </div>
      
      <div className="grid gap-2">
        {matches.map((match, idx) => {
          const profile = match.profiles;
          const name = profile?.display_name || "Usuario interesado";
          const phone = profile?.phone || "Sin teléfono";

          return (
            <div 
              key={idx} 
              className="flex items-center justify-between p-2.5 rounded-xl bg-purple-500/5 border border-purple-500/10 hover:bg-purple-500/10 transition-colors"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="p-1.5 rounded-lg bg-white shadow-sm">
                  <User className="w-3.5 h-3.5 text-purple-500" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-foreground truncate">{name}</span>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                    <Phone className="w-2.5 h-2.5" />
                    {phone}
                  </div>
                </div>
              </div>

              <a 
                href={`https://wa.me/${phone.replace(/\D/g, '')}`} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="ml-2"
              >
                <Badge 
                  variant="outline" 
                  className="bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20 text-[10px] font-bold cursor-pointer"
                >
                  WhatsApp
                </Badge>
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
};
