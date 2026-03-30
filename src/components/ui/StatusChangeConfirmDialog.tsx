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
  /** Clases extra en el título del header (p. ej. otro tamaño para un flujo) */
  headerTitleClassName?: string;
  /** Clases extra en la descripción del header */
  headerDescriptionClassName?: string;
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
  headerTitleClassName,
  headerDescriptionClassName,
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
          <AlertDialogTitle
            className={cn(
              "px-5 pt-3 pb-0 text-[19.2px] font-semibold leading-tight tracking-tight",
              headerTitleClassName
            )}
          >
            {title}
          </AlertDialogTitle>
          {description != null && description !== "" ? (
            <AlertDialogDescription asChild>
              <div
                className={cn(
                  "px-5 pb-0 text-[12.8px] leading-tight text-muted-foreground",
                  headerDescriptionClassName
                )}
              >
                {description}
              </div>
            </AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>
        {/*
          Los textos largos de formularios (p. ej. preguntas al descartar) no viven aquí:
          los renderiza el padre en `children` (típico: GenericStatusFeedbackDialog + labels desde BD).
        */}
        <div className="px-5 py-0.5">{children}</div>
        {/*
          Grid 1/3 + 2/3 en una sola fila también en móvil. El AlertDialogFooter base usa
          flex-col-reverse debajo de sm; display:grid pisa ese layout sin tocar alert-dialog.tsx.
        */}
        <AlertDialogFooter className="grid w-full grid-cols-3 gap-2 border-t border-border/60 bg-muted/20 px-5 py-2 sm:space-x-0">
          <AlertDialogCancel className="col-span-1 mt-0 h-10 min-w-0 rounded-xl border border-border/80 bg-background px-4 text-sm font-medium hover:bg-muted">
            {cancelLabel}
          </AlertDialogCancel>
          <Button
            type="button"
            disabled={confirmDisabled}
            className={cn(
              buttonVariants(),
              "col-span-2 h-10 min-w-0 rounded-xl px-4 text-sm font-semibold shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99]",
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
