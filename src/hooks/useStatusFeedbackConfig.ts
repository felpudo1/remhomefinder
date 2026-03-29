import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { FeedbackFieldType } from "@/lib/status-feedback-config";

/**
 * Representa un campo de configuración de feedback desde la BD
 */
export interface StatusFeedbackField {
  id: string; // UUID del registro
  field_id: string;
  field_label: string;
  field_type: FeedbackFieldType;
  is_required: boolean;
  placeholder: string | null;
  sort_order: number;
}

/**
 * Hook para leer la configuración dinámica de feedback por estado desde Supabase.
 * Reemplaza el config hardcoded en status-feedback-config.ts
 *
 * @param status - El estado para el cual obtener la configuración (ej: "contactado", "visita_coordinada")
 * @returns Campos de feedback configurados para ese estado
 */
export function useStatusFeedbackConfig(status: string | undefined) {
  return useQuery({
    queryKey: ["status-feedback-config", status],
    enabled: !!status,
    queryFn: async (): Promise<StatusFeedbackField[]> => {
      if (!status) return [];

      // Usar la función RPC para obtener configuración
      const { data, error } = await supabase
        .rpc("get_status_feedback_config", { p_status: status });

      if (error) throw error;

      // Transformar a nuestro tipo
      return (data || []).map((row: any) => ({
        id: row.id, // UUID único
        field_id: row.field_id,
        field_label: row.field_label,
        field_type: row.field_type as FeedbackFieldType,
        is_required: row.is_required,
        placeholder: row.placeholder,
        sort_order: row.sort_order,
      }));
    },
    // La configuración cambia raramente - cachear por 10 minutos
    staleTime: 10 * 60 * 1000,
    // Mantener en caché por 30 minutos
    gcTime: 30 * 60 * 1000,
  });
}

/**
 * Hook para obtener TODAS las configuraciones de todos los estados
 * Útil para el panel de administración
 */
export function useAllStatusFeedbackConfigs() {
  return useQuery({
    queryKey: ["status-feedback-configs-all"],
    queryFn: async (): Promise<Record<string, StatusFeedbackField[]>> => {
      const { data, error } = await supabase
        .from("status_feedback_configs")
        .select("*")
        .eq("is_active", true)
        .order("status", { ascending: true })
        .order("sort_order", { ascending: true });

      if (error) throw error;

      // Agrupar por status
      const configsByStatus: Record<string, StatusFeedbackField[]> = {};

      (data || []).forEach((row: any) => {
        if (!configsByStatus[row.status]) {
          configsByStatus[row.status] = [];
        }

        configsByStatus[row.status].push({
          id: row.id, // UUID único - necesario para eliminar/editar
          field_id: row.field_id,
          field_label: row.field_label,
          field_type: row.field_type as FeedbackFieldType,
          is_required: row.is_required,
          placeholder: row.placeholder,
          sort_order: row.sort_order,
        });
      });

      return configsByStatus;
    },
    // Admin puede necesitar refrescar más seguido - 5 min
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

/**
 * Hook para mutaciones: crear/actualizar/eliminar campos de configuración
 */
export function useStatusFeedbackConfigMutation() {
  const queryClient = useQueryClient();

  const createField = async (config: {
    status: string;
    field_id: string;
    field_label: string;
    field_type: FeedbackFieldType;
    is_required?: boolean;
    placeholder?: string;
    sort_order?: number;
  }) => {
    const { data, error } = await supabase
      .from("status_feedback_configs")
      .insert({
        status: config.status,
        field_id: config.field_id,
        field_label: config.field_label,
        field_type: config.field_type,
        is_required: config.is_required ?? false,
        placeholder: config.placeholder,
        sort_order: config.sort_order ?? 0,
      })
      .select()
      .single();

    if (error) throw error;

    // Invalidar caché
    queryClient.invalidateQueries({ queryKey: ["status-feedback-config"] });
    queryClient.invalidateQueries({ queryKey: ["status-feedback-configs-all"] });

    return data;
  };

  const updateField = async (id: string, updates: {
    field_label?: string;
    field_type?: FeedbackFieldType;
    is_required?: boolean;
    placeholder?: string;
    sort_order?: number;
    is_active?: boolean;
  }) => {
    const { data, error } = await supabase
      .from("status_feedback_configs")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Invalidar caché
    queryClient.invalidateQueries({ queryKey: ["status-feedback-config"] });
    queryClient.invalidateQueries({ queryKey: ["status-feedback-configs-all"] });

    return data;
  };

  const deleteField = async (id: string) => {
    // Soft delete: marcar como inactivo en lugar de eliminar
    const { error } = await supabase
      .from("status_feedback_configs")
      .update({ is_active: false })
      .eq("id", id);

    if (error) throw error;

    // Invalidar caché
    queryClient.invalidateQueries({ queryKey: ["status-feedback-config"] });
    queryClient.invalidateQueries({ queryKey: ["status-feedback-configs-all"] });
  };

  return {
    createField,
    updateField,
    deleteField,
  };
}

// Importar useQueryClient
import { useQueryClient } from "@tanstack/react-query";
