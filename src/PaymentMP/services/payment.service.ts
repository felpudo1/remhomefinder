/**
 * =====================================================
 * PaymentMP - Servicio de API Desacoplado
 * =====================================================
 * 
 * Capa de comunicación con el backend.
 * NO depende de Supabase, Axios ni ningún SDK.
 * Usa fetch nativo o un fetcher custom inyectado.
 * 
 * El consumidor puede inyectar su propio fetcher para
 * usar Supabase Edge Functions, AWS Lambda, etc.
 * =====================================================
 */

import type { PaymentConfig, PaymentData, PaymentResult } from '../types/payment.types';

// ─────────────────────────────────────────────────────
// Servicio de Pagos
// ─────────────────────────────────────────────────────

/**
 * Clase estática con métodos para comunicarse con el backend de pagos.
 * No tiene estado interno, cada método es independiente.
 */
export class PaymentService {

  /**
   * Crea una preferencia de pago llamando al backend.
   * El backend es quien habla con la API de MercadoPago.
   * 
   * @param config - Configuración del módulo (contiene apiBaseUrl y fetcher opcional)
   * @param paymentData - Datos del pago (monto, descripción, moneda)
   * @returns PaymentResult con el ID y URL de redirección, o error
   * 
   * Ejemplo:
   *   const result = await PaymentService.createPayment(config, {
   *     amount: 1500,
   *     description: 'Servicio Premium',
   *     currency: 'UYU',
   *   });
   *   
   *   if (result.success) {
   *     window.location.href = result.redirectUrl!;
   *   }
   */
  static async createPayment(
    config: PaymentConfig,
    paymentData: PaymentData
  ): Promise<PaymentResult> {
    try {
      // Usar el fetcher custom del consumidor o fetch nativo
      const fetchFn = config.fetcher || fetch;

      const response = await fetchFn(`${config.apiBaseUrl}/payments/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: paymentData.amount,
          description: paymentData.description,
          currency: paymentData.currency || config.defaultCurrency,
        }),
      });

      // Parsear la respuesta del backend
      const data = await response.json();

      // Verificar si el backend respondió con error HTTP
      if (!response.ok) {
        return {
          success: false,
          error: data.error || `Error del servidor: ${response.status}`,
        };
      }

      // Verificar la estructura de la respuesta
      if (!data.success) {
        return {
          success: false,
          error: data.error || 'Error desconocido al crear la preferencia',
        };
      }

      return {
        success: true,
        paymentId: data.paymentId,
        redirectUrl: data.redirectUrl,
      };
    } catch (error) {
      // Error de red, timeout, o excepción inesperada
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Error de conexión con el servidor de pagos';

      console.error('[PaymentMP] Error en createPayment:', error);

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Consulta la información de un pago por su ID.
   * Útil para verificar el estado después de que el usuario regresa.
   * 
   * @param config - Configuración del módulo
   * @param paymentId - ID del pago a consultar
   * @returns Datos del pago o null si no se encuentra
   */
  static async getPaymentInfo(
    config: PaymentConfig,
    paymentId: string
  ): Promise<PaymentResult> {
    try {
      const fetchFn = config.fetcher || fetch;

      const response = await fetchFn(`${config.apiBaseUrl}/payments/${paymentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return {
          success: false,
          error: data.error || 'Error al consultar el pago',
        };
      }

      return {
        success: true,
        paymentId: data.payment?.id,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Error de conexión al consultar el pago';

      console.error('[PaymentMP] Error en getPaymentInfo:', error);

      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}
