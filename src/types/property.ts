export type PropertyStatus = "contacted" | "coordinated" | "visited" | "discarded";

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
  comments: PropertyComment[];
  createdAt: Date;
}

export const STATUS_CONFIG: Record<PropertyStatus, { label: string; color: string; bg: string; dot: string }> = {
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
    color: "text-status-visited",
    bg: "bg-status-visited-bg",
    dot: "bg-status-visited",
  },
  discarded: {
    label: "Descartado",
    color: "text-status-discarded",
    bg: "bg-status-discarded-bg",
    dot: "bg-status-discarded",
  },
};
