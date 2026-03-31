/**
 * =====================================================
 * PaymentMP - Hook usePayment (Genérico y Configurable)
 * =====================================================
 * 
 * Hook de React que encapsula toda la lógica de pagos.
 * Recibe la configuración como parámetro, no depende de
 * imports globales ni contextos del proyecto.
 * 
 * Uso:
 *   const { processPayment, isLoading, error } = usePayment(config);
 *   
 *   const handlePay = async () => {
 *     const result = await processPayment({
 *       amount: 1500,
 *       description: 'Mi servicio',
 *       currency: 'UYU',
 *     });
 *   };
 * =====================================================
 */

import { useState, useCallback } from 'react';
import type { PaymentConfig, PaymentData, PaymentResult, UsePaymentReturn } from '../types/payment.types';
import { PaymentService } from '../services/payment.service';
import { validateAmount, validateDescription, validateCurrency } from '../utils/payment.utils';

/**
 * Hook para procesar pagos con MercadoPago.
 * Maneja estados de carga, error y éxito internamente.
 * 
 * @param config - Configuración del módulo PaymentMP
 * @param autoRedirect - Si debe redirigir automáticamente al checkout de MP (default: true)
 * @returns Objeto con processPayment, isLoading, error, success y resetState
 * 
 * Ejemplo completo:
 *   const config = createMPConfig({ publicKey: '...', apiBaseUrl: '...' });
 *   const { processPayment, isLoading, error, success, resetState } = usePayment(config);
 * 
 *   // En un handler de formulario:
 *   const result = await processPayment({ amount: 100, description: 'Test', currency: 'UYU' });
 *   if (result.success) {
 *     console.log('Redirigiendo a MercadoPago...');
 *   }
 */
export function usePayment(config: PaymentConfig, autoRedirect: boolean = true): UsePaymentReturn {
  // --- Estado interno del hook ---
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  /**
   * Procesa un pago: valida datos, llama al backend, y opcionalmente redirige.
   * 
   * @param paymentData - Datos del pago (amount, description, currency)
   * @returns PaymentResult con el resultado de la operación
   */
  const processPayment = useCallback(
    async (paymentData: PaymentData): Promise<PaymentResult> => {
      // Resetear estado previo
      setIsLoading(true);
      setError(null);
      setSuccess(false);

      try {
        // ── Validar datos de entrada ──
        const amountError = validateAmount(paymentData.amount, config.maxAmount);
        if (amountError) {
          throw new Error(amountError);
        }

        const descriptionError = validateDescription(paymentData.description);
        if (descriptionError) {
          throw new Error(descriptionError);
        }

        const currencyError = validateCurrency(paymentData.currency || config.defaultCurrency);
        if (currencyError) {
          throw new Error(currencyError);
        }

        // ── Llamar al servicio de API ──
        const result = await PaymentService.createPayment(config, {
          ...paymentData,
          currency: paymentData.currency || config.defaultCurrency,
        });

        // ── Verificar resultado ──
        if (!result.success) {
          throw new Error(result.error || 'Error al procesar el pago');
        }

        // ── Éxito ──
        setSuccess(true);

        // Redirigir automáticamente al checkout de MercadoPago si está habilitado
        if (autoRedirect && result.redirectUrl) {
          window.location.href = result.redirectUrl;
        }

        return result;
      } catch (err) {
        // ── Error ──
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Error inesperado al procesar el pago';

        setError(errorMessage);
        console.error('[PaymentMP] Error en processPayment:', err);

        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [config, autoRedirect]
  );

  /**
   * Limpia todos los estados del hook (error, success, loading).
   * Útil para resetear el formulario y empezar de nuevo.
   */
  const resetState = useCallback(() => {
    setError(null);
    setSuccess(false);
    setIsLoading(false);
  }, []);

  return {
    processPayment,
    isLoading,
    error,
    success,
    resetState,
  };
}
