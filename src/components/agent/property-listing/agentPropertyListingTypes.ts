import type {
  AgentPropertyInsight,
  AgentUserInsight,
} from "@/hooks/useAgentPropertyInsights";

export type StatusFilter =
  | "todos"
  | "ingresado"
  | "contactado"
  | "visita_coordinada"
  | "descartado"
  | "firme_candidato"
  | "posible_interes"
  | "meta_conseguida";

export interface ListingStatusOption {
  key: StatusFilter;
  label: string;
}

export type ListingFeedbackField = Array<{
  field_id: string;
  field_label: string;
  field_type: string;
}> | null | undefined;

export type PropertyInsight = AgentPropertyInsight;
export type UserInsight = AgentUserInsight;
