export type ListingType = "rent" | "sale";

export type PropertyStatus = "ingresado" | "contactado" | "visita_coordinada" | "visitado" | "descartado" | "a_analizar" | "eliminado" | "eliminado_agencia" | "firme_candidato" | "posible_interes";

/** Estado del perfil de usuario en la plataforma (tabla profiles.status) */
export type UserStatus = "active" | "pending" | "suspended" | "rejected";

export interface PropertyComment {
  id: string;
  author: string;
  avatar: string;
  text: string;
  createdAt: Date;
}

// Soporte para configuración de botones
export type AddButtonConfig = "blue" | "white" | "both" | "none";

export interface Property {
  id: string;
  /** UUID real de la tabla properties (puede diferir del id si este es un user_listing) */
  propertyId?: string;
  url: string;
  title: string;
  priceRent: number;
  priceExpenses: number;
  totalCost: number;
  currency: string;
  neighborhood: string;
  city: string;
  sqMeters: number;
  rooms: number;
  status: PropertyStatus;
  images: string[];
  /** Fotos privadas de la familia (user_listing_attachments) */
  privateImages?: string[];
  aiSummary: string;
  createdByEmail: string;
  comments: PropertyComment[];
  createdAt: Date;
  deletedReason: string;
  deletedByEmail: string;
  discardedReason: string;
  discardedByEmail: string;
  statusChangedByEmail: string;
  statusChangedAt?: Date | null;
  coordinatedDate?: Date | null;
  /** Quién coordinó la visita (display_name del changed_by) */
  coordinatedBy?: string;
  contactedName?: string;
  /** Quién cambió el estado a contactado (display_name del changed_by) */
  contactedBy?: string;
  groupId?: string | null;
  sourceMarketplaceId?: string | null;
  marketplaceStatus?: MarketplacePropertyStatus | null;
  listingType: ListingType;
  ref: string;
  details: string;
  viewsCount?: number;
  /** True cuando el listing está compartido en un grupo (no personal) */
  isSharedListing?: boolean;
  /** True cuando hay comentarios nuevos de otros miembros para este usuario */
  hasUnreadComments?: boolean;
  /** Cantidad de comentarios no leídos de otros miembros para este usuario */
  unreadCommentsCount?: number;
}

export type MarketplacePropertyStatus = "active" | "paused" | "sold" | "reserved" | "rented" | "deleted";

export interface MarketplaceProperty {
  id: string;
  /** UUID real de la tabla properties asociada a la publicación */
  propertyId?: string;
  orgId: string;
  orgName: string;
  agentId: string;
  title: string;
  description: string;
  url: string;
  priceRent: number;
  priceExpenses: number;
  totalCost: number;
  currency: string;
  neighborhood: string;
  city: string;
  sqMeters: number;
  rooms: number;
  images: string[];
  status: MarketplacePropertyStatus;
  listingType: ListingType;
  createdAt: Date;
  updatedAt: Date;
  /** Referencia de la publicación (ej: REF-12345) */
  ref?: string;
  /** Nombre del miembro de la agencia que ingresó la publicación */
  publishedByName?: string;
}

export const STATUS_CONFIG: Record<PropertyStatus, { label: string; color: string; bg: string; dot: string }> = {
  ingresado: {
    label: "Ingresado",
    color: "text-blue-700",
    bg: "bg-blue-100",
    dot: "bg-blue-500",
  },
  contactado: {
    label: "Contactado",
    color: "text-status-contacted",
    bg: "bg-status-contacted-bg",
    dot: "bg-status-contacted",
  },
  visita_coordinada: {
    label: "Visita Coordinada",
    color: "text-status-coordinated",
    bg: "bg-status-coordinated-bg",
    dot: "bg-status-coordinated",
  },
  visitado: {
    label: "Visitado",
    color: "text-green-700",
    bg: "bg-green-100",
    dot: "bg-green-500",
  },
  descartado: {
    label: "Descartado",
    color: "text-status-discarded",
    bg: "bg-status-discarded-bg",
    dot: "bg-status-discarded",
  },
  a_analizar: {
    label: "A Analizar",
    color: "text-purple-700",
    bg: "bg-purple-100",
    dot: "bg-purple-500",
  },
  firme_candidato: {
    label: "Alta prioridad",
    color: "text-emerald-700",
    bg: "bg-emerald-100",
    dot: "bg-emerald-500",
  },
  posible_interes: {
    label: "Interesado",
    color: "text-amber-700",
    bg: "bg-amber-100",
    dot: "bg-amber-500",
  },
  eliminado: {
    label: "Eliminado",
    color: "text-gray-700",
    bg: "bg-gray-100",
    dot: "bg-gray-500",
  },
  eliminado_agencia: {
    label: "Aviso Finalizado",
    color: "text-slate-700",
    bg: "bg-slate-100",
    dot: "bg-slate-400",
  },
};
