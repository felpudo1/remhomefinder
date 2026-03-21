import React from "react";
import { StatusChangeConfirmDialog } from "@/components/ui/StatusChangeConfirmDialog";

interface StatusCalendarOfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  calendarOfferDate: Date | null;
  calendarMotivationText: string;
  onConfirm: () => void;
}

/**
 * Diálogo que invita al usuario a agendar la visita en su Google Calendar.
 * Aparece proactivamente después de coordinar una visita exitosamente.
 */
export function StatusCalendarOfferDialog({
  open,
  onOpenChange,
  calendarOfferDate,
  calendarMotivationText,
  onConfirm,
}: StatusCalendarOfferDialogProps) {
  return (
    <StatusChangeConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="🏡✨ Falta menos para ver tu próximo hogar"
      description={
        <div className="space-y-3">
          <p>{calendarMotivationText}</p>
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
