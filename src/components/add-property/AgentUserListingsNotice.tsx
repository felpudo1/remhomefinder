import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2 } from "lucide-react";

export interface AgentUserListingsNoticeProps {
  /** Cantidad de usuarios que tienen la propiedad en su listado personal */
  usersCount: number;
  /** Inserta agent_publications y cierra el flujo (mismo handler que antes) */
  onPublish: () => void;
  isPublishing?: boolean;
}

/**
 * Caso 4: la URL ya está en listados personales de usuarios; el agente puede publicarla en el marketplace HF.
 */
export function AgentUserListingsNotice({
  usersCount,
  onPublish,
  isPublishing = false,
}: AgentUserListingsNoticeProps) {
  const n = Math.max(1, usersCount);
  const headline =
    n === 1
      ? "ESTA PUBLICACIÓN YA FUE INGRESADA EN EL LISTADO PERSONAL DE 1 USUARIO"
      : `ESTA PUBLICACIÓN YA FUE INGRESADA EN EL LISTADO PERSONAL DE ${n} USUARIOS`;

  return (
    <div className="bg-blue-50 border border-blue-300 rounded-xl p-4 space-y-3 text-center">
      <div className="space-y-2 text-blue-900 text-center">
        <p className="text-sm font-semibold">
          <strong className="text-2xl md:text-3xl leading-tight block">{headline}</strong>
        </p>
        <p className="text-base font-medium">
          En el panel de control tiene toda la información. Igual debe ingresarlo en el HF market para que la
          publicación sea pública.
        </p>
      </div>
      <div className="flex justify-center">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-xl gap-2 border-blue-400 text-blue-800 hover:bg-blue-100"
          onClick={onPublish}
          disabled={isPublishing}
        >
          {isPublishing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Publicando…
            </>
          ) : (
            <>
              <ExternalLink className="w-4 h-4" />
              Publicar en HFmarketplace
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
