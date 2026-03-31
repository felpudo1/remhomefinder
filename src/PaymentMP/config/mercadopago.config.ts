/**
 * =====================================================
 * PaymentMP - Configuración Parametrizable
 * =====================================================
 * 
 * Provee una función factory para crear la configuración
 * del módulo. NO usa import.meta.env ni process.env directamente.
 * El proyecto consumidor es quien pasa las variables.
 * 
 * Uso:
 *   const config = createMPConfig({
 *     publicKey: 'APP_USR-xxx',
 *     apiBaseUrl: 'http://localhost:3001/api',
 *   });
 * =====================================================
 */

import type { PaymentConfig, SupportedCurrency } from '../types/payment.types';

// ─────────────────────────────────────────────────────
// Constantes del módulo
// ─────────────────────────────────────────────────────

/**
 * Lista de monedas soportadas por MercadoPago.
 * Se usa para validaciones en el formulario y el backend.
 */
export const SUPPORTED_CURRENCIES: SupportedCurrency[] = [
  'ARS', 'BRL', 'CLP', 'COP', 'MXN', 'PEN', 'UYU', 'USD',
];

/**
 * Mapa de símbolos de moneda para mostrar en la UI.
 * Cada moneda tiene su símbolo visual correspondiente.
 */
export const CURRENCY_SYMBOLS: Record<SupportedCurrency, string> = {
  ARS: '$',
  BRL: 'R$',
  CLP: '$',
  COP: '$',
  MXN: '$',
  PEN: 'S/',
  UYU: '$U',
  USD: 'US$',
};

/**
 * Monto mínimo permitido para pagos en MercadoPago.
 * Aplica para todas las monedas como regla general.
 */
export const MIN_AMOUNT = 1;

/**
 * Monto máximo por defecto (1 millón).
 * Se puede sobreescribir en la configuración.
 */
export const DEFAULT_MAX_AMOUNT = 1_000_000;

// ─────────────────────────────────────────────────────
// Factory de configuración
// ─────────────────────────────────────────────────────

/**
 * Crea una configuración válida para el módulo PaymentMP.
 * Acepta overrides parciales y aplica valores por defecto sensatos.
 * 
 * @param overrides - Valores que sobreescriben los defaults
 * @returns Configuración completa lista para usar
 * 
 * Ejemplo de uso:
 *   const config = createMPConfig({
 *     publicKey: import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY,
 *     apiBaseUrl: 'http://localhost:3001/api',
 *     defaultCurrency: 'UYU',
 *   });
 */
export function createMPConfig(overrides: Partial<PaymentConfig> & Pick<PaymentConfig, 'publicKey' | 'apiBaseUrl'>): PaymentConfig {
  return {
    // --- Valores por defecto ---
    defaultCurrency: 'UYU',
    maxAmount: DEFAULT_MAX_AMOUNT,
    autoReturn: 'approved',
    backUrls: {
      success: `${typeof window !== 'undefined' ? window.location.origin : ''}/payments/success`,
      failure: `${typeof window !== 'undefined' ? window.location.origin : ''}/payments/failure`,
      pending: `${typeof window !== 'undefined' ? window.location.origin : ''}/payments/pending`,
    },

    // --- Sobreescrituras del consumidor ---
    ...overrides,
  };
}
