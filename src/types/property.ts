export type ListingType = "rent" | "sale";

export type PropertyStatus = "ingresado" | "contacted" | "coordinated" | "visited" | "discarded" | "a_analizar" | "eliminado";

/** Estado del perfil de usuario en la plataforma (tabla profiles.status) */
export type UserStatus = "active" | "pending" | "suspended" | "rejected";

export interface PropertyComment {
  id: string;
  author: string;
  avatar: string;
  text: string;
  createdAt: Date;
}

export interface Property {
  id: string;
  url: string;
  title: string;
  priceRent: number;
  priceExpenses: number;
  totalCost: number;
  currency: string;
  neighborhood: string;
  sqMeters: number;
  rooms: number;
  status: PropertyStatus;
  images: string[];
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
  contactedName?: string;
  groupId?: string | null;
  sourceMarketplaceId?: string | null;
  marketplaceStatus?: MarketplacePropertyStatus | null;
  listingType: ListingType;
  ref: string;
  details: string;
}

export type MarketplacePropertyStatus = "active" | "paused" | "sold" | "reserved" | "rented" | "deleted";

export interface MarketplaceProperty {
  id: string;
  agencyId: string;
  agencyName: string;
  title: string;
  description: string;
  url: string;
  priceRent: number;
  priceExpenses: number;
  totalCost: number;
  currency: string;
  neighborhood: string;
  sqMeters: number;
  rooms: number;
  images: string[];
  status: MarketplacePropertyStatus;
  listingType: ListingType;
  createdAt: Date;
  updatedAt: Date;
}

export const STATUS_CONFIG: Record<PropertyStatus, { label: string; color: string; bg: string; dot: string }> = {
  ingresado: {
    label: "Ingresado",
    color: "text-blue-700",
    bg: "bg-blue-100",
    dot: "bg-blue-500",
  },
  contacted: {
    label: "Contactado",
    color: "text-status-contacted",
    bg: "bg-status-contacted-bg",
    dot: "bg-status-contacted",
  },
  coordinated: {
    label: "Visita Coordinada",
    color: "text-status-coordinated",
    bg: "bg-status-coordinated-bg",
    dot: "bg-status-coordinated",
  },
  visited: {
    label: "Visitado",
    color: "text-green-700",
    bg: "bg-green-100",
    dot: "bg-green-500",
  },
  discarded: {
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
  eliminado: {
    label: "Eliminado",
    color: "text-gray-700",
    bg: "bg-gray-100",
    dot: "bg-gray-500",
  },
};
