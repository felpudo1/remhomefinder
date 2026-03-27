import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

export interface AgentOwnPublicationNoticeProps {
  /** Nombre visible de quien ingresó el aviso */
  addedByName: string;
  /** ISO de creación (user_listings o agent_publications) */
  addedAtIso: string;
  /** Abre la publicación existente */
  onViewClick: () => void;
  /** Texto del botón (familia vs agente marketplace) */
  actionLabel?: string;
}

/**
 * Cartel azul unificado: duplicado en la misma agencia (agente) o en el listado familiar (usuario).
 */
export function AgentOwnPublicationNotice({
  addedByName,
  addedAtIso,
  onViewClick,
  actionLabel = "Hacé click para ver el aviso",
}: AgentOwnPublicationNoticeProps) {
  const formattedDate = new Date(addedAtIso).toLocaleDateString("es-UY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <div className="bg-blue-50 border border-blue-300 rounded-xl p-4 space-y-3 text-center">
      <div className="space-y-2 text-blue-900 text-center">
        <p className="text-sm font-semibold">
          <strong className="text-2xl md:text-3xl leading-tight block">
            ESTA PUBLICACIÓN YA FUE INGRESADA
          </strong>
        </p>
        <p className="text-base font-medium">
          Ingresada por <strong>{addedByName}</strong> el día <strong>{formattedDate}</strong>.
        </p>
      </div>
      <div className="flex justify-center">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-xl gap-2 border-blue-400 text-blue-800 hover:bg-blue-100"
          onClick={onViewClick}
        >
          <ExternalLink className="w-4 h-4" />
          {actionLabel}
        </Button>
      </div>
    </div>
  );
}
