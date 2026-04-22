/**
 * credibilityScore.ts
 *
 * Algoritmo para calcular el Coeficiente de Credibilidad de un usuario.
 * Evalúa si el usuario responde con criterio o rellena formularios al azar.
 *
 * Se calcula con datos cross-property (múltiples propiedades del mismo usuario).
 * Módulo puro: sin dependencias de React ni Supabase.
 */

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTES DE CONFIGURACIÓN
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Campos que representan el estado PERSONAL del usuario.
 * No deberían cambiar entre distintas propiedades.
 * La consistencia en estos campos indica criterio real.
 *
 * Clave: nombre del status en ratingsByStatus
 * Valor: field_ids a evaluar dentro de ese status
 */
const STABLE_FIELDS_BY_STATUS: Record<string, string[]> = {
  contactado: ['contacted_urgency', 'contact_urgency'],
  // Se pueden agregar más según los field_ids de status_feedback_configs
  // ej: ingresado: ['agenda', 'contact_urgency']
};

/**
 * Profundidad en el funnel de búsqueda.
 * Más alto = usuario más comprometido con la búsqueda.
 */
const FUNNEL_DEPTH: Record<string, number> = {
  ingresado: 1,
  posible_interes: 2,
  contactado: 3,
  visita_coordinada: 4,
  firme_candidato: 5,
  meta_conseguida: 6,
  descartado: 0, // Neutral — se pondera por si llegó a otras etapas antes
};

// ─────────────────────────────────────────────────────────────────────────────
// INTERFACES PÚBLICAS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Datos de una interacción del usuario con UNA propiedad.
 * Se pasa un array de estas para calcular credibilidad cross-property.
 */
export interface UserPropertyInteraction {
  /** Ratings indexados por status (viene de status_history_log.event_metadata) */
  ratingsByStatus: Record<string, any>;
  /** Estado actual del usuario en esta propiedad */
  currentStatus: string;
  /** ¿El usuario tiene teléfono registrado? */
  hasPhone: boolean;
  /** ¿El usuario tiene perfil de búsqueda configurado? */
  hasSearchProfile: boolean;
}

/** Desglose de puntajes por componente del score */
export interface CredibilityScoreDetails {
  consistencyScore: number;  // 0–40: Consistencia de campos estables
  interactionScore: number;  // 0–25: Calidad de interacciones (razones de descarte)
  profileScore: number;      // 0–20: Completitud del perfil
  funnelScore: number;       // 0–15: Profundidad en el funnel
}

