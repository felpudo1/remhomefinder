/**
 * =====================================================
 * PaymentMP - Componente PaymentSuccess (Skeleton)
 * =====================================================
 * 
 * Pantalla de resultado exitoso del pago.
 * HTML nativo, sin estilos, sin react-router-dom.
 * 
 * La navegación la controla el consumidor con callbacks.
 * 
 * Uso:
 *   <PaymentSuccess
 *     onNavigateBack={() => navigate('/payments')}
 *     onNavigateHome={() => navigate('/')}
 *   />
 * =====================================================
 */

import React from 'react';
import type { PaymentResultProps } from '../types/payment.types';

/**
 * Componente que muestra el resultado exitoso de un pago.
 * 
 * @param className - Clase CSS para el contenedor raíz
 * @param onNavigateBack - Callback para volver a la página de pagos
 * @param onNavigateHome - Callback para volver al home/dashboard
 * @param title - Título custom (default: '¡Pago Exitoso!')
 * @param message - Mensaje custom (default: texto de confirmación)
 */
export const PaymentSuccess: React.FC<PaymentResultProps> = ({
  className,
  onNavigateBack,
  onNavigateHome,
  title = '¡Pago Exitoso!',
  message = 'Tu pago ha sido procesado correctamente. Recibirás una confirmación por email.',
}) => {
  return (
    <div className={className} data-payment-result="success">
      {/* Ícono de éxito (texto plano para skeleton) */}
      <div data-icon="success" role="img" aria-label="Éxito">
        ✓
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
