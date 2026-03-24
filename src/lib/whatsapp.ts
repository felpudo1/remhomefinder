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
 * Valida si un teléfono tiene formato internacional válido.
 * Requiere mínimo 8 dígitos y solo caracteres numéricos.
 */
export function isValidInternationalPhone(phone: string): boolean {
  const digits = extractPhoneDigits(phone);
  return digits.length >= 8 && /^\d+$/.test(digits);
}
