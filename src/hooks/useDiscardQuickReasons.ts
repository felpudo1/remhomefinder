import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DiscardQuickReason {
  id: string;
  label: string;
  sort_order: number;
  is_active: boolean;
}

/**
 * Lee los motivos rápidos de descarte activos, ordenados por sort_order.
 */
export function useDiscardQuickReasons() {
  return useQuery({
    queryKey: ["discard-quick-reasons"],
    queryFn: async (): Promise<DiscardQuickReason[]> => {
      const { data, error } = await supabase
        .from("discard_quick_reasons" as any)
        .select("id, label, sort_order, is_active")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return (data || []) as unknown as DiscardQuickReason[];
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

/**
 * Lee TODOS los motivos (activos e inactivos) para el admin.
 */
export function useAllDiscardQuickReasons() {
  return useQuery({
    queryKey: ["discard-quick-reasons-all"],
    queryFn: async (): Promise<DiscardQuickReason[]> => {
      const { data, error } = await supabase
        .from("discard_quick_reasons" as any)
        .select("id, label, sort_order, is_active")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return (data || []) as unknown as DiscardQuickReason[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Mutaciones CRUD para motivos rápidos de descarte (admin).
 */
export function useDiscardQuickReasonsMutation() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["discard-quick-reasons"] });
    queryClient.invalidateQueries({ queryKey: ["discard-quick-reasons-all"] });
  };

  const createReason = async (label: string, sort_order: number) => {
    const { error } = await supabase
      .from("discard_quick_reasons" as any)
      .insert({ label, sort_order });
    if (error) throw error;
    invalidate();
  };

  const updateReason = async (id: string, updates: { label?: string; sort_order?: number; is_active?: boolean }) => {
    const { error } = await supabase
      .from("discard_quick_reasons" as any)
      .update(updates)
      .eq("id", id);
    if (error) throw error;
    invalidate();
  };

  const deleteReason = async (id: string) => {
    const { error } = await supabase
      .from("discard_quick_reasons" as any)
      .update({ is_active: false })
      .eq("id", id);
    if (error) throw error;
    invalidate();
  };

  return { createReason, updateReason, deleteReason };
}
