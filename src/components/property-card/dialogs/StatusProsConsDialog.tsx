import { useState, useEffect } from "react";
import { StatusChangeConfirmDialog } from "@/components/ui/StatusChangeConfirmDialog";
import { RatingField } from "./RatingField";

export interface ProsConsFeedback {
  closePriceScore: number;
  closeConditionScore: number;
  closeSecurityScore: number;
  closeGuaranteeScore: number;
  closeMovingScore: number;
}

interface StatusProsConsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (status: "firme_candidato" | "posible_interes", feedback: ProsConsFeedback) => void;
  propertyTitle: string;
  status: "firme_candidato" | "posible_interes" | null;
}

/**
 * Diálogo para evaluar pros y contras cuando una propiedad despierta interés.
 * Ayuda al usuario a visualizar qué tan cerca está de su objetivo mediante un scoring de 5 puntos.
 */
export function StatusProsConsDialog({
  open,
  onOpenChange,
  onConfirm,
  propertyTitle,
  status,
}: StatusProsConsDialogProps) {
  const [priceScore, setPriceScore] = useState(0);
  const [conditionScore, setConditionScore] = useState(0);
  const [securityScore, setSecurityScore] = useState(0);
  const [guaranteeScore, setGuaranteeScore] = useState(0);
  const [movingScore, setMovingScore] = useState(0);

  const resetState = () => {
    setPriceScore(0);
    setConditionScore(0);
    setSecurityScore(0);
    setGuaranteeScore(0);
    setMovingScore(0);
  };

  const handleConfirm = () => {
    if (!status) return;
    onConfirm(status, {
      closePriceScore: priceScore,
      closeConditionScore: conditionScore,
      closeSecurityScore: securityScore,
      closeGuaranteeScore: guaranteeScore,
      closeMovingScore: movingScore,
    });
    resetState();
  };

  const isConfirmDisabled =
    priceScore === 0 ||
    conditionScore === 0 ||
    securityScore === 0 ||
    guaranteeScore === 0 ||
    movingScore === 0;

  return (
    <StatusChangeConfirmDialog
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) resetState();
      }}
      title={status === "firme_candidato" ? "Alta prioridad" : "Interesado"}
      description={`✨ Queremos darte una mano proactiva para que estés cada vez más cerca de disfrutar "${propertyTitle}" como tu próximo hogar 🏡💙.`}
      confirmLabel="Confirmar"
      confirmDisabled={isConfirmDisabled}
      confirmClassName="bg-blue-600 text-white hover:bg-blue-700"
      onConfirm={handleConfirm}
      headerTitleClassName={status === "firme_candidato" ? "text-[23.04px]" : undefined}
      headerDescriptionClassName={status === "firme_candidato" ? "text-[15.36px]" : undefined}
    >
      <div className="space-y-3 py-2">
        <RatingField
          value={priceScore}
          onChange={setPriceScore}
          label="💰 ¿Considerás que la relación calidad-precio es acorde? (5 acorde)"
        />
        <RatingField
          value={conditionScore}
          onChange={setConditionScore}
          label="🏠 ¿Calificarías como bueno el estado general de la casa para avanzar? (5 bueno)"
        />
        <RatingField
          value={securityScore}
          onChange={setSecurityScore}
          label="🛡️ ¿Son suficientes y satisfactorios los elementos de seguridad de esta propiedad para poder avanzar? (5 suficientes)"
        />
        <RatingField
          value={guaranteeScore}
          onChange={setGuaranteeScore}
          label="🧾 ¿Ya tenés solucionada la garantía/crédito para lograr tu objetivo? (5 solucionado)"
        />
        <RatingField
          value={movingScore}
          onChange={setMovingScore}
          label="🚚 ¿Ya tenés cubierta la mudanza o creés que puede ser un dolor de cabeza? (5 cubierta)"
        />
      </div>
    </StatusChangeConfirmDialog>
  );
}
