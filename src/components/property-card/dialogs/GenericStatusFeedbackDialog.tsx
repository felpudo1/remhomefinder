import { useState, useEffect } from "react";
import { StatusChangeConfirmDialog } from "@/components/ui/StatusChangeConfirmDialog";
import { RatingField } from "./RatingField";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStatusFeedbackConfig } from "@/hooks/useStatusFeedbackConfig";
import { useDiscardQuickReasons } from "@/hooks/useDiscardQuickReasons";
import { PropertyStatus } from "@/types/property";
import { Loader2 } from "lucide-react";

interface GenericStatusFeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (metadata: Record<string, any>) => void;
  propertyTitle: string;
  status: PropertyStatus;
}

/**
 * Diálogo genérico que se configura dinámicamente según el estado.
 * Lee la configuración desde la base de datos (status_feedback_configs)
 * permitiendo administrar campos desde el panel de admin sin tocar código.
 */
export function GenericStatusFeedbackDialog({
  open,
  onOpenChange,
  onConfirm,
  propertyTitle,
  status,
}: GenericStatusFeedbackDialogProps) {
  // Leer configuración dinámica desde Supabase
  const { data: fields, isLoading } = useStatusFeedbackConfig(status);
  const isDescartado = status === "descartado";
  const { data: quickReasons } = useDiscardQuickReasons();
  
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [useQuickReason, setUseQuickReason] = useState(false);
  const [selectedQuickReasonId, setSelectedQuickReasonId] = useState<string>("");

  // Resetear estado cuando cambia el status o se cierra el modal
  useEffect(() => {
    if (!open) {
      setFormData({});
      setUseQuickReason(false);
      setSelectedQuickReasonId("");
    }
  }, [open, status]);

  // Mostrar loading mientras carga la configuración
  if (isLoading) {
    return (
      <StatusChangeConfirmDialog
        open={open}
        onOpenChange={onOpenChange}
        title="Cargando..."
        description="Preparando formulario de feedback"
        confirmLabel="Espere un momento"
        confirmDisabled={true}
        onConfirm={() => {}}
      >
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </StatusChangeConfirmDialog>
    );
  }

  if (!fields || fields.length === 0) {
    return (
      <StatusChangeConfirmDialog
        open={open}
        onOpenChange={onOpenChange}
        title="Sin configuración"
        description="No hay campos configurados para este estado"
        confirmLabel="Continuar"
        onConfirm={() => onConfirm({})}
      />
    );
  }

  const handleFieldChange = (id: string, value: any) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleConfirm = () => {
    const finalData = { ...formData };
    if (isDescartado && useQuickReason && selectedQuickReasonId) {
      const reason = quickReasons?.find((r) => r.id === selectedQuickReasonId);
      if (reason) {
        finalData.quick_reason_id = reason.id;
        finalData.quick_reason_label = reason.label;
      }
    }
    onConfirm(finalData);
  };

  // Validar campos requeridos — si se usa quick reason, las estrellas/texto no son obligatorios
  const quickReasonActive = isDescartado && useQuickReason && !!selectedQuickReasonId;

  const isConfirmDisabled = quickReasonActive
    ? false
    : fields.some((field) => {
        if (!field.is_required) return false;
        const val = formData[field.field_id];
        if (field.field_type === "rating") return !val || val === 0;
        if (field.field_type === "text" || field.field_type === "date") return !val || String(val).trim() === "";
        return !val;
      });

  const renderField = (field: typeof fields[0]) => {
    switch (field.field_type) {
      case "rating": {
        const ratingsDisabled = isDescartado && useQuickReason;
        return (
          <div
            key={field.field_id}
            className={`grid w-full grid-cols-[80%_20%] items-start gap-0 py-2 ${ratingsDisabled ? "opacity-40 pointer-events-none" : ""}`}
          >
            <Label className="min-w-0 text-left text-sm font-medium leading-snug text-foreground break-words pr-3 pt-0.5 cursor-pointer">
              {field.field_label}
            </Label>
            <div className="flex min-w-0 justify-end">
              <RatingField
                value={ratingsDisabled ? 0 : (formData[field.field_id] || 0)}
                onChange={(val) => { if (!ratingsDisabled) handleFieldChange(field.field_id, val); }}
                label=""
                inline={true}
              />
            </div>
          </div>
        );
      }
      case "text":
        // Motivo de descarte (y similares): texto largo en bloque, no una sola línea
        if (field.field_id === "reason") {
          return (
            <div key={field.field_id} className="min-w-0 w-full max-w-full space-y-2">
              <Label className="block text-left text-sm font-medium leading-snug text-foreground break-words">
                {field.field_label}
              </Label>
              <Textarea
                placeholder={field.placeholder || ""}
                value={formData[field.field_id] || ""}
                onChange={(e) => handleFieldChange(field.field_id, e.target.value)}
                maxLength={30}
                className="min-h-[88px] w-full max-w-full resize-y rounded-xl border-border focus-visible:ring-primary"
              />
            </div>
          );
        }
        return (
          <div key={field.field_id} className="min-w-0 w-full max-w-full space-y-2">
            {/*
              Móvil: pregunta arriba y caja de texto abajo (evita que el input salga de la pantalla).
              sm+: fila como antes.
            */}
            <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
              <Label className="block w-full min-w-0 shrink-0 text-left text-sm font-medium leading-snug text-foreground break-words sm:max-w-[45%] sm:whitespace-normal">
                {field.field_label}
              </Label>
              <Input
                placeholder={field.placeholder || ""}
                value={formData[field.field_id] || ""}
                onChange={(e) => handleFieldChange(field.field_id, e.target.value)}
                maxLength={30}
                className="h-10 w-full min-w-0 max-w-full rounded-xl border-border focus-visible:ring-primary sm:flex-1"
              />
            </div>
          </div>
        );
      case "date":
        return (
          <div key={field.field_id} className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium text-foreground whitespace-nowrap">
                {field.field_label}
              </Label>
              <Input
                type="datetime-local"
                value={formData[field.field_id] || ""}
                onChange={(e) => handleFieldChange(field.field_id, e.target.value)}
                className="rounded-xl border-border focus-visible:ring-primary flex-1"
              />
            </div>
          </div>
        );
      case "info":
        return (
          <div
            key={field.field_id}
            className="w-full min-w-0 max-w-full overflow-hidden rounded-lg border border-blue-200 bg-blue-50 p-3 sm:p-3.5"
          >
            <p className="min-w-0 text-left text-sm font-medium leading-relaxed text-blue-900 break-words hyphens-auto">
              {field.field_label}
            </p>
            {field.placeholder ? (
              <p className="mt-2 border-t border-blue-200/80 pt-2 text-left text-xs leading-relaxed text-blue-800/95">
                {field.placeholder}
              </p>
            ) : null}
          </div>
        );
      case "boolean":
        return (
          <div key={field.field_id} className="flex w-full min-w-0 items-center justify-between gap-2">
            <Label className="min-w-0 flex-1 text-left text-sm font-medium leading-snug text-foreground break-words cursor-pointer">
              {field.field_label}
            </Label>
            <Switch
              checked={formData[field.field_id] || false}
              onCheckedChange={(val) => handleFieldChange(field.field_id, val)}
            />
          </div>
        );
      default:
        return null;
    }
  };

  // Títulos y descripciones por defecto por estado
  const statusTitles: Record<PropertyStatus, string> = {
    ingresado: "📥 Ingresado",
    contactado: "📞 Contactado",
    visita_coordinada: "🗓️ Coordinar Visita",
    visitado: "✅ Visitado",
    firme_candidato: "🔥 Alta prioridad",
    posible_interes: "💡 Interesado",
    descartado: "🗑️ Descartar propiedad",
    eliminado: "🗑️ Eliminado",
    meta_conseguida: "🏆 Meta Conseguida",
    a_analizar: "🤔 A analizar",
    eliminado_agencia: "📢 Finalizado por agencia",
  };

  const statusDescriptions: Record<PropertyStatus, string> = {
    ingresado: "Propiedad recién ingresada al sistema",
    contactado: "Contanos un poco más sobre este primer contacto",
    visita_coordinada: "Agendá la visita y calificá la atención previa",
    visitado: "Propiedad visitada",
    firme_candidato: "¿Por qué esta propiedad es una de tus favoritas?",
    posible_interes: "Evaluación rápida de puntos clave",
    descartado: "",
    eliminado: "Propiedad eliminada",
    meta_conseguida: "",
    a_analizar: "Propiedad en análisis",
    eliminado_agencia: "Propiedad finalizada por la agencia",
  };

  /** Alta prioridad: header +20% respecto al tamaño base del StatusChangeConfirmDialog */
  const isAltaPrioridad = status === "descartado" || status === "firme_candidato" || status === "meta_conseguida";
  const altaPrioridadHeaderTitle = "text-[23.04px]";
  const altaPrioridadHeaderDesc = "text-[15.36px]";

  return (
    <StatusChangeConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={statusTitles[status] || "Feedback"}
      description={(statusDescriptions[status] || "").replace("{propertyTitle}", propertyTitle)}
      confirmLabel={status === "descartado" ? "✅ Mandar feedback y descartar" : "Confirmar"}
      confirmDisabled={isConfirmDisabled}
      onConfirm={handleConfirm}
      headerTitleClassName={isAltaPrioridad ? altaPrioridadHeaderTitle : undefined}
      headerDescriptionClassName={isAltaPrioridad ? altaPrioridadHeaderDesc : undefined}
    >
      <div
        className={
          status === "descartado"
            ? "min-w-0 max-w-full space-y-4 py-2"
            : "min-w-0 max-w-full space-y-5 py-2"
        }
      >
        {fields.map((field) => renderField(field))}

        {/* Motivo rápido de descarte */}
        {isDescartado && quickReasons && quickReasons.length > 0 && (
          <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
            <div className="flex items-center gap-2">
              <Switch
                id="quick-reason-toggle"
                checked={useQuickReason}
                onCheckedChange={(checked) => {
                  setUseQuickReason(checked);
                  if (!checked) {
                    setSelectedQuickReasonId("");
                  } else {
                    // Limpiar estrellas al activar motivo rápido
                    const clearedData = { ...formData };
                    fields?.forEach((f) => {
                      if (f.field_type === "rating") clearedData[f.field_id] = 0;
                    });
                    setFormData(clearedData);
                  }
                }}
                }}
              />
              <Label htmlFor="quick-reason-toggle" className="text-sm font-medium cursor-pointer">
                ⚡ Otro motivo
              </Label>
            </div>
            {useQuickReason && (
              <Select
                value={selectedQuickReasonId}
                onValueChange={setSelectedQuickReasonId}
              >
                <SelectTrigger className="w-full rounded-xl">
                  <SelectValue placeholder="Seleccioná un motivo..." />
                </SelectTrigger>
                <SelectContent>
                  {quickReasons.map((reason) => (
                    <SelectItem key={reason.id} value={reason.id}>
                      {reason.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}
      </div>
    </StatusChangeConfirmDialog>
  );
}
