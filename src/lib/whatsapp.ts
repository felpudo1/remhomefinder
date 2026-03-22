/**
 * Normaliza un teléfono para wa.me: solo dígitos, sin 0 inicial erróneo
 * (ej. "0598…" → "598…", "+598 99 123 456" → "59899123456").
 */
export function normalizeWhatsAppPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  // Quitar 0 inicial (común en Uruguay/Argentina cuando se antepone al código de país)
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
