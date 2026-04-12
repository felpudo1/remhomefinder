import type { Property, PropertyComment, PropertyStatus } from "@/types/property";

/**
 * Opciones de orden disponibles para el listado principal del dashboard.
 */
export type ListadoSortOption = "total-asc" | "total-desc" | "newest" | "oldest";

/**
 * Firma compartida para el cambio de estado de una propiedad desde Index.
 */
export type IndexStatusChangeHandler = (
  id: string,
  status: PropertyStatus,
  deletedReason?: string,
  coordinatedDate?: string | null,
  groupId?: string | null,
  contactedName?: string,
  discardedAttributeIds?: string[],
  prosAndCons?: { positiveIds: string[]; negativeIds: string[] },
  contactedFeedback?: { interest: number; urgency: number },
  coordinatedFeedback?: {
    agentResponseSpeed: number;
    attentionQuality: number;
    appHelpScore?: number;
  },
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
  },
  metadata?: Record<string, any>
) => Promise<void>;

/**
 * Firma compartida para agregar comentarios desde los modales del dashboard.
 */
export type IndexAddCommentHandler = (
  id: string,
  comment: Omit<PropertyComment, "id" | "createdAt">
) => Promise<void>;

/**
 * Agrupa el resumen del listado que consume el header.
 */
export interface IndexHeaderListingSummary {
  selectedStatuses: PropertyStatus[];
  statusCounts: Record<PropertyStatus, number>;
  onStatusToggle: (status: PropertyStatus) => void;
}

/**
 * Acciones compartidas del usuario desde el header.
 */
export interface IndexHeaderActions {
  onOpenGroups: () => void;
  onAIProfileClick: () => void;
  onLogout: () => void;
  /** Reiniciar el tour guiado del dashboard */
  onRestartTour?: () => void;
}

/**
 * Datos del modal de detalle de propiedad.
 */
export interface IndexDetailModalState {
  selectedProperty: Property | null;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  currentUserEmail: string | null;
  currentUserDisplayName?: string | null;
}

/**
 * Estado compartido de modales del dashboard.
 */
export interface IndexModalVisibilityState {
  isAddZenRowsOpen: boolean;
  setIsAddZenRowsOpen: (open: boolean) => void;
  isAddOpen: boolean;
  setIsAddOpen: (open: boolean) => void;
  isGroupsOpen: boolean;
  setIsGroupsOpen: (open: boolean) => void;
  isUpgradeOpen: boolean;
  setIsUpgradeOpen: (open: boolean) => void;
  isPremiumWelcomeOpen: boolean;
  setIsPremiumWelcomeOpen: (open: boolean) => void;
}

/**
 * Contexto adicional para modales y acciones de Index.
 */
export interface IndexGroupContext {
  activeGroupId: string | null;
  setActiveGroupId: (id: string | null) => void;
}
