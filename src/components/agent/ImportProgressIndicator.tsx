import React from "react";
import { useActiveImportTask, useImportMinimized, useImportActions } from "@/store/useImportStore";
import { Loader2, CheckCircle2, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Indicador flotante de progreso de importación.
 * Aparece cuando el modal se minimiza y hay una importación activa.
 */
export const ImportProgressIndicator: React.FC = () => {
  const task = useActiveImportTask();
  const isMinimized = useImportMinimized();
  const { restore } = useImportActions();

  if (!task || !isMinimized || task.status === "completed") return null;

  const processed = task.completedLinks + task.failedLinks;
  const percent = Math.round((processed / Math.max(task.totalLinks, 1)) * 100);

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4">
      <Button
        variant="outline"
        size="sm"
        onClick={restore}
        className="bg-card shadow-lg border-primary/20 gap-2 px-4 py-2"
      >
        {task.status === "importing" ? (
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        ) : (
          <CheckCircle2 className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
        )}
        <span className="text-sm font-medium">
          Importando: {processed}/{task.totalLinks} ({percent}%)
        </span>
        <Maximize2 className="h-3.5 w-3.5 text-muted-foreground" />
      </Button>
    </div>
  );
};
