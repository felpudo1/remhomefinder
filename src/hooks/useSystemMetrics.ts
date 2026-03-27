import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  const { data, error } = await supabase.functions.invoke("get-system-metrics");
  if (error) throw new Error(error.message || "Error fetching metrics");
  return data as SystemMetrics;
}

export function useSystemMetrics() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["system-metrics"],
    queryFn: fetchSystemMetrics,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["system-metrics"] });

  return { ...query, refresh };
}
