/**
 * =====================================================
 * PaymentMP - Utilidades de Validación y Formateo
 * =====================================================
 * 
 * Funciones puras sin dependencias externas.
 * Se usan en el formulario, el hook y el servicio.
 * =====================================================
 */

import { SUPPORTED_CURRENCIES, MIN_AMOUNT, DEFAULT_MAX_AMOUNT } from '../config/mercadopago.config';
import type { SupportedCurrency } from '../types/payment.types';

// ─────────────────────────────────────────────────────
// Validaciones
// ─────────────────────────────────────────────────────

/**
 * Valida que un monto sea un número positivo dentro del rango permitido.
 * 
 * @param amount - El monto a validar
 * @param maxAmount - Monto máximo permitido (default: 1.000.000)
 * @returns null si es válido, o un string con el mensaje de error
 * 
 * Ejemplo:
 *   validateAmount(100);       // null (válido)
 *   validateAmount(-5);        // "El monto debe ser mayor a 0"
 *   validateAmount(9999999);   // "El monto no puede exceder $1,000,000"
 */
export function validateAmount(amount: number, maxAmount: number = DEFAULT_MAX_AMOUNT): string | null {
  // Verificar que sea un número válido
  if (isNaN(amount) || !isFinite(amount)) {
    return 'El monto debe ser un número válido';
  }

  // Verificar monto mínimo
  if (amount < MIN_AMOUNT) {
    return `El monto debe ser mayor o igual a ${MIN_AMOUNT}`;
  }

  // Verificar monto máximo
  if (amount > maxAmount) {
    return `El monto no puede exceder $${maxAmount.toLocaleString()}`;
  }

  return null; // Válido
}

/**
 * Valida que una descripción no esté vacía y tenga largo razonable.
 * 
 * @param description - La descripción a validar
 * @returns null si es válida, o un string con el mensaje de error
 */
export function validateDescription(description: string): string | null {
  if (!description || description.trim().length === 0) {
    return 'La descripción es requerida';
  }

  if (description.trim().length > 256) {
    return 'La descripción no puede exceder 256 caracteres';
  }

  return null; // Válida
}

/**
 * Valida que un código de moneda sea soportado por MercadoPago.
 * 
 * @param currency - Código de moneda a validar
 * @returns null si es válida, o un string con el mensaje de error
 */
export function validateCurrency(currency: string): string | null {
  if (!SUPPORTED_CURRENCIES.includes(currency as SupportedCurrency)) {
    return `Moneda no soportada. Monedas válidas: ${SUPPORTED_CURRENCIES.join(', ')}`;
  }

  return null; // Válida
}

// ─────────────────────────────────────────────────────
// Formateo
// ─────────────────────────────────────────────────────

/**
 * Formatea un string de input para que solo contenga números y un punto decimal.
 * Útil para limpiar el input del monto en el formulario.
 * 
 * @param value - El valor raw del input del usuario
 * @returns El valor limpio con solo dígitos y un punto decimal
 * 
 * Ejemplo:
 *   formatAmountInput("abc123.45.67");  // "123.4567"
 *   formatAmountInput("$1,500.00");     // "1500.00"
 */
export function formatAmountInput(value: string): string {
  // Eliminar todo excepto dígitos y punto
  const numericValue = value.replace(/[^0-9.]/g, '');

  // Permitir solo un punto decimal
  const parts = numericValue.split('.');
  if (parts.length > 2) {
    return parts[0] + '.' + parts.slice(1).join('');
  }

  return numericValue;
}

/**
 * Formatea un número como monto con separadores de miles y 2 decimales.
 * 
 * @param amount - El monto numérico
 * @param currencySymbol - El símbolo de moneda (ej: '$U', 'US$')
 * @returns El monto formateado como string (ej: "$U 1,500.00")
 * 
 * Ejemplo:
 *   formatDisplayAmount(1500, '$U');  // "$U 1,500.00"
 *   formatDisplayAmount(0);           // "0.00"
 */
export function formatDisplayAmount(amount: number, currencySymbol?: string): string {
  const formatted = amount.toLocaleString('es-UY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (currencySymbol) {
    return `${currencySymbol} ${formatted}`;
  }

  return formatted;
}

/**
 * Genera una referencia externa única para tracking de pagos.
 * Útil para identificar transacciones en tu sistema.
 * 
 * @param prefix - Prefijo para la referencia (ej: 'CTZ', 'MYAPP')
 * @returns String único como "CTZ-1711835200000-a1b2c3d4e"
 */
export function generateExternalReference(prefix: string = 'PAY'): string {
  const timestamp = Date.now();
  const randomPart = Math.random().toString(36).substring(2, 11);
  return `${prefix}-${timestamp}-${randomPart}`;
}
