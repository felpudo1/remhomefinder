import React, { useState, useEffect } from "react";
import { StatusChangeConfirmDialog } from "@/components/ui/StatusChangeConfirmDialog";
import { RatingField } from "./RatingField";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useStatusFeedbackConfig } from "@/hooks/useStatusFeedbackConfig";
import { PropertyStatus } from "@/types/property";
import { Loader2, Info } from "lucide-react";

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
  
  const [formData, setFormData] = useState<Record<string, any>>({});

  // Resetear estado cuando cambia el status o se cierra el modal
  useEffect(() => {
    if (!open) {
      setFormData({});
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
    onConfirm(formData);
  };

  // Validar campos requeridos
  const isConfirmDisabled = fields.some((field) => {
    if (!field.is_required) return false;
    const val = formData[field.field_id];
    if (field.field_type === "rating") return !val || val === 0;
    if (field.field_type === "text" || field.field_type === "date") return !val || String(val).trim() === "";
    return !val;
  });

  const renderField = (field: typeof fields[0]) => {
    switch (field.field_type) {
      case "rating":
        return (
          <div key={field.field_id} className="flex items-center justify-between gap-4 py-2">
            <Label className="text-sm font-medium text-foreground text-left block flex-1">
              {field.field_label}
            </Label>
            <div className="shrink-0">
              <RatingField
                value={formData[field.field_id] || 0}
                onChange={(val) => handleFieldChange(field.field_id, val)}
                label=""
                inline={true}
              />
            </div>
          </div>
        );
      case "text":
        return (
          <div key={field.field_id} className="space-y-2">
            <Label className="text-sm font-medium text-foreground text-left block">
              {field.field_label}
            </Label>
            <Input
              placeholder={field.placeholder || ""}
              value={formData[field.field_id] || ""}
              onChange={(e) => handleFieldChange(field.field_id, e.target.value)}
              className="rounded-xl border-border focus-visible:ring-primary"
            />
          </div>
        );
      case "date":
        return (
          <div key={field.field_id} className="space-y-2">
            <Label className="text-sm font-medium text-foreground text-left block">
              {field.field_label}
            </Label>
            <Input
              type="datetime-local"
              value={formData[field.field_id] || ""}
              onChange={(e) => handleFieldChange(field.field_id, e.target.value)}
              className="rounded-xl border-border focus-visible:ring-primary"
            />
          </div>
        );
      case "info":
        return (
          <div key={field.field_id} className="p-3 bg-blue-50 border border-blue-200 rounded-lg w-full">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <p className="text-sm text-blue-900 font-medium">{field.field_label}</p>
            </div>
            {field.placeholder && (
              <p className="text-xs text-blue-700 mt-1 ml-6">{field.placeholder}</p>
            )}
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
    descartado: "🗑️ Descartar Propiedad",
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
    descartado: "¿Por qué decidiste no seguir con esta opción?",
    eliminado: "Propiedad eliminada",
    meta_conseguida: "¡Felicitaciones! Ayudanos con tu feedback final",
    a_analizar: "Propiedad en análisis",
    eliminado_agencia: "Propiedad finalizada por la agencia",
  };

  return (
    <StatusChangeConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={statusTitles[status] || "Feedback"}
      description={(statusDescriptions[status] || "").replace("{propertyTitle}", propertyTitle)}
      confirmLabel="Confirmar"
      confirmDisabled={isConfirmDisabled}
      onConfirm={handleConfirm}
    >
      <div className="space-y-5 py-2">
        {fields.map((field) => renderField(field))}
      </div>
    </StatusChangeConfirmDialog>
  );
}
