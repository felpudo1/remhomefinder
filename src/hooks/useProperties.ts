import { PropertyStatus, PropertyComment } from "@/types/property";
import { usePropertyQueries } from "./usePropertyQueries";
import { usePropertyMutations } from "./usePropertyMutations";

/**
 * Hook de fachada (Facade) para el listado personal de propiedades del usuario.
 * Orquesta lectura (usePropertyQueries) y escritura (usePropertyMutations) sin exponer los hooks internos.
 *
 * @returns Objeto con:
 *   - properties: lista de propiedades del usuario (desde Supabase, tabla properties).
 *   - loading, error: estado de la query de listado.
 *   - addProperty: agrega una propiedad (ej. tras scraping o formulario).
 *   - updateStatus(id, status, ...): actualiza estado de una propiedad (y opcionales deletedReason, coordinatedDate, groupId, contactedName).
 *   - addComment(id, comment): agrega un comentario a una propiedad.
 *   - refetch: fuerza refetch del listado.
 *
 * @example
 * const { properties, loading, addProperty, updateStatus } = useProperties();
 * await addProperty({ title: "Casa X", ... });
 * updateStatus(propId, "contacted", undefined, null, null, "Juan");
 */
export function useProperties() {
  const { properties, loading, error, refetch } = usePropertyQueries();
  const { addProperty, updateStatus, addComment } = usePropertyMutations();

  return {
    properties,
    loading,
    error,
    addProperty,
    updateStatus: (
      id: string,
      status: PropertyStatus,
      deletedReason?: string,
      coordinatedDate?: string | null,
      groupId?: string | null,
      contactedName?: string
    ) => updateStatus({ id, status, deletedReason, coordinatedDate, groupId, contactedName }),
    addComment: (id: string, comment: Omit<PropertyComment, "id" | "createdAt">) =>
      addComment({ propertyId: id, comment }),
    refetch,
  };
}
