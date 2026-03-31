/**
 * =====================================================
 * PaymentMP - Componente PaymentFailure (Skeleton)
 * =====================================================
 * 
 * Pantalla de resultado fallido del pago.
 * HTML nativo, sin estilos, sin react-router-dom.
 * 
 * La navegación y reintento los controla el consumidor.
 * 
 * Uso:
 *   <PaymentFailure
 *     onRetry={() => navigate('/payments')}
 *     onNavigateHome={() => navigate('/')}
 *   />
 * =====================================================
 */

import React from 'react';
import type { PaymentFailureProps } from '../types/payment.types';

/**
 * Componente que muestra el resultado fallido de un pago.
 * 
 * @param className - Clase CSS para el contenedor raíz
 * @param onNavigateBack - Callback para volver a la página de pagos
 * @param onNavigateHome - Callback para volver al home/dashboard
 * @param onRetry - Callback para reintentar el pago
 * @param title - Título custom (default: 'Pago Fallido')
 * @param message - Mensaje custom (default: texto de error)
 */
export const PaymentFailure: React.FC<PaymentFailureProps> = ({
  className,
  onNavigateBack,
  onNavigateHome,
  onRetry,
  title = 'Pago Fallido',
  message = 'El pago no pudo ser procesado. Por favor, verificá tus datos e intentá nuevamente.',
}) => {
  return (
    <div className={className} data-payment-result="failure">
      {/* Ícono de error (texto plano para skeleton) */}
      <div data-icon="failure" role="img" aria-label="Error">
        ✗
      </div>

      {/* Título */}
      <h2 data-title>{title}</h2>

      {/* Mensaje */}
      <p data-message>{message}</p>

      {/* Botones de acción */}
      <div data-actions>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            data-action="retry"
          >
            Intentar Nuevamente
          </button>
        )}

        {onNavigateBack && (
          <button
            type="button"
            onClick={onNavigateBack}
            data-action="back"
          >
            Volver a Pagos
          </button>
        )}

        {onNavigateHome && (
          <button
            type="button"
            onClick={onNavigateHome}
            data-action="home"
          >
            Volver al Inicio
          </button>
        )}
      </div>
    </div>
  );
};
