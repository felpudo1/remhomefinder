import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { PropertyInsight } from "./agentPropertyListingTypes";

interface AgentPropertyCardsProps {
  properties: PropertyInsight[];
  selectedPropertyId: string | null;
  onSelectProperty: (propertyId: string) => void;
}

/**
 * Muestra el selector visual de propiedades para comparar actividad.
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

        return (
          <button
            key={property.publicationId}
            type="button"
            onClick={() => onSelectProperty(property.publicationId)}
            className={`rounded-2xl border p-4 text-left transition-all ${
              isActive
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border bg-card hover:border-primary/40"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="line-clamp-2 text-sm font-semibold text-foreground">
                  {property.title}
                </h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  {property.neighborhood}
                </p>
              </div>
              <Badge variant="secondary" className="shrink-0">
                <Users className="mr-1 h-3 w-3" /> {property.usersSaved}
              </Badge>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] text-muted-foreground">Publicado el</p>
                <p className="text-sm font-semibold">
                  {property.publishedAt
                    ? new Date(property.publishedAt).toLocaleDateString()
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Antigüedad</p>
                <p className="text-sm font-semibold capitalize">
                  {property.publishedAtRelative || "—"}
                </p>
              </div>
            </div>

            <p className="mt-3 text-[11px] text-muted-foreground">
              {property.statusBreakdown || "Sin actividad todavía"}
            </p>
          </button>
        );
      })}
    </div>
  );
}
