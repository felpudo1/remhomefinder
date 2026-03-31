/**
 * =====================================================
 * PaymentMP - Componente PaymentForm (Skeleton)
 * =====================================================
 * 
 * Formulario de pago con HTML nativo.
 * Sin estilos propios (skeleton) para que el consumidor
 * aplique los suyos con className o CSS externo.
 * 
 * NO depende de shadcn/ui, Tailwind, ni ningún framework CSS.
 * 
 * Uso:
 *   <PaymentForm
 *     config={mpConfig}
 *     onSuccess={(result) => console.log(result)}
 *     onError={(err) => console.error(err)}
 *   />
 * =====================================================
 */

import React, { useState } from 'react';
import type { PaymentFormProps } from '../types/payment.types';
import { usePayment } from '../hooks/usePayment';
import { formatAmountInput } from '../utils/payment.utils';
import { CURRENCY_SYMBOLS } from '../config/mercadopago.config';

/**
 * Formulario de pago reutilizable.
 * Recopila monto y descripción, valida y envía el pago al backend.
 * 
 * @param config - Configuración de PaymentMP (requerido)
 * @param currency - Moneda a usar (override del default en config)
 * @param currencySymbol - Símbolo de moneda para la UI (se autodetecta si no se pasa)
 * @param className - Clase CSS para el contenedor raíz
 * @param onSuccess - Callback cuando el pago se crea exitosamente
 * @param onError - Callback cuando ocurre un error
 * @param autoRedirect - Si redirige automáticamente a MP (default: true)
 */
export const PaymentForm: React.FC<PaymentFormProps> = ({
  config,
  currency,
  currencySymbol,
  className,
  onSuccess,
  onError,
  autoRedirect = true,
}) => {
  // ── Estado local del formulario ──
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  // ── Hook de pago con la config inyectada ──
  const { processPayment, isLoading, error, success } = usePayment(config, autoRedirect);

  // Determinar moneda y símbolo a usar
  const activeCurrency = currency || config.defaultCurrency;
  const activeSymbol = currencySymbol || CURRENCY_SYMBOLS[activeCurrency] || '$';

  /**
   * Handler del submit del formulario.
   * Valida, procesa el pago, y llama a los callbacks.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar monto básico
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      onError?.('Por favor ingresá un monto válido');
      return;
    }

    // Procesar el pago
    const result = await processPayment({
      amount: parsedAmount,
      description: description.trim() || 'Pago',
      currency: activeCurrency,
    });

    // Llamar al callback correspondiente
    if (result.success) {
      onSuccess?.(result);
      // Limpiar formulario
      setAmount('');
      setDescription('');
    } else {
      onError?.(result.error || 'Error al procesar el pago');
    }
  };

  return (
    <div className={className} data-payment-form>
      {/* ── Formulario ── */}
      <form onSubmit={handleSubmit}>
        {/* Campo: Monto */}
        <div data-field="amount">
          <label htmlFor="payment-amount">
            Monto ({activeCurrency})
          </label>
          <div>
            <span data-currency-symbol>{activeSymbol}</span>
            <input
              id="payment-amount"
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(formatAmountInput(e.target.value))}
              placeholder="0.00"
              required
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Campo: Descripción */}
        <div data-field="description">
          <label htmlFor="payment-description">
            Descripción (opcional)
          </label>
          <input
            id="payment-description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descripción del pago"
            disabled={isLoading}
          />
        </div>

        {/* Mensaje de error */}
        {error && (
          <div data-error role="alert">
            {error}
          </div>
        )}

        {/* Mensaje de éxito */}
        {success && (
          <div data-success role="status">
            ¡Pago procesado exitosamente! Redirigiendo...
          </div>
        )}

        {/* Botón de pago */}
        <button
          type="submit"
          disabled={isLoading}
          data-submit
        >
          {isLoading
            ? 'Procesando...'
            : `Pagar ${activeSymbol}${amount || '0.00'}`
          }
        </button>
      </form>
    </div>
  );
};
