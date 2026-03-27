import React from "react";
import { StatusChangeConfirmDialog } from "@/components/ui/StatusChangeConfirmDialog";
import { formatDateTime } from "@/lib/date-utils";

interface StatusCalendarOfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  calendarOfferDate: Date | null;
  onConfirm: () => void;
}

/**
 * Diálogo que invita al usuario a agendar la visita en su Google Calendar.
 * El titular “Falta menos…” va solo en el título; el cuerpo es fecha + aviso familiar (sin repetir la frase).
 */
export function StatusCalendarOfferDialog({
  open,
  onOpenChange,
  calendarOfferDate,
  onConfirm,
}: StatusCalendarOfferDialogProps) {
  return (
    <StatusChangeConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Falta menos para ver tu próximo hogar"
      description={
        <div className="space-y-3">
          {calendarOfferDate ? (
            <p className="text-sm font-medium text-foreground">
              Visita: {formatDateTime(calendarOfferDate)}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              ¿Querés agregar la visita a tu Google Calendar?
            </p>
          )}
          <p className="text-xs text-muted-foreground italic">
            👨‍👩‍👧‍👦 Esta cita les llegará a todos los miembros del grupo familiar.
          </p>
        </div>
      }
      cancelLabel="Ahora no"
      confirmLabel="Agendar visita"
      confirmClassName="bg-blue-600 text-white hover:bg-blue-700"
      onConfirm={onConfirm}
    />
  );
}
