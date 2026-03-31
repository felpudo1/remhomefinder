/**
 * =====================================================
 * PaymentMP - Componente PaymentPending (Skeleton)
 * =====================================================
 * 
 * Pantalla de resultado pendiente del pago.
 * HTML nativo, sin estilos, sin react-router-dom.
 * 
 * Se muestra cuando el usuario paga con métodos que no son
 * instantáneos (transferencia bancaria, pago en efectivo, etc.)
 * 
 * Uso:
 *   <PaymentPending
 *     onNavigateBack={() => navigate('/payments')}
 *     onNavigateHome={() => navigate('/')}
 *   />
 * =====================================================
 */

import React from 'react';
import type { PaymentResultProps } from '../types/payment.types';

/**
 * Componente que muestra el estado pendiente de un pago.
 * 
 * @param className - Clase CSS para el contenedor raíz
 * @param onNavigateBack - Callback para volver a la página de pagos
 * @param onNavigateHome - Callback para volver al home/dashboard
 * @param title - Título custom (default: 'Pago Pendiente')
 * @param message - Mensaje custom (default: texto de espera)
 */
export const PaymentPending: React.FC<PaymentResultProps> = ({
  className,
  onNavigateBack,
  onNavigateHome,
  title = 'Pago Pendiente',
  message = 'Tu pago está siendo procesado. Te notificaremos cuando se complete.',
}) => {
  return (
    <div className={className} data-payment-result="pending">
      {/* Ícono de pendiente (texto plano para skeleton) */}
      <div data-icon="pending" role="img" aria-label="Pendiente">
        ⏳
      </div>

      {/* Título */}
      <h2 data-title>{title}</h2>

      {/* Mensaje */}
      <p data-message>{message}</p>

      {/* Botones de navegación */}
      <div data-actions>
        {onNavigateBack && (
          <button
            type="button"
            onClick={onNavigateBack}
            data-action="back"
          >
            Realizar Otro Pago
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
