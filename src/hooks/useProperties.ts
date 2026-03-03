import { PropertyStatus, PropertyComment } from "@/types/property";
import { usePropertyQueries } from "./usePropertyQueries";
import { usePropertyMutations } from "./usePropertyMutations";

/**
 * Hook de fachada (Facade Pattern) para la gestión de propiedades.
 * Orquestra la lectura y escritura delegando en hooks especializados.
 * Siguiendo la Regla 2 (Arquitectura Profesional).
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
