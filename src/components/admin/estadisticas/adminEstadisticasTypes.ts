import type { LucideIcon } from "lucide-react";
import type { StatProperty } from "@/types/admin-publications";

export interface StatusCount {
  label: string;
  count: number;
  color?: string;
}

export interface CategoryStats {
  total: number;
  breakdown: StatusCount[];
}

export interface Stats {
  properties: CategoryStats;
  agencies: CategoryStats;
  users: CategoryStats;
  admins: number;
}

export interface ScrapeUsageRow {
  user_id: string | null;
  user_name: string | null;
  user_email: string | null;
  total_scrapes: number;
  total_token_charged: number;
  total_success: number;
  total_failed: number;
  total_url_scrapes: number;
  total_image_scrapes: number;
  last_scrape_at: string | null;
}

export interface SummaryCardData {
  title: string;
  subtitle: string;
  totalLabel: string;
  total: number;
  icon: LucideIcon;
  iconClassName: string;
  breakdown?: StatusCount[];
}

export type StatsSortConfig = {
  key: keyof StatProperty;
  direction: "asc" | "desc";
};