/** Resultado completo del coeficiente de credibilidad */
export interface CredibilityScore {
  /** Score total de 0 a 100 */
  score: number;
  /** Etiqueta corta: "Muy confiable", "Errático", etc. */
  label: string;
  /** Emoji identificador */
  emoji: string;
  /** Clases Tailwind para el badge de color */
  colorClass: string;
  /** Comentario heurístico para el agente */
  comment: string;
  /** Desglose por componente */
  details: CredibilityScoreDetails;
  /** Cantidad de propiedades usadas para el cálculo */
  interactionsCount: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// FUNCIONES AUXILIARES PRIVADAS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcula la desviación estándar de un array de números.
 * Retorna 0 si hay menos de 2 valores (no hay suficiente señal).
 */
function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Convierte la desviación estándar de un campo estable a un puntaje de 0 a 1.
 * Menor variación = mayor puntaje.
 *
 * Ejemplo:
 *   stdDev = 0   → 1.0 (siempre puso lo mismo ✅)
 *   stdDev = 0.5 → 0.8 (casi siempre igual 🟡)
 *   stdDev > 1.5 → 0.0 (muy errático 🔴)
 */
function fieldConsistencyRatio(values: number[]): number {
  if (values.length < 2) return 1; // Sin suficiente data → no penalizar
  const sd = stdDev(values);
  if (sd === 0)    return 1.0;  // Perfectamente consistente
  if (sd <= 0.5)   return 0.8;  // Casi consistente
  if (sd <= 1.0)   return 0.5;  // Aceptable
  if (sd <= 1.5)   return 0.2;  // Inconsistente
  return 0;                      // Muy errático
}

/**
 * Retorna etiqueta, emoji y clase de color según el score total.
 */
function getCredibilityLabel(score: number): Pick<CredibilityScore, 'label' | 'emoji' | 'colorClass'> {
  if (score >= 85) return { label: 'Muy confiable',   emoji: '💎', colorClass: 'border-violet-500/50 bg-violet-500/10 text-violet-600' };
  if (score >= 65) return { label: 'Confiable',        emoji: '🟢', colorClass: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-600' };
  if (score >= 40) return { label: 'En análisis',      emoji: '🟡', colorClass: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-600' };
  if (score >= 20) return { label: 'Poco confiable',   emoji: '🟠', colorClass: 'border-orange-500/50 bg-orange-500/10 text-orange-600' };
  return               { label: 'Errático',           emoji: '🔴', colorClass: 'border-red-500/50 bg-red-500/10 text-red-600' };
}

/**
 * Genera un comentario en lenguaje natural para el agente
 * explicando los factores que más influyeron en el score.
 */
function generateComment(params: {
  stableFieldValues: Record<string, number[]>;
  totalDiscards: number;
  discardsWithReason: number;
  hasPhone: boolean;
  hasSearchProfile: boolean;
  maxFunnelDepth: number;
  interactionsCount: number;
}): string {
  const parts: string[] = [];

  // Consistencia de urgencia
  const urgencyVals = params.stableFieldValues['contacted_urgency'] ?? [];
  if (urgencyVals.length >= 2) {
    const sd = stdDev(urgencyVals);
    if (sd === 0)    parts.push('Urgencia declarada consistente en todas las propiedades');
    else if (sd > 1) parts.push('Urgencia declarada varía significativamente entre propiedades');
  }

  // Razones de descarte
  if (params.totalDiscards > 0) {
    if (params.discardsWithReason === params.totalDiscards)
      parts.push('Siempre fundamenta sus descartes');
    else if (params.discardsWithReason === 0)
      parts.push('Nunca justifica sus descartes');
    else
      parts.push(`Justifica ${params.discardsWithReason} de ${params.totalDiscards} descartes`);
  }

  // Perfil incompleto
  if (!params.hasPhone)        parts.push('Sin teléfono registrado');
  if (!params.hasSearchProfile) parts.push('Sin perfil de búsqueda configurado');

  // Profundidad en funnel
  if (params.maxFunnelDepth >= 4) parts.push('Avanza profundo en el proceso de búsqueda');
  else if (params.maxFunnelDepth <= 1) parts.push('Raramente avanza del estado inicial');

  // Datos insuficientes
  if (params.interactionsCount === 1)
    parts.push('Solo interactuó con 1 propiedad — score en construcción');

  return parts.length > 0 ? parts.join('. ') + '.' : 'Comportamiento dentro de parámetros normales.';
}

// ─────────────────────────────────────────────────────────────────────────────
// FUNCIÓN PRINCIPAL PÚBLICA
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcula el Coeficiente de Credibilidad de un usuario.
 *
 * Requiere un array con los datos de TODAS las propiedades del usuario.
 * Retorna null si no hay interacciones.
 *
 * Componentes del score:
 *   - Consistencia campos estables (0–40 pts): ¿Siempre pone lo mismo en urgencia, garantía, etc.?
 *   - Calidad de interacciones (0–25 pts):      ¿Justifica sus descartes?
 *   - Completitud del perfil (0–20 pts):        ¿Tiene teléfono y perfil de búsqueda?
 *   - Profundidad en el funnel (0–15 pts):      ¿Avanza en el proceso de búsqueda?
 *
 * Ejemplo de uso:
 *   const score = computeCredibilityScore(userInteractions);
 *   // score.score = 78, score.label = "Confiable", score.emoji = "🟢"
 */
export function computeCredibilityScore(
  interactions: UserPropertyInteraction[]
): CredibilityScore | null {
  if (interactions.length === 0) return null;

  // ── 1. CONSISTENCIA DE CAMPOS ESTABLES (0–40 pts) ────────────────────────
  // Recolectar valores de cada campo estable a través de todas las propiedades
  const stableFieldValues: Record<string, number[]> = {};

  for (const interaction of interactions) {
    for (const [status, fieldIds] of Object.entries(STABLE_FIELDS_BY_STATUS)) {
      const statusMeta = interaction.ratingsByStatus[status];
      if (!statusMeta || typeof statusMeta !== 'object') continue;

      for (const fieldId of fieldIds) {
        const val = Number(statusMeta[fieldId]);
        if (isNaN(val) || val <= 0) continue;

        // Normalizar aliases (contacted_urgency = contact_urgency)
        const key = fieldId === 'contact_urgency' ? 'contacted_urgency' : fieldId;
        if (!stableFieldValues[key]) stableFieldValues[key] = [];
        stableFieldValues[key].push(val);
      }
    }
  }

  const fieldKeys = Object.keys(stableFieldValues);
  let consistencyScore: number;

  if (fieldKeys.length === 0) {
    // Sin datos de campos estables → puntaje neutro (no hay señal suficiente)
    consistencyScore = 20;
  } else {
    const avgRatio = fieldKeys.reduce((sum, key) =>
      sum + fieldConsistencyRatio(stableFieldValues[key]), 0) / fieldKeys.length;
    consistencyScore = Math.round(avgRatio * 40);
  }

  // ── 2. CALIDAD DE INTERACCIONES (0–25 pts) ───────────────────────────────
  // Evalúa si el usuario justifica sus descartes (señal de reflexión real)
  let totalDiscards = 0;
  let discardsWithReason = 0;

  for (const interaction of interactions) {
    const discardMeta = interaction.ratingsByStatus['descartado'];
    if (!discardMeta) continue;

    totalDiscards++;
    const hasReason =
      !!(discardMeta.reason && String(discardMeta.reason).trim().length > 0) ||
      !!(discardMeta.quick_reason_label && String(discardMeta.quick_reason_label).trim().length > 0);
    if (hasReason) discardsWithReason++;
  }

  let interactionScore: number;
  if (totalDiscards === 0) {
    interactionScore = 12; // Sin descartes → puntaje neutro
  } else {
    interactionScore = Math.round((discardsWithReason / totalDiscards) * 25);
  }

  // ── 3. COMPLETITUD DEL PERFIL (0–20 pts) ─────────────────────────────────
  // Tomamos datos de la primera interacción como referencia del perfil base
  const ref = interactions[0];
  let profileScore = 0;
  if (ref.hasPhone)         profileScore += 8;
  if (ref.hasSearchProfile) profileScore += 12;

  // ── 4. PROFUNDIDAD EN EL FUNNEL (0–15 pts) ───────────────────────────────
  // El máximo estado alcanzado en TODAS las propiedades
  let maxFunnelDepth = 0;

  for (const interaction of interactions) {
    const depthCurrent = FUNNEL_DEPTH[interaction.currentStatus] ?? 0;
    if (depthCurrent > maxFunnelDepth) maxFunnelDepth = depthCurrent;

    for (const status of Object.keys(interaction.ratingsByStatus)) {
      const depth = FUNNEL_DEPTH[status] ?? 0;
      if (depth > maxFunnelDepth) maxFunnelDepth = depth;
    }
  }

  // Normalizar a 0–15 (profundidad máxima del funnel = 6)
  const funnelScore = Math.round((maxFunnelDepth / 6) * 15);

  // ── SCORE TOTAL ───────────────────────────────────────────────────────────
  const score = Math.min(100, consistencyScore + interactionScore + profileScore + funnelScore);

  const { label, emoji, colorClass } = getCredibilityLabel(score);
  const comment = generateComment({
    stableFieldValues,
    totalDiscards,
    discardsWithReason,
    hasPhone: ref.hasPhone,
    hasSearchProfile: ref.hasSearchProfile,
    maxFunnelDepth,
    interactionsCount: interactions.length,
  });

  return {
    score,
    label,
    emoji,
    colorClass,
    comment,
    details: { consistencyScore, interactionScore, profileScore, funnelScore },
    interactionsCount: interactions.length,
  };
}
