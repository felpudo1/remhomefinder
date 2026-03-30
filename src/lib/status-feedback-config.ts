import { PropertyStatus } from "@/types/property";

export type FeedbackFieldType = "rating" | "boolean" | "text" | "date" | "info";

export interface FeedbackQuestion {
  id: string;
  label: string;
  type: FeedbackFieldType;
  required?: boolean;
  placeholder?: string;
}

export interface StatusFeedbackConfig {
  title: string;
  description: string;
  questions: FeedbackQuestion[];
  confirmLabel: string;
  /** Estilos opcionales para el botón de confirmar */
  confirmClassName?: string;
}

/**
 * Configuración centralizada de feedback por estado.
 * Modificar este archivo para cambiar textos o agregar nuevos indicadores (estrellas/campos).
 */
export const STATUS_FEEDBACK_CONFIG: Partial<Record<PropertyStatus, StatusFeedbackConfig>> = {
  contactado: {
    title: "📞 Contactado",
    description: "Contanos un poco más sobre este primer contacto.",
    confirmLabel: "Confirmar contacto",
    questions: [
      { id: "contact_name", label: "Nombre de la persona contactada", type: "text", placeholder: "Ej: Juan de Inmobiliaria X" },
      { id: "contacted_interest", label: "Interés inicial", type: "rating", required: true },
      { id: "contacted_urgency", label: "Urgencia de mudanza", type: "rating", required: true },
    ],
  },
  visita_coordinada: {
    title: "🗓️ Coordinar Visita",
    description: "Agendá la visita y calificá la atención previa.",
    confirmLabel: "Coordinar visita",
    questions: [
      { id: "coordinated_date", label: "Fecha y hora", type: "date", required: true },
      { id: "coordinated_agent_response_speed", label: "Velocidad de respuesta", type: "rating", required: true },
      { id: "coordinated_attention_quality", label: "Calidad de atención inicial", type: "rating", required: true },
      { id: "coordinated_app_help_score", label: "Ayuda de la app para este paso", type: "rating" },
    ],
  },
  firme_candidato: {
    title: "🔥 Alta prioridad",
    description: "¿Por qué esta propiedad es una de tus favoritas?",
    confirmLabel: "Marcar como alta prioridad",
    questions: [
      { id: "close_price_score", label: "Relación precio/producto", type: "rating" },
      { id: "close_condition_score", label: "Estado general", type: "rating" },
      { id: "close_security_score", label: "Seguridad", type: "rating" },
      { id: "close_guarantee_score", label: "Facilidad de garantía", type: "rating" },
      { id: "close_moving_score", label: "Cercanía/Mudanza", type: "rating" },
    ],
  },
  posible_interes: {
    title: "💡 Interesado",
    description: "Evaluación rápida de puntos clave.",
    confirmLabel: "Marcar como interesado",
    questions: [
      { id: "close_price_score", label: "Precio", type: "rating" },
      { id: "close_condition_score", label: "Estado", type: "rating" },
      { id: "close_security_score", label: "Seguridad", type: "rating" },
      { id: "close_guarantee_score", label: "Garantía", type: "rating" },
      { id: "close_moving_score", label: "Ubicación", type: "rating" },
    ],
  },
  meta_conseguida: {
    title: "🏆 Meta Conseguida",
    description: "¡Felicitaciones! Ayudanos con tu feedback final.",
    confirmLabel: "🎯 Confirmar meta conseguida",
    confirmClassName: "bg-blue-600 text-white hover:bg-blue-700",
    questions: [
      { id: "meta_agent_punctuality", label: "⏱️ Puntualidad del agente", type: "rating", required: true },
      { id: "meta_agent_attention", label: "🤝 Atención del agente", type: "rating", required: true },
      { id: "meta_app_performance", label: "⚙️ Funcionamiento de la app", type: "rating", required: true },
      { id: "meta_app_support", label: "🛟 Soporte de la app", type: "rating", required: true },
      { id: "meta_app_price", label: "💸 Precio de la app respecto al valor", type: "rating", required: true },
    ],
  },
  descartado: {
    title: "🗑️ Descartar propiedad",
    description: "🤔 ¿Por qué decidiste no seguir con esta opción?",
    confirmLabel: "✅ Confirmar descarte",
    questions: [
      {
        id: "reason",
        label: "✍️ Motivo principal: ¿qué te gustó y qué mejorarías?",
        type: "text",
        placeholder: "Ej: muy ruidosa, no aceptan mascotas, lejos del trabajo…",
      },
      {
        id: "discarded_overall_condition",
        label: "🏗️ Calidad estructural y conservación (acabados, humedad, techos)",
        type: "rating",
      },
      {
        id: "discarded_surroundings",
        label: "📍 Entorno (vecindario y acceso a servicios)",
        type: "rating",
      },
      {
        id: "discarded_house_security",
        label: "🔒 Seguridad en la casa (rejas, alarma, cámaras)",
        type: "rating",
      },
      {
        id: "discarded_expected_size",
        label: "📐 Dimensiones y distribución vs. lo publicado",
        type: "rating",
      },
      {
        id: "discarded_photos_reality",
        label: "🖼️ Estado real vs. fotos publicadas",
        type: "rating",
      },
      {
        id: "discarded_price_value",
        label: "💰 Costo vs. valor percibido",
        type: "rating",
      },
    ],
  },
};
