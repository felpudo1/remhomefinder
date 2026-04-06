import { Users, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { PropertyInsight } from "./agentPropertyListingTypes";

interface AgentPropertyCardsProps {
  properties: PropertyInsight[];
  selectedPropertyId: string | null;
  onSelectProperty: (propertyId: string) => void;
}

/**
 * Muestra el selector visual de propiedades para comparar actividad.
 * Ahora incluye Insights de Sentimiento (Percepción de Clientes).
 */
export function AgentPropertyCards({
  properties,
  selectedPropertyId,
  onSelectProperty,
}: AgentPropertyCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {properties.map((property) => {
        const isActive = property.publicationId === selectedPropertyId;
        
        const categories = [
          property.avgEstructural, 
          property.avgEntorno, 
          property.avgSeguridad,
          property.avgEspacios, 
          property.avgPrecio
        ].filter(s => s > 0);
        const globalScore = categories.length > 0 ? categories.reduce((a, b) => a + b, 0) / categories.length : 0;

        return (
          <button
            key={property.publicationId}
            type="button"
            onClick={() => onSelectProperty(property.publicationId)}
            className={`rounded-3xl border p-5 text-left transition-all duration-300 ${
              isActive
                ? "border-primary bg-primary/5 shadow-lg shadow-primary/5 ring-1 ring-primary/20"
                : "border-border bg-card hover:border-primary/40 hover:shadow-md"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h4 className="line-clamp-2 text-sm font-bold text-foreground leading-snug">
                  {property.title}
                </h4>
                <div className="mt-1.5 flex items-center gap-2">
                  <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-tighter">
                    {property.neighborhood}
                  </p>
                  {globalScore > 0 && (
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800/50">
                      <Star className="w-2.5 h-2.5 text-amber-600 fill-amber-600" />
                      <span className="text-[10px] font-black text-amber-700 dark:text-amber-400">{globalScore.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>
              <Badge variant="secondary" className="shrink-0 bg-secondary/50 font-bold">
                <Users className="mr-1 h-3 w-3" /> {property.usersSaved}
              </Badge>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Publicado</p>
                <p className="text-xs font-semibold">
                  {property.publishedAt
                    ? new Date(property.publishedAt).toLocaleDateString()
                    : "—"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Antigüedad</p>
                <p className="text-xs font-semibold capitalize">
                  {property.publishedAtRelative || "—"}
                </p>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-border/40">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-black uppercase text-muted-foreground/80 tracking-widest">Estado Actual</p>
              </div>
              <p className="text-[11px] font-medium text-foreground/80 line-clamp-1">
                {property.statusBreakdown || "Sin actividad todavía"}
              </p>
            </div>

            {/* Sentiment Analytics Section */}
            {property.usersSaved > 0 && (
              <div className="mt-4 pt-4 border-t border-dashed border-border/60">
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-[10px] font-black uppercase tracking-wider text-primary/80 italic">
                    Percepción Leads ({property.totalVotes || 0})
                  </p>
                  {globalScore > 0 ? (
                    <div className="flex items-center gap-1">
                      <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                      <span className="text-[10px] font-bold text-amber-600">{globalScore.toFixed(1)}</span>
                    </div>
                  ) : (
                    <span className="text-[9px] text-muted-foreground/60 italic">Sin votos aún</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                  <RatingItem label="🏗️ Estruc." score={property.avgEstructural} />
                  <RatingItem label="🌳 Entor." score={property.avgEntorno} />
                  <RatingItem label="🛡️ Segur." score={property.avgSeguridad} />
                  <RatingItem label="📐 Espac." score={property.avgEspacios} />
                  <RatingItem label="💰 Precio" score={property.avgPrecio} />
                </div>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Componente interno para mostrar cada métrica de rating
 */
function RatingItem({ label, score }: { label: string; score: number }) {
  // Solo mostramos si el score > 0 para evitar ruido visual
  if (!score || score <= 0) return (
    <div className="flex items-center justify-between opacity-40">
      <span className="text-[10px] text-muted-foreground font-medium">{label}</span>
      <span className="text-[10px] font-bold text-muted-foreground">—</span>
    </div>
  );
  
  return (
    <div className="flex items-center justify-between group">
      <span className="text-[10px] text-muted-foreground font-medium group-hover:text-foreground transition-colors">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-black text-foreground">{score.toFixed(1)}</span>
        <div className={`h-1.5 w-1.5 rounded-full shadow-sm transition-all ${
          score >= 4 ? 'bg-emerald-500 ring-2 ring-emerald-500/20' : 
          score >= 3 ? 'bg-amber-400 ring-2 ring-amber-400/20' : 
          'bg-red-500 ring-2 ring-red-500/20'
        }`} />
      </div>
    </div>
  );
}
