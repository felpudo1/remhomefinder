import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ROUTES } from "@/lib/constants";
import { useSystemConfig } from "@/hooks/useSystemConfig";

export interface DiskIoHistoryPoint {
  disk_io_budget: number;
  recorded_at: string;
}

export interface SystemMetrics {
  diskIoBudget: number | null;
  diskIoSource?: "live" | "history" | "unavailable";
  diskIoLastSampleAt?: string | null;
  restRequests: number | null;
  authRequests: number | null;
  realtimeRequests: number | null;
  storageRequests: number | null;
  cpuUsage: number | null;
  ramUsedMb: number | null;
  ramTotalMb: number | null;
  dbConnections: number | null;
  timestamp: string;
  diskIoHistory: DiskIoHistoryPoint[];
}

async function fetchSystemMetrics(): Promise<SystemMetrics> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("NO_SESSION");

  const { data, error } = await supabase.functions.invoke("get-system-metrics");
  if (error) {
    const msg = error.message || "";
    if (msg.includes("401") || msg.includes("Invalid token") || msg.includes("No authorization")) {
      throw new Error("AUTH_EXPIRED");
    }
    throw new Error(msg || "Error fetching metrics");
  }
  return data as SystemMetrics;
}

export function useSystemMetrics() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { value: lowIoMinutes } = useSystemConfig("low_io_polling_minutes", "30");
  const lowIoMs = Math.max(5, Number(lowIoMinutes) || 30) * 60 * 1000;

  const query = useQuery({
    queryKey: ["system-metrics"],
    queryFn: fetchSystemMetrics,
    refetchInterval: (query) => {
      const budget = query.state.data?.diskIoBudget;
      const source = query.state.data?.diskIoSource;
      // Use configurable interval only when live metric is truly critical (≤5%)
      if (source === "live" && budget !== null && budget !== undefined && budget <= 5) return lowIoMs;
      return 60_000;
    },
    staleTime: 30_000,
    retry: (failureCount, error) => {
      if (error.message === "NO_SESSION" || error.message === "AUTH_EXPIRED") return false;
      return failureCount < 2;
    },
  });

  useEffect(() => {
    if (query.error?.message === "NO_SESSION" || query.error?.message === "AUTH_EXPIRED") {
      supabase.auth.signOut().then(() => navigate(ROUTES.AUTH));
    }
  }, [query.error, navigate]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["system-metrics"] });

  return { ...query, refresh };
}
