import React, { useState } from "react";
import { StatusChangeConfirmDialog } from "@/components/ui/StatusChangeConfirmDialog";
import { Textarea } from "@/components/ui/textarea";
import { RatingField } from "./RatingField";

export interface DiscardedSurvey {
  overallCondition: number;
  surroundings: number;
  houseSecurity: number;
  expectedSize: number;
  photosReality: number;
}

interface StatusDiscardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string, survey: DiscardedSurvey) => void;
  propertyTitle: string;
}

/**
 * Diálogo especializado para el descarte de una propiedad.
 * Recopila el motivo del descarte y una encuesta de satisfacción (5 estrellas) 
 * para alimentar los indicadores de calidad del sistema.
 */
export function StatusDiscardDialog({
  open,
  onOpenChange,
  onConfirm,
  propertyTitle,
}: StatusDiscardDialogProps) {
  const [reason, setReason] = useState("");
  const [overallCondition, setOverallCondition] = useState(0);
  const [surroundings, setSurroundings] = useState(0);
  const [houseSecurity, setHouseSecurity] = useState(0);
  const [expectedSize, setExpectedSize] = useState(0);
  const [photosReality, setPhotosReality] = useState(0);

  const resetState = () => {
    setReason("");
    setOverallCondition(0);
    setSurroundings(0);
    setHouseSecurity(0);
    setExpectedSize(0);
    setPhotosReality(0);
  };

  const handleConfirm = () => {
    onConfirm(reason.trim(), {
      overallCondition,
      surroundings,
      houseSecurity,
      expectedSize,
      photosReality,
    });
    resetState();
  };

  const isConfirmDisabled =
    !reason.trim() ||
    overallCondition === 0 ||
    surroundings === 0 ||
    houseSecurity === 0 ||
    expectedSize === 0 ||
    photosReality === 0;

  return (
    <StatusChangeConfirmDialog
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) resetState();
      }}
      title="💬 Antes de descartar, contanos tu experiencia"
      description={`Queremos aprender de tu visita a "${propertyTitle}" ✨. Tu feedback ayuda a mejorar las recomendaciones del Market.`}
      confirmLabel="🧡 Confirmar descarte"
      confirmDisabled={isConfirmDisabled}
      confirmClassName="bg-gradient-to-r from-rose-500 to-rose-600 text-white hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none"
      onConfirm={handleConfirm}
    >
      <div className="space-y-4 py-2">
        <label className="text-sm font-medium text-foreground text-left block">
          🧾 Motivo del descarte
        </label>
        <Textarea
          placeholder="Contanos brevemente por qué descartás esta propiedad..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="resize-none text-sm min-h-[80px] rounded-xl"
        />
        <RatingField
          value={overallCondition}
          onChange={setOverallCondition}
          label="🏠 Estado general de la propiedad"
        />
        <RatingField
          value={surroundings}
          onChange={setSurroundings}
          label="🌳 Entorno (casas linderas y barrio)"
        />
        <RatingField
          value={houseSecurity}
          onChange={setHouseSecurity}
          label="🔐 Seguridad de la casa"
        />
        <RatingField
          value={expectedSize}
          onChange={setExpectedSize}
          label="📐 El tamaño era el esperado"
        />
        <RatingField
          value={photosReality}
          onChange={setPhotosReality}
          label="📸 Las fotos mostraban la realidad"
        />
      </div>
    </StatusChangeConfirmDialog>
  );
}
