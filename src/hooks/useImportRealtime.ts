import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useActiveImportTask, useImportActions } from "@/store/useImportStore";
import { toast } from "sonner";

/**
 * Hook global que se suscribe a cambios en discovered_links vía Realtime.
 * Debe montarse en el layout principal (AgentDashboard o App) para persistir
 * entre navegaciones de pestañas.
 */
export function useImportRealtime() {
  const task = useActiveImportTask();
  const { updateProgress, setStatus } = useImportActions();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const lastToastRef = useRef<number>(0);

  useEffect(() => {
    if (!task?.taskId || task.status === "completed") return;

    // Limpiar canal previo
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channelName = `import_progress_${task.taskId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "discovered_links",
          filter: `task_id=eq.${task.taskId}`,
        },
        async () => {
          // Re-fetch conteos actualizados (un solo SELECT count agrupado)
          const { data } = await supabase
            .from("discovered_links" as any)
            .select("status")
            .eq("task_id", task.taskId)
            .eq("is_selected", true);

          if (data) {
            const completed = (data as any[]).filter((d) => d.status === "completed").length;
            const failed = (data as any[]).filter((d) => d.status === "failed").length;
            const total = (data as any[]).length;

            updateProgress(completed, failed);

            // Toast de progreso (throttled: max 1 cada 3 segundos)
            const now = Date.now();
            if (now - lastToastRef.current > 3000) {
              lastToastRef.current = now;
              toast.info(`Importación: ${completed}/${total} completadas`, {
                id: "import-progress",
                duration: 4000,
              });
            }

            // Verificar si terminó
            if (completed + failed >= total) {
              setStatus("completed");
              toast.success(
                `Importación finalizada: ${completed} exitosas, ${failed} con errores`,
                { id: "import-complete", duration: 8000 }
              );
            }
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [task?.taskId, task?.status]);
}

/**
 * Rehidrata el estado de importación tras un F5 o recarga de página.
 * Busca tareas activas (no completed) para la org del agente.
 */
export async function rehydrateImportState(orgId: string) {
  const { data: activeTasks } = await supabase
    .from("agency_discovery_tasks" as any)
    .select("id, org_id, domain_url, total_links, completed_links, failed_links, status")
    .eq("org_id", orgId)
    .in("status", ["processing", "pending"])
    .order("created_at", { ascending: false })
    .limit(1);

  if (activeTasks && activeTasks.length > 0) {
    const t = activeTasks[0] as any;

    // Recontar desde discovered_links para mayor precisión
    const { data: links } = await supabase
      .from("discovered_links" as any)
      .select("status")
      .eq("task_id", t.id)
      .eq("is_selected", true);

    const completed = links?.filter((l: any) => l.status === "completed").length || 0;
    const failed = links?.filter((l: any) => l.status === "failed").length || 0;
    const total = links?.length || t.total_links;
    const hasQueued = links?.some((l: any) => l.status === "queued" || l.status === "processing");

    return {
      taskId: t.id,
      orgId: t.org_id,
      domainUrl: t.domain_url,
      totalLinks: total,
      completedLinks: completed,
      failedLinks: failed,
      status: hasQueued ? ("importing" as const) : ("completed" as const),
    };
  }

  return null;
}
