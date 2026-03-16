import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FeedbackAttribute {
  id: string;
  name: string;
  active: boolean;
  display_order: number;
}

/**
 * Hook para obtener los atributos de feedback (motivos de descarte) desde feedback_attributes.
 * Solo retorna los activos, ordenados por display_order.
 */
export function useFeedbackAttributes() {
  return useQuery({
    queryKey: ["feedback-attributes"],
    queryFn: async (): Promise<FeedbackAttribute[]> => {
      const { data, error } = await supabase
        .from("feedback_attributes")
        .select("id, name, active, display_order")
        .eq("active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return (data || []) as FeedbackAttribute[];
    },
  });
}
