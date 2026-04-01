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
export const USER_FREE_PLAN_SAVE_LIMIT_KEY = "user_free_plan_save_limit";
export const USER_FREE_PLAN_SAVE_LIMIT_DEFAULT = "10";

// Límite de guardado para el plan premium
export const USER_PREMIUM_PLAN_SAVE_LIMIT_KEY = "user_premium_plan_save_limit";
export const USER_PREMIUM_PLAN_SAVE_LIMIT_DEFAULT = "200";

// Límite de publicaciones en marketplace para agentes gratuitos
export const AGENT_FREE_PLAN_PUBLISH_LIMIT_KEY = "agent_free_plan_publish_limit";
export const AGENT_FREE_PLAN_PUBLISH_LIMIT_DEFAULT = "3";

// Frecuencia del tip de contacto al guardar avisos en marketplace
export const MARKETPLACE_CONTACT_TIP_INTERVAL_KEY = "marketplace_contact_tip_interval";
export const MARKETPLACE_CONTACT_TIP_INTERVAL_DEFAULT = "3";

// Nombre de marca para textos dinámicos en la app
export const APP_BRAND_NAME_KEY = "app_brand_name";
export const APP_BRAND_NAME_DEFAULT = "HomeFinder";

// Bonus de avisos extra para users referidos por un agente
export const AGENT_REFERRAL_BONUS_SAVES_KEY = "agent_referral_bonus_saves";
export const AGENT_REFERRAL_BONUS_SAVES_DEFAULT = "5";

// Si la limitación de guardado incluye avisos del marketplace
export const LIMIT_INCLUDES_MARKETPLACE_KEY = "limit_includes_marketplace";
export const LIMIT_INCLUDES_MARKETPLACE_DEFAULT = "true";

// Configuracion de pesos para el algoritmo de Match Score (json)
export const MATCH_SCORE_WEIGHTS_KEY = "match_score_weights";
export const MATCH_SCORE_WEIGHTS_DEFAULT = '{"operation_weight": 30, "budget_weight": 40, "neighborhood_weight": 20, "rooms_weight": 10}';
