/**
 * Normaliza un teléfono para wa.me:
 * - Remueve todos los caracteres no numéricos
 * - Quita ceros a la izquierda (común en Uruguay/Argentina)
 * - Devuelve solo dígitos en formato internacional
 * 
 * Ejemplos:
 * - "+598 99 123 456" → "59899123456"
 * - "0598 99 123 456" → "59899123456"
 * - "598 99 123 456" → "59899123456"
 * - "99 123 456" → "99123456" (asume código de país ya incluido)
 */
export function normalizeWhatsAppPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  // Quitar ceros iniciales (común cuando se antepone 0 al código de país)
  return digits.replace(/^0+/, "");
}

/**
 * Genera una URL wa.me con mensaje opcional prellenado.
 */
export function buildWhatsAppUrl(phoneRaw: string, message?: string): string {
  const phone = normalizeWhatsAppPhone(phoneRaw);
  const textQuery = message?.trim() ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${phone}${textQuery}`;
}

/**
 * Genera la URL de WhatsApp para contactar a soporte desde el modal post-registro.
 */
export function buildSupportWhatsappUrl(
  supportPhone: string,
  userName: string,
  userId: string,
): string {
  const body = `Soporte. Soy ${userName} (usuario registrado) con UserID ${userId}. Estoy teniendo problemas con el registro. Quiero ya sumergirme en la app para encontrar la casa de mis sueños.`;
  return buildWhatsAppUrl(supportPhone, body);
}

/**
 * Extrae solo los dígitos de un teléfono (sin prefijo internacional).
 * Útil para validar o formatear números.
 */
export function extractPhoneDigits(raw: string): string {
  return raw.replace(/\D/g, "");
}

/**
 * Detecta si un teléfono es un celular (con WhatsApp probable) o un fijo.
 * Heurística enfocada en Uruguay (+598):
 *  - Celulares UY: 9XXXXXXX (8 dígitos, empieza con 9)
 *  - Fijos UY: 2XXXXXXX (Montevideo) o 4XXXXXXX (interior)
 * Para números de otros países asumimos celular (no bloqueamos WhatsApp).
 */
export function isMobilePhone(raw: string): boolean {
  const digits = normalizeWhatsAppPhone(raw);
  if (!digits) return false;
  // Quitar prefijo país 598 si está presente
  const local = digits.startsWith("598") ? digits.slice(3) : digits;
  // Si parece UY (8 dígitos locales), distinguir por primer dígito
  if (local.length === 8) {
    return local.startsWith("9");
  }
  // Otros largos: asumimos celular para no romper números internacionales
  return true;
}

/**
 * Valida si un teléfono tiene formato internacional válido.
 * Requiere mínimo 8 dígitos y solo caracteres numéricos.
 */
export function isValidInternationalPhone(phone: string): boolean {
  const digits = extractPhoneDigits(phone);
  return digits.length >= 8 && /^\d+$/.test(digits);
}
