import { StatusChangeConfirmDialog } from "@/components/ui/StatusChangeConfirmDialog";
import { RatingField } from "./RatingField";
import { Input } from "@/components/ui/input";

export interface ContactedFeedback {
  interest: number;
  urgency: number;
}

interface StatusContactedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (name: string, feedback: ContactedFeedback) => void;
  propertyTitle: string;
}

/**
 * Diálogo para registrar el primer contacto con el anunciante.
 * Solicita el nombre de la persona contactada y califica el interés/urgencia.
 */
export function StatusContactedDialog({
  open,
  onOpenChange,
  onConfirm,
  propertyTitle,
}: StatusContactedDialogProps) {
  const [name, setName] = useState("");
  const [interest, setInterest] = useState(0);
  const [urgency, setUrgency] = useState(0);

  const resetState = () => {
    setName("");
    setInterest(0);
    setUrgency(0);
  };

  const handleConfirm = () => {
    onConfirm(name.trim(), { interest, urgency });
    resetState();
  };

  const isConfirmDisabled = !name.trim() || interest === 0 || urgency === 0;

  return (
    <StatusChangeConfirmDialog
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) resetState();
      }}
      title="📞 Registrar contacto"
      description={`Contanos con quién hablaste por "${propertyTitle}" ✨. Completá el nombre y marcá interés + urgencia para avanzar 🚀.`}
      confirmLabel="🔥 Confirmar contacto"
      confirmDisabled={isConfirmDisabled}
      confirmClassName="bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none"
      onConfirm={handleConfirm}
    >
      <div className="space-y-4 py-2">
        <label className="text-sm font-medium text-foreground text-left block">
          👤 Nombre del contacto
        </label>
        <Input
          placeholder="Ej: Juan Perez ✍️"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-xl border-status-contacted/40 focus-visible:ring-status-contacted"
        />
        <RatingField
          value={interest}
          onChange={setInterest}
          label="⭐ A primera vista, ¿qué impresión le generó la publicación?"
        />
        <RatingField
          value={urgency}
          onChange={setUrgency}
          label="⏰ ¿Qué tan urgente es su mudanza?"
        />
      </div>
    </StatusChangeConfirmDialog>
  );
}
