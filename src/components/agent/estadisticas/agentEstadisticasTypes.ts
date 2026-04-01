import type { LucideIcon } from "lucide-react";
import type { StatProperty } from "@/types/admin-publications";

export interface AgentSummaryCardData {
  title: string;
  value: number;
  description: string;
  icon: LucideIcon;
  iconClassName: string;
}

export interface AgentStatsColumn {
  key: keyof StatProperty | "discardReasons";
  label: string;
  icon?: LucideIcon;
}
