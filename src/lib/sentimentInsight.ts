/**
 * Generador local de insight de sentimiento para leads inmobiliarios.
 *
 * Recibe los ratings (1-5) y campos booleanos/texto que el usuario completó
 * en cada estado del embudo (Contactado, Visita Coordinada, etc.) y devuelve
 * un resumen narrativo breve + un % de match ponderado por estado.
 *
 * Esta lógica corre 100% en el cliente para evitar costos de IA por cada
 * tarjeta. El prompt global "agent_sentiment_prompt" queda definido en el
 * Admin para una futura integración con Lovable AI Gateway si se desea
 * reemplazar este motor heurístico.
 */

/** Desglose del cálculo del matchPercent para mostrar en UI */
export interface SentimentBreakdown {
  /** Promedio de todos los ratings del estado (0–5) */
  avgRating: number;
  /** Cantidad de ratings considerados */
  ratingsCount: number;
  /** Porcentaje base = avgRating / 5 × 100 */
  basePercent: number;
  /** Descripción de la fórmula principal */
  formulaLabel: string;
  /** Descripción del ajuste aplicado al porcentaje base */
  adjustmentLabel: string;
}

export interface SentimentInsight {
  summary: string;
  matchPercent: number;
  /** Desglose del cálculo para popover explicativo */
  breakdown?: SentimentBreakdown;
}

type Metadata = Record<string, unknown>;

const toNum = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const avg = (values: number[]): number => {
  const valid = values.filter((v) => v > 0);
  if (valid.length === 0) return 0;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
};

const ratingToPct = (r: number): number => Math.round((r / 5) * 100);

/**
 * Genera el insight según el estado actual.
 * Cada estado pondera distinto qué importa más.
 */
export function generateSentimentInsight(
  status: string,
  metadata: Metadata | undefined | null
): SentimentInsight | null {
  if (!metadata || typeof metadata !== "object") return null;

  const m = metadata as Metadata;

  // Recolectar todos los ratings numéricos del metadata
  const allRatings: number[] = Object.values(m)
    .map(toNum)
    .filter((n) => n >= 1 && n <= 5);

  // Texto libre (motivo de descarte, comentario, etc.)
  const textValues = Object.values(m)
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    .filter((v) => v.length > 4 && v.length < 200);

  const quickReason = (m.quick_reason_label as string | undefined)?.trim();
  const motivo = quickReason || textValues[0];

  // Valores compartidos para breakdown
  const promedio = avg(allRatings);
  const basePercent = ratingToPct(promedio);
  const ratingsCount = allRatings.length;

  switch (status) {
    case "descartado": {
      const matchPercent = ratingsCount > 0 ? Math.max(0, 30 - basePercent / 4) : 15;
      const summary = motivo
        ? `Descartado: ${motivo.slice(0, 90)}`
        : "Lead descartado sin motivo claro. Revisar feedback del usuario.";
      return {
        summary: truncateWords(summary, 15),
        matchPercent: Math.round(matchPercent),
        breakdown: {
          avgRating: promedio,
          ratingsCount,
          basePercent,
          formulaLabel: "30 − (promedio × 20%) ÷ 4",
          adjustmentLabel: "Inversamente proporcional: mayor rating = menor match al descartar",
        },
      };
    }

    case "firme_candidato": {
      const matchPercent = promedio > 0 ? Math.min(100, basePercent + 10) : 85;
      const summary = motivo
        ? `Hot lead: ${motivo.slice(0, 80)}`
        : promedio >= 4
        ? "Hot lead, alta intención y precio adecuado. Cerrar visita ya."
        : "Candidato firme con interés sostenido. Mantener contacto activo.";
      return {
        summary: truncateWords(summary, 15),
        matchPercent: Math.round(matchPercent),
        breakdown: {
          avgRating: promedio,
          ratingsCount,
          basePercent,
          formulaLabel: "Promedio de ratings × 20%",
          adjustmentLabel: promedio > 0 ? "+10% bonus por candidato firme" : "Sin ratings — valor por defecto: 85%",
        },
      };
    }

    case "posible_interes": {
      const matchPercent = promedio > 0 ? Math.round(basePercent * 0.7) : 45;
      const summary = motivo
        ? `Tibio: ${motivo.slice(0, 85)}`
        : "Lead tibio, falta info o precio para escalar el interés.";
      return {
        summary: truncateWords(summary, 15),
        matchPercent,
        breakdown: {
          avgRating: promedio,
          ratingsCount,
          basePercent,
          formulaLabel: "Promedio de ratings × 20%",
          adjustmentLabel: promedio > 0 ? "×70% (descuento por interés todavía tibio)" : "Sin ratings — valor por defecto: 45%",
        },
      };
    }

    case "contactado": {
      const matchPercent = promedio > 0 ? basePercent : 50;
      const summary = motivo
        ? `Contactado: ${motivo.slice(0, 85)}`
        : promedio >= 4
        ? "Buen primer contacto, urgencia real y perfil adecuado."
        : "Primer contacto realizado. Confirmar capacidad y timing.";
      return {
        summary: truncateWords(summary, 15),
        matchPercent,
        breakdown: {
          avgRating: promedio,
          ratingsCount,
          basePercent,
          formulaLabel: "Promedio de ratings × 20%",
          adjustmentLabel: promedio > 0 ? "Sin ajuste para este estado" : "Sin ratings — valor por defecto: 50%",
        },
      };
    }

    case "visita_coordinada": {
      const matchPercent = promedio > 0 ? Math.min(100, basePercent + 5) : 70;
      const summary = motivo
        ? `Visita: ${motivo.slice(0, 90)}`
        : "Visita agendada, alto compromiso. Preparar info clave del inmueble.";
      return {
        summary: truncateWords(summary, 15),
        matchPercent,
        breakdown: {
          avgRating: promedio,
          ratingsCount,
          basePercent,
          formulaLabel: "Promedio de ratings × 20%",
          adjustmentLabel: promedio > 0 ? "+5% bonus por visita coordinada" : "Sin ratings — valor por defecto: 70%",
        },
      };
    }

    case "meta_conseguida": {
      return {
        summary: motivo
          ? `Cerrado: ${motivo.slice(0, 90)}`
          : "Operación cerrada con éxito. Lead convertido.",
        matchPercent: 100,
        breakdown: {
          avgRating: promedio,
          ratingsCount,
          basePercent,
          formulaLabel: "Operación cerrada",
          adjustmentLabel: "Match siempre es 100% al cerrar una operación",
        },
      };
    }

    default: {
      if (promedio === 0 && !motivo) return null;
      return {
        summary: motivo
          ? truncateWords(motivo, 15)
          : `Promedio de calificación ${promedio.toFixed(1)}/5.`,
        matchPercent: ratingToPct(promedio),
        breakdown: {
          avgRating: promedio,
          ratingsCount,
          basePercent,
          formulaLabel: "Promedio de ratings × 20%",
          adjustmentLabel: "Sin ajuste",
        },
      };
    }
  }
}

function truncateWords(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text.trim();
  return words.slice(0, maxWords).join(" ") + "…";
}
