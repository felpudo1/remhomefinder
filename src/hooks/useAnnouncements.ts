import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/contexts/AuthProvider";
import { useUserRoles } from "@/hooks/useUserRoles";
import type { Database } from "@/integrations/supabase/types";

// ── Tipos derivados directamente de la BD (sin any) ──────────────────────

/** Tipo de retorno de la RPC get_pending_announcements */
type PendingAnnouncement =
  Database["public"]["Functions"]["get_pending_announcements"]["Returns"][number];

/** Tipo de retorno de la RPC get_all_announcements (panel admin) */
type AdminAnnouncement =
  Database["public"]["Functions"]["get_all_announcements"]["Returns"][number];

/** Tipo de retorno de la RPC get_user_announcement_history */
type AnnouncementHistoryItem =
  Database["public"]["Functions"]["get_user_announcement_history"]["Returns"][number];

// ── Constantes de caché ──────────────────────────────────────────────────

/** Clave raíz para todas las queries de anuncios */
const ANNOUNCEMENTS_QUERY_ROOT = "announcements" as const;

/**
 * staleTime largo (sesión): la query se ejecuta UNA vez por sesión.
 * No se dispara en cada navegación entre páginas (requisito de JP).
 * Se invalida manualmente al dismiss un anuncio.
 */
const PENDING_STALE_TIME = 30 * 60 * 1000; // 30 minutos — prácticamente una sesión

/**
 * Hook para obtener los anuncios PENDIENTES (no leídos) del usuario actual.
 * La lógica pesada (filtro por audiencia, left join con reads) se ejecuta
 * en la BD via la RPC `get_pending_announcements`. No filtramos en frontend.
 *
 * @returns pendingAnnouncements — lista de anuncios que el usuario aún no leyó
 * @returns dismissAnnouncement — función para marcar un anuncio como leído
 * @returns isLoading — true mientras la query inicial está en curso
 *
 * Ejemplo de uso:
 *   const { pendingAnnouncements, dismissAnnouncement } = useAnnouncements();
 *   if (pendingAnnouncements.length > 0) showModal(pendingAnnouncements[0]);
 */
export function useAnnouncements() {
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading } = useCurrentUser();
  const { data: userRoles = [] } = useUserRoles(user?.id);

  // Query Key única: solo se re-ejecuta si cambia el userId
  const queryKey = [ANNOUNCEMENTS_QUERY_ROOT, "pending", user?.id] as const;

  const {
    data: pendingAnnouncements = [],
    isLoading,
    isFetching,
  } = useQuery<PendingAnnouncement[]>({
    queryKey,
    queryFn: async () => {
      if (!user?.id || userRoles.length === 0) return [];

      // Llamada tipada a la RPC — la BD hace TODO el filtrado
      const { data, error } = await supabase.rpc("get_pending_announcements", {
        p_user_id: user.id,
        p_user_roles: userRoles as string[],
      });

      if (error) {
        console.error("Error cargando anuncios pendientes:", error);
        return [];
      }

      return data ?? [];
    },
    // Solo ejecutar si hay usuario y roles cargados
    enabled: !!user?.id && !authLoading && userRoles.length > 0,
    // Sesión-like: no re-fetch en cada navegación
    staleTime: PENDING_STALE_TIME,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  /**
   * Marca un anuncio como leído insertando en announcement_reads.
   * Luego invalida la query pendiente para actualizar la lista.
   */
  const { mutateAsync: dismissAnnouncement, isPending: isDismissing } =
    useMutation({
      mutationFn: async (announcementId: string) => {
        if (!user?.id) throw new Error("No hay usuario autenticado");

        const { error } = await supabase
          .from("announcement_reads")
          .insert({
            announcement_id: announcementId,
            user_id: user.id,
          });

        if (error) throw error;
      },
      onSuccess: () => {
        // Invalidar la query de pendientes para que se actualice
        queryClient.invalidateQueries({
          queryKey: [ANNOUNCEMENTS_QUERY_ROOT, "pending"],
        });
        // También invalidar el historial si está cacheado
        queryClient.invalidateQueries({
          queryKey: [ANNOUNCEMENTS_QUERY_ROOT, "history"],
        });
      },
    });

  return {
    pendingAnnouncements,
    dismissAnnouncement,
    isDismissing,
    isLoading: isLoading || authLoading,
    isFetching,
  };
}

/**
 * Hook para el historial de anuncios ya leídos por el usuario.
 * Se usa en el componente de historial de novedades.
 *
 * @returns history — lista de anuncios con fecha de lectura
 * @returns isLoading — true durante la carga
 */
export function useAnnouncementHistory() {
  const { user } = useCurrentUser();

  const queryKey = [ANNOUNCEMENTS_QUERY_ROOT, "history", user?.id] as const;

  const { data: history = [], isLoading } = useQuery<AnnouncementHistoryItem[]>({
    queryKey,
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase.rpc(
        "get_user_announcement_history",
        { p_user_id: user.id }
      );

      if (error) {
        console.error("Error cargando historial de anuncios:", error);
        return [];
      }

      return data ?? [];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 min
    refetchOnWindowFocus: false,
  });

  return { history, isLoading };
}

/**
 * Hook para el panel ADMIN: datos enriquecidos de todos los anuncios.
 * Incluye reads_count (cuántos usuarios leyeron cada anuncio).
 *
 * @returns announcements — todos los anuncios con count de lecturas
 * @returns isLoading — true durante la carga
 * @returns refetch — forzar recarga de datos
 */
export function useAdminAnnouncements() {
  const queryClient = useQueryClient();
  const queryKey = [ANNOUNCEMENTS_QUERY_ROOT, "admin"] as const;

  const {
    data: announcements = [],
    isLoading,
    refetch,
  } = useQuery<AdminAnnouncement[]>({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_all_announcements");

      if (error) {
        console.error("Error cargando anuncios (admin):", error);
        return [];
      }

      return data ?? [];
    },
    staleTime: 60_000, // 1 min en admin
    refetchOnWindowFocus: false,
  });

  /**
   * Invalida todas las queries de anuncios (para refrescar tras crear/editar/borrar)
   */
  const invalidateAll = () => {
    queryClient.invalidateQueries({
      queryKey: [ANNOUNCEMENTS_QUERY_ROOT],
    });
  };

  return { announcements, isLoading, refetch, invalidateAll };
}

// Re-exportar tipos para consumo externo (sin any)
export type { PendingAnnouncement, AdminAnnouncement, AnnouncementHistoryItem };
