/**
 * Tracking local de "Última visita" a agencias del directorio.
 *
 * Se guarda en localStorage por usuario para no impactar la BD con ~600+
 * agencias y miles de clicks. Permite al usuario saber cuáles ya revisó
 * y evitar abrir múltiples veces la misma.
 */

const STORAGE_PREFIX = "hf_agency_visits_v1";

type VisitsMap = Record<string, number>; // key = "type:id" -> timestamp ms

function storageKey(userId: string | null | undefined): string {
  return `${STORAGE_PREFIX}:${userId || "anon"}`;
}

export function getAllVisits(userId: string | null | undefined): VisitsMap {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
}

export function getVisit(
  userId: string | null | undefined,
  agencyType: string,
  agencyId: string
): number | null {
  const all = getAllVisits(userId);
  const ts = all[`${agencyType}:${agencyId}`];
  return typeof ts === "number" ? ts : null;
}

export function markVisited(
  userId: string | null | undefined,
  agencyType: string,
  agencyId: string
): number {
  const now = Date.now();
  try {
    const all = getAllVisits(userId);
    all[`${agencyType}:${agencyId}`] = now;
    localStorage.setItem(storageKey(userId), JSON.stringify(all));
  } catch {
    // localStorage lleno o no disponible — no es crítico
  }
  return now;
}

/**
 * Formatea timestamp como "dd/mm HH:mm" en horario local.
 */
export function formatVisitTimestamp(ts: number): string {
  try {
    const d = new Date(ts);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return `${dd}/${mm} ${hh}:${mi}`;
  } catch {
    return "";
  }
}
