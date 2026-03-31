/**
 * =====================================================
 * PaymentMP - Barrel Export (Punto de Entrada Único)
 * =====================================================
 * 
 * Importá todo lo que necesites desde este archivo:
 * 
 *   import {
 *     PaymentForm,
 *     PaymentSuccess,
 *     PaymentFailure,
 *     PaymentPending,
 *     usePayment,
 *     createMPConfig,
 *     PaymentService,
 *   } from '@/PaymentMP';
 * 
 * O si copiaste la carpeta a otro proyecto:
 *   import { ... } from './PaymentMP';
 * =====================================================
 */

// ── Tipos ──
export type {
  PaymentData,
  PaymentResult,
  PaymentConfig,
  PaymentStatus,
  SupportedCurrency,
  PaymentFormProps,
  PaymentResultProps,
  PaymentFailureProps,
  UsePaymentReturn,
  MercadoPagoPayment,
  MercadoPagoPreference,
} from './types/payment.types';

// ── Configuración ──
export {
  createMPConfig,
  SUPPORTED_CURRENCIES,
  CURRENCY_SYMBOLS,
  MIN_AMOUNT,
  DEFAULT_MAX_AMOUNT,
} from './config/mercadopago.config';

// ── Utilidades ──
export {
  validateAmount,
  validateDescription,
  validateCurrency,
  formatAmountInput,
  formatDisplayAmount,
  generateExternalReference,
} from './utils/payment.utils';

// ── Servicios ──
export { PaymentService } from './services/payment.service';

// ── Hooks ──
export { usePayment } from './hooks/usePayment';

// ── Componentes ──
export { PaymentForm } from './components/PaymentForm';
export { PaymentSuccess } from './components/PaymentSuccess';
export { PaymentFailure } from './components/PaymentFailure';
export { PaymentPending } from './components/PaymentPending';
