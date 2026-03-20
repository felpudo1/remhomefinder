import * as React from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Indica si el valor parece una Promise (para saber si el padre cierra el modal al terminar).
 */
function isPromiseLike(value: unknown): value is Promise<unknown> {
  return value != null && typeof (value as Promise<unknown>).then === "function";
}

export interface StatusChangeConfirmDialogProps {
  /** Si el diálogo está visible */
  open: boolean;
  /** Radix: al cerrar (cancelar, overlay o tras confirmar sync) */
  onOpenChange: (open: boolean) => void;
  /** Título del modal */
  title: string;
  /** Texto o contenido bajo el título (se envuelve para accesibilidad) */
  description?: React.ReactNode;
  /** Cuerpo extra: inputs, listas, etc. */
  children?: React.ReactNode;
  /** Etiqueta del botón cancelar */
  cancelLabel?: string;
  /** Etiqueta del botón principal */
  confirmLabel: string;
  /** Clases del botón confirmar (colores por flujo: destructivo, estado, etc.) */
  confirmClassName?: string;
  /** Deshabilita el botón confirmar (validaciones en el padre) */
  confirmDisabled?: boolean;
  /**
   * Al hacer clic en confirmar.
   * Si devuelve una Promise, no se llama onOpenChange(false) aquí: el padre suele cerrar tras el await.
   * Si es síncrono, se cierra el diálogo después de ejecutar.
   */
  onConfirm: () => void | Promise<void>;
  /** className opcional en el contenedor del contenido */
  contentClassName?: string;
}

/**
 * Diálogo reutilizable para confirmar cambios de estado (propiedades u otros flujos).
 * Unifica header, descripción, cuerpo y footer con Cancelar + Confirmar.
 */
export function StatusChangeConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  cancelLabel = "Cancelar",
  confirmLabel,
  confirmClassName,
  confirmDisabled = false,
  onConfirm,
  contentClassName,
}: StatusChangeConfirmDialogProps) {
  const handleConfirm = async () => {
    try {
      const result = onConfirm();
      if (isPromiseLike(result)) {
        await result;
      } else {
        onOpenChange(false);
      }
    } catch {
      // Errores async: toast en el padre; el modal queda abierto
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        className={cn(
          "max-w-xl rounded-2xl border border-border/70 bg-background/95 p-0 shadow-2xl backdrop-blur-sm",
          contentClassName
        )}
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="px-6 pt-6 text-xl font-semibold tracking-tight">{title}</AlertDialogTitle>
          {description != null && description !== "" ? (
            <AlertDialogDescription asChild>
              <div className="px-6 pt-1 text-sm leading-relaxed text-muted-foreground">{description}</div>
            </AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>
        <div className="px-6 py-4">{children}</div>
        <AlertDialogFooter className="gap-2 border-t border-border/60 bg-muted/20 px-6 py-4">
          <AlertDialogCancel className="h-10 rounded-xl border border-border/80 bg-background px-5 text-sm font-medium hover:bg-muted">
            {cancelLabel}
          </AlertDialogCancel>
          <Button
            type="button"
            disabled={confirmDisabled}
            className={cn(
              buttonVariants(),
              "h-10 rounded-xl px-5 text-sm font-semibold shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99]",
              confirmClassName
            )}
            onClick={handleConfirm}
          >
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
