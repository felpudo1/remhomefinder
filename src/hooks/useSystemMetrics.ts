import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ROUTES } from "@/lib/constants";

export interface SystemMetrics {
  diskIoBudget: number | null;
  restRequests: number | null;
  authRequests: number | null;
  realtimeRequests: number | null;
  storageRequests: number | null;
  cpuUsage: number | null;
  ramUsedMb: number | null;
  ramTotalMb: number | null;
  dbConnections: number | null;
  timestamp: string;
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

  const query = useQuery({
    queryKey: ["system-metrics"],
    queryFn: fetchSystemMetrics,
    refetchInterval: 60_000,
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
