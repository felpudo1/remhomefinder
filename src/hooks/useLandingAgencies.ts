import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type LandingAgency = {
  id: string;
  name: string;
  logo_url: string;
  carousel_row: number;
  sort_order: number;
  is_active: boolean;
};

export function useLandingAgencies() {
  return useQuery({
    queryKey: ["landing-agencies"],
    queryFn: async (): Promise<LandingAgency[]> => {
      const { data, error } = await (supabase as any)
        .from("landing_agencies")
        .select("id, name, logo_url, carousel_row, sort_order, is_active")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 30, // 30 min cache
  });
}

export function useAllLandingAgencies() {
  return useQuery({
    queryKey: ["landing-agencies-all"],
    queryFn: async (): Promise<LandingAgency[]> => {
      const { data, error } = await (supabase as any)
        .from("landing_agencies")
        .select("id, name, logo_url, carousel_row, sort_order, is_active")
        .order("carousel_row", { ascending: true })
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });
}
