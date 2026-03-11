/**
 * Claves centralizadas para la tabla system_config de Supabase.
 * Esto evita dependencias circulares entre componentes admin y páginas públicas.
 */

// Video de fondo en la página de Auth
export const SHOW_AUTH_VIDEO_CONFIG_KEY = "show_auth_video";
export const SHOW_AUTH_VIDEO_DEFAULT = "false";

// Configuración de botones de agregar propiedad
export const ADD_BUTTON_CONFIG_KEY = "add_button_config";
export const ADD_BUTTON_DEFAULT = "blue";

// Email de soporte
export const SUPPORT_EMAIL_CONFIG_KEY = "support_email";
export const SUPPORT_EMAIL_DEFAULT = "";

// Teléfono de soporte
export const SUPPORT_PHONE_CONFIG_KEY = "support_phone";
export const SUPPORT_PHONE_DEFAULT = "";

// Límite de guardado para el plan gratuito
export const FREE_PLAN_SAVE_LIMIT_KEY = "free_plan_save_limit";
export const FREE_PLAN_SAVE_LIMIT_DEFAULT = "10";
