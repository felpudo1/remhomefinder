import { Badge } from "@/components/ui/badge";
import { User, Phone, Sparkles, PhoneCall } from "lucide-react";

interface MatchLeadsListProps {
  matches: {
    id: string;
    user_id: string;
    leadProfile?: {
      display_name?: string | null;
      phone?: string | null;
    } | null;
    profiles?: {
      display_name?: string | null;
      phone?: string | null;
    } | null;
  }[];
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
          const profile = match.leadProfile ?? match.profiles;
          const name = profile?.display_name?.trim() || `Usuario ${match.user_id.slice(0, 6)}`;
          const phone = profile?.phone?.trim() || "";
          const normalizedPhone = phone.replace(/\D/g, "");
          const canOpenWhatsapp = normalizedPhone.length > 0;

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
                    {phone || "Sin teléfono visible"}
                  </div>
                </div>
              </div>

              {canOpenWhatsapp ? (
                <div className="flex items-center gap-1 ml-2">
                  <a 
                    href={`https://wa.me/${normalizedPhone}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Badge 
                      variant="outline" 
                      className="bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20 text-[10px] font-bold cursor-pointer"
                    >
                      WhatsApp
                    </Badge>
                  </a>
                  <a
                    href={`tel:${phone}`}
                    onClick={(e) => e.stopPropagation()}
                    title="Llamar"
                  >
                    <Badge
                      variant="outline"
                      className="bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20 text-[10px] font-bold cursor-pointer flex items-center gap-1"
                    >
                      <PhoneCall className="w-2.5 h-2.5" />
                      Llamar
                    </Badge>
                  </a>
                </div>
              ) : (
                <Badge variant="outline" className="ml-2 text-[10px] font-bold">
                  Sin WhatsApp
                </Badge>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
