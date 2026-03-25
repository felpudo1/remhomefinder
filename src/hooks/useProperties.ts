import { PropertyStatus, PropertyComment } from "@/types/property";
import { usePropertyQueries } from "./usePropertyQueries";
import { usePropertyMutations } from "./usePropertyMutations";

/**
 * Hook de fachada (Facade) para el listado personal de propiedades del usuario.
 * Orquesta lectura (usePropertyQueries) y escritura (usePropertyMutations) sin exponer los hooks internos.
 *
 * Soporta paginación cursor-based: expone fetchNextPage / hasNextPage / isFetchingNextPage
 * para que la UI pueda implementar "cargar más" sin refetch masivo.
 */
export function useProperties() {
  const { properties, loading, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = usePropertyQueries();
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
      contactedName?: string,
      discardedAttributeIds?: string[],
      prosAndCons?: { positiveIds: string[]; negativeIds: string[] },
      contactedFeedback?: { interest: number; urgency: number },
      coordinatedFeedback?: { agentResponseSpeed: number; attentionQuality: number; appHelpScore?: number },
      discardedSurvey?: {
        overallCondition: number;
        surroundings: number;
        houseSecurity: number;
        expectedSize: number;
        photosReality: number;
      },
      metaAchievedFeedback?: {
        agentPunctuality: number;
        agentAttention: number;
        appPerformance: number;
        appSupport: number;
        appPrice: number;
      },
      closingFeedback?: {
        closePriceScore: number;
        closeConditionScore: number;
        closeSecurityScore: number;
        closeGuaranteeScore: number;
        closeMovingScore: number;
      }
    ) => updateStatus({ id, status, deletedReason, coordinatedDate, groupId, contactedName, discardedAttributeIds, prosAndCons, contactedFeedback, coordinatedFeedback, discardedSurvey, metaAchievedFeedback, closingFeedback }),
    addComment: (id: string, comment: Omit<PropertyComment, "id" | "createdAt">) =>
      addComment({ propertyId: id, comment }),
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
}
