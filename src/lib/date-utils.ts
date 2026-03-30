import { format } from "date-fns";

/**
 * Normaliza event_metadata (JSONB) si llega como objeto o string serializado.
 */
export function normalizeEventMetadata(raw: unknown): Record<string, unknown> {
  if (raw == null) return {};
  if (typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      /* ignorar */
    }
  }
  return {};
}

/**
 * Obtiene la fecha/hora de visita desde event_metadata del historial.
 * Cubre coordinated_date (canónico), camelCase y field_id distintos en config de BD,
 * y valores con formato datetime-local (YYYY-MM-DDTHH:mm).
 */
export function parseCoordinatedVisitDateFromMetadata(meta: unknown): Date | undefined {
  const m = normalizeEventMetadata(meta);
  const directKeys = [
    "coordinated_date",
    "coordinatedDate",
    "fecha_visita",
    "visit_date",
  ] as const;
  for (const k of directKeys) {
    const v = m[k];
    if (v == null || v === "") continue;
    const d = new Date(String(v));
    if (!isNaN(d.getTime())) return d;
  }
  for (const v of Object.values(m)) {
    if (typeof v !== "string") continue;
    const t = v.trim();
    if (!t) continue;
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(t)) {
      const d = new Date(t);
      if (!isNaN(d.getTime())) return d;
    }
  }
  return undefined;
}

/** 
 * Formatea una fecha para visualización amigable: dd/MM/yyyy HH:mm 
 */
export function formatDateTime(date: Date | string | number): string {
  const d = new Date(date);
  return format(d, "dd/MM/yyyy HH:mm");
}

/** 
 * Formato YYYY-MM-DDTHH:mm para input datetime-local (hora local).
 */
export function toDatetimeLocalString(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 
 * Genera URL de Google Calendar para agregar el evento. 
 * Formato: YYYYMMDDTHHmmss (local). 
 */
export function buildGoogleCalendarUrl(
  title: string,
  startDate: Date,
  details?: string,
  location?: string,
  attendees?: string[]
): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = startDate.getFullYear();
  const m = pad(startDate.getMonth() + 1);
  const d = pad(startDate.getDate());
  const h = pad(startDate.getHours());
  const min = pad(startDate.getMinutes());
  const sec = pad(startDate.getSeconds());
  
  const start = `${y}${m}${d}T${h}${min}${sec}`;
  
  // Duración por defecto: 1 hora
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
  const end = `${endDate.getFullYear()}${pad(endDate.getMonth() + 1)}${pad(endDate.getDate())}T${pad(endDate.getHours())}${pad(endDate.getMinutes())}${pad(endDate.getSeconds())}`;
  
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${start}/${end}`,
  });
  
  if (details) params.set("details", details);
  if (location) params.set("location", location);
  if (attendees && attendees.length > 0) params.set("add", attendees.join(","));
  
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
