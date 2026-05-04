import { Property, STATUS_CONFIG } from "@/types/property";
import { formatDateTime } from "@/lib/date-utils";
import { Users, CalendarIcon } from "lucide-react";



interface PropertyCardHeaderProps {
  property: Property;
  ownerEmail?: string | null;
}

/**
 * Componente que renderiza los badges y etiquetas de estado en la parte superior
 * de la imagen de la propiedad.
 */
export function PropertyCardHeader({ property, ownerEmail }: PropertyCardHeaderProps) {
  const config = STATUS_CONFIG[property.status];

  return (
    <>
      {property.isSharedListing && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/50 text-white backdrop-blur-md">
          <Users className="w-3 h-3" />
          Compartido por {ownerEmail || property.createdByEmail}
        </span>
      )}

      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
        {config.label}
      </span>

      {property.hasUnreadComments && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-600 text-white backdrop-blur-md">
          {property.unreadCommentsCount || 0} comentario{(property.unreadCommentsCount || 0) === 1 ? "" : "s"} nuevo{(property.unreadCommentsCount || 0) === 1 ? "" : "s"}
        </span>
      )}

      {property.status === "ingresado" ? (
        <span className="inline-flex flex-col items-start px-2 py-1 rounded-lg text-[10px] bg-black/50 text-white backdrop-blur-md max-w-[200px] leading-relaxed">
          <span className="truncate w-full">por {ownerEmail || property.createdByEmail}</span>
          <span>{formatDateTime(property.createdAt)}</span>
        </span>
      ) : (
        <>
          {property.statusChangedByEmail && (
            <span className="inline-flex flex-col items-start px-2 py-1 rounded-lg text-[10px] bg-black/50 text-white backdrop-blur-md max-w-[200px] leading-relaxed">
              <span className="truncate w-full">por {property.statusChangedByEmail}</span>
              {property.statusChangedAt && <span>{formatDateTime(property.statusChangedAt)}</span>}
            </span>
          )}
          {property.status === "visita_coordinada" && (
            <>
              {property.coordinatedBy && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-black/50 text-white backdrop-blur-md">
                  Coordinado por {property.coordinatedBy}
                </span>
              )}
            </>
          )}
          {property.status === "contactado" && (
            <>
              {property.contactedBy && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-black/50 text-white backdrop-blur-md">
                  Contactado por {property.contactedBy}
                </span>
              )}
              {property.contactedName && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-black/50 text-white backdrop-blur-md">
                  Contacto: {property.contactedName}
                </span>
              )}
            </>
          )}
        </>
      )}
    </>
  );
}
