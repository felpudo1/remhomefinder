import { StatusChangeConfirmDialog } from "@/components/ui/StatusChangeConfirmDialog";
import { RatingField } from "./RatingField";
import { Input } from "@/components/ui/input";
import { toDatetimeLocalString } from "@/lib/date-utils";

export interface CoordinatedSurvey {
  agentResponseSpeed: number;
  attentionQuality: number;
  appHelpScore: number;
}

interface StatusCoordinatedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (date: string, survey?: CoordinatedSurvey) => void;
  propertyTitle: string;
  isEditing?: boolean;
  initialDate?: string;
  appBrandName: string;
}

/**
 * Diálogo para coordinar visitas. Permite seleccionar fecha/hora y calificar 
 * la gestión del agente (solo en la creación inicial).
 */
export function StatusCoordinatedDialog({
  open,
  onOpenChange,
  onConfirm,
  propertyTitle,
  isEditing = false,
  initialDate = "",
  appBrandName,
}: StatusCoordinatedDialogProps) {
  const [dateTime, setDateTime] = useState(initialDate);
  const [responseSpeed, setResponseSpeed] = useState(0);
  const [attentionQuality, setAttentionQuality] = useState(0);
  const [appHelpScore, setAppHelpScore] = useState(0);

  useEffect(() => {
    if (open) {
      setDateTime(initialDate);
    }
  }, [open, initialDate]);

  const resetState = () => {
    setDateTime("");
    setResponseSpeed(0);
    setAttentionQuality(0);
    setAppHelpScore(0);
  };

  const handleConfirm = () => {
    const isoDate = dateTime ? new Date(dateTime).toISOString() : "";
    onConfirm(
      isoDate,
      isEditing
        ? undefined
        : {
            agentResponseSpeed: responseSpeed,
            attentionQuality,
            appHelpScore,
          }
    );
    if (!isEditing) resetState();
  };

  const isConfirmDisabled =
    !dateTime.trim() ||
    new Date(dateTime) <= new Date() ||
    (!isEditing && (responseSpeed === 0 || attentionQuality === 0 || appHelpScore === 0));

  return (
    <StatusChangeConfirmDialog
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen && !isEditing) resetState();
      }}
      title={isEditing ? "✏️ Editar visita" : "🗓️ Coordinar visita"}
      description={
        isEditing
          ? `Actualizá solo la fecha y hora de visita para "${propertyTitle}".`
          : `Elegí la fecha y hora de visita para "${propertyTitle}" y calificá la gestión del agente ✨.`
      }
      confirmLabel={isEditing ? "Guardar nueva fecha" : "🚀 Confirmar visita"}
      confirmDisabled={isConfirmDisabled}
      confirmClassName="bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none"
      onConfirm={handleConfirm}
    >
      <div className="space-y-4 py-2">
        <label className="text-sm font-medium text-foreground text-left block">
          📅 Fecha y hora de la visita
        </label>
        <Input
          type="datetime-local"
          value={dateTime}
          onChange={(e) => setDateTime(e.target.value)}
          min={toDatetimeLocalString(new Date())}
          className="rounded-xl border-status-coordinated/40 focus-visible:ring-status-coordinated"
        />
        {!isEditing && (
          <>
            <RatingField
              value={responseSpeed}
              onChange={setResponseSpeed}
              label="⚡ ¿Cómo sentiste los tiempos de respuesta del agente?"
            />
            <RatingField
              value={attentionQuality}
              onChange={setAttentionQuality}
              label="🤝 La atención te resultó clara y amable"
            />
            <RatingField
              value={appHelpScore}
              onChange={setAppHelpScore}
              label={`🚀 ¿Cuánto te ayudó ${appBrandName} a avanzar más rápido y con menos estrés?`}
            />
          </>
        )}
      </div>
    </StatusChangeConfirmDialog>
  );
}
