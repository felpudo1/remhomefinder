/**
 * =====================================================
 * PaymentMP - Tipos TypeScript Centralizados
 * =====================================================
 * 
 * Todos los tipos, interfaces y enums relacionados con
 * la integración de MercadoPago están definidos aquí.
 * 
 * Este archivo es el "contrato" que usan todos los demás
 * módulos de PaymentMP. Si necesitás agregar un tipo nuevo,
 * agregalo acá y exportalo desde index.ts.
 * =====================================================
 */

// ─────────────────────────────────────────────────────
// Monedas soportadas por MercadoPago
// ─────────────────────────────────────────────────────

/**
 * Códigos de moneda ISO 4217 soportados por MercadoPago.
 * Cada país de MercadoPago tiene su moneda local habilitada.
 */
export type SupportedCurrency = 'ARS' | 'BRL' | 'CLP' | 'COP' | 'MXN' | 'PEN' | 'UYU' | 'USD';

// ─────────────────────────────────────────────────────
// Estados de un pago
// ─────────────────────────────────────────────────────

/**
 * Estados posibles de un pago en MercadoPago.
 * - approved: Pago aprobado exitosamente
 * - pending: Pago en espera de confirmación (ej: transferencia bancaria)
 * - rejected: Pago rechazado (fondos insuficientes, datos inválidos, etc.)
 * - cancelled: Pago cancelado por el usuario o el sistema
 * - refunded: Pago devuelto al pagador
 * - in_process: Pago siendo evaluado por MercadoPago
 */
export type PaymentStatus =
  | 'approved'
  | 'pending'
  | 'rejected'
  | 'cancelled'
  | 'refunded'
  | 'in_process';

// ─────────────────────────────────────────────────────
// Datos del pago (lo que envía el formulario)
// ─────────────────────────────────────────────────────

/**
 * Datos necesarios para crear una preferencia de pago.
 * Esto es lo que el formulario recopila del usuario.
 * 
 * @property amount - Monto a cobrar (debe ser > 0)
 * @property description - Descripción del producto/servicio
 * @property currency - Código de moneda ISO 4217 (por defecto 'UYU')
 */
export interface PaymentData {
  amount: number;
  description: string;
  currency: SupportedCurrency;
}

// ─────────────────────────────────────────────────────
// Resultado de crear un pago
// ─────────────────────────────────────────────────────

/**
 * Respuesta que devuelve el backend al crear una preferencia.
 * 
 * @property success - true si la preferencia se creó correctamente
 * @property paymentId - ID de la preferencia creada en MercadoPago
 * @property redirectUrl - URL del checkout de MercadoPago para redirigir al usuario
 * @property error - Mensaje de error si success es false
 */
export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  redirectUrl?: string;
  error?: string;
}

// ─────────────────────────────────────────────────────
// Configuración del módulo
// ─────────────────────────────────────────────────────

/**
 * Configuración para inicializar el módulo PaymentMP.
 * El proyecto consumidor debe proveer estos valores.
 * 
 * @property publicKey - Public Key de MercadoPago (para el frontend)
 * @property apiBaseUrl - URL base de tu backend API (ej: 'http://localhost:3001/api')
 * @property defaultCurrency - Moneda por defecto para los pagos
 * @property maxAmount - Monto máximo permitido por transacción
 * @property backUrls - URLs de retorno después del pago en MercadoPago
 * @property autoReturn - Si MercadoPago debe redirigir automáticamente en pago aprobado
 * @property fetcher - Función fetch custom (opcional, para inyectar Supabase u otro)
 */
export interface PaymentConfig {
  publicKey: string;
  apiBaseUrl: string;
  defaultCurrency: SupportedCurrency;
  maxAmount: number;
  backUrls: {
    success: string;
    failure: string;
    pending: string;
  };
  autoReturn: 'approved' | 'all' | 'none';
  fetcher?: (url: string, options?: RequestInit) => Promise<Response>;
}

// ─────────────────────────────────────────────────────
// Props de los componentes
// ─────────────────────────────────────────────────────

/**
 * Props para el componente PaymentForm.
 * 
 * @property config - Configuración del módulo PaymentMP
 * @property currency - Moneda a usar en este formulario (override del default)
 * @property currencySymbol - Símbolo de moneda para mostrar (ej: '$U', '$', 'R$')
 * @property className - Clase CSS para el contenedor raíz (para que el consumidor estilice)
 * @property onSuccess - Callback cuando el pago se crea exitosamente
 * @property onError - Callback cuando ocurre un error
 * @property autoRedirect - Si debe redirigir automáticamente a MercadoPago (default: true)
 */
export interface PaymentFormProps {
  config: PaymentConfig;
  currency?: SupportedCurrency;
  currencySymbol?: string;
  className?: string;
  onSuccess?: (result: PaymentResult) => void;
  onError?: (error: string) => void;
  autoRedirect?: boolean;
}

/**
 * Props para los componentes de resultado del pago (Success, Failure, Pending).
 * El consumidor inyecta los callbacks de navegación.
 * 
 * @property className - Clase CSS para el contenedor raíz
 * @property onNavigateBack - Callback para volver a la página de pagos
 * @property onNavigateHome - Callback para volver al home/dashboard
 * @property onRetry - (Solo Failure) Callback para reintentar el pago
 * @property title - Título custom (opcional, tiene default)
 * @property message - Mensaje custom (opcional, tiene default)
 */
export interface PaymentResultProps {
  className?: string;
  onNavigateBack?: () => void;
  onNavigateHome?: () => void;
  title?: string;
  message?: string;
}

/**
 * Props extendidas para PaymentFailure que incluye opción de reintento
 */
export interface PaymentFailureProps extends PaymentResultProps {
  onRetry?: () => void;
}

// ─────────────────────────────────────────────────────
// Tipos de MercadoPago (respuesta de la API)
// ─────────────────────────────────────────────────────

/**
 * Estructura de un pago devuelto por la API de MercadoPago.
 * Estos campos vienen de la API cuando consultás un pago por ID.
 */
export interface MercadoPagoPayment {
  id: string;
  status: PaymentStatus;
  status_detail: string;
  transaction_amount: number;
  currency_id: SupportedCurrency;
  description: string;
  payment_method_id: string;
  payer: {
    email: string;
    identification: {
      type: string;
      number: string;
    };
  };
}

/**
 * Estructura de una preferencia de pago devuelta por MercadoPago.
 * 
 * @property id - ID único de la preferencia
 * @property init_point - URL del checkout en producción
 * @property sandbox_init_point - URL del checkout en sandbox (para testing)
 */
export interface MercadoPagoPreference {
  id: string;
  init_point: string;
  sandbox_init_point: string;
}

// ─────────────────────────────────────────────────────
// Hook return type
// ─────────────────────────────────────────────────────

/**
 * Lo que devuelve el hook usePayment.
 * 
 * @property processPayment - Función para iniciar un pago
 * @property isLoading - true mientras se está procesando un pago
 * @property error - Mensaje de error (null si no hay error)
 * @property success - true si el último pago fue exitoso
 * @property resetState - Función para limpiar el estado del hook
 */
export interface UsePaymentReturn {
  processPayment: (paymentData: PaymentData) => Promise<PaymentResult>;
  isLoading: boolean;
  error: string | null;
  success: boolean;
  resetState: () => void;
}
