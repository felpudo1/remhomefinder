/**
 * Roles de usuario definidos en el sistema.
 * Basado en la estructura de la base de datos (tabla user_roles).
 * Siguiendo la Regla 2 (Arquitectura Profesional).
 */
export const ROLES = {
    ADMIN: "admin",
    AGENCY: "agency",
    AGENCY_MEMBER: "agencymember",
    USER: "user",
} as const;

/**
 * Tipo derivado de los roles para asegurar tipado estricto en toda la app.
 */
export type UserRole = (typeof ROLES)[keyof typeof ROLES];

/**
 * Rutas principales de la aplicación centralizadas.
 * Facilita el mantenimiento y evita errores por strings harcodeados.
 */
export const ROUTES = {
    HOME: "/",
    DASHBOARD: "/dashboard",
    AUTH: "/auth",
    /** Pedir enlace de recuperación de contraseña (email) */
    AUTH_RECOVER: "/auth/recuperar",
    /** Establecer nueva contraseña (llegás desde el mail de Supabase) */
    AUTH_RESET_PASSWORD: "/auth/restablecer",
    /** Auth abriendo formulario de registro (vuelta desde páginas legales) */
    AUTH_REGISTER: "/auth?register=1",
    /** Términos y condiciones (página pública) */
    TERMS: "/terminos",
    /** Política de privacidad (página pública) */
    PRIVACY: "/privacidad",
    ADMIN: "/admin",
    ADMIN_SECTION: (section: string) => `/admin/${section}`,
    ADMIN_SECTION_PATH: "/admin/:section",
    AGENCY: "/agente",
    PUBLIC_PROPERTY: (id: string) => `/p/${id}`,
    PUBLIC_PROPERTY_PATH: "/p/:id",
    REFERRAL: (userId: string) => `/ref/${userId}`,
    REFERRAL_PATH: "/ref/:userId",
} as const;

/**
 * Mensajes de error comunes centralizados.
 */
export const ERROR_MESSAGES = {
    PERMISSION_DENIED: "No tiene permisos para realizar esta acción.",
    AUTH_REQUIRED: "Debe iniciar sesión para continuar.",
} as const;

/**
 * Diccionario de Estados de Agentes (Regla 2 y Regla 5).
 * Define qué estados están disponibles dependiendo si la propiedad es Venta o Alquiler.
 * Las keys coinciden con los valores del ENUM 'marketplace_property_status' en la DB.
 */
export const AGENT_PROPERTY_STATUSES = {
    RENT: ["disponible", "pausado", "reservado", "alquilado", "eliminado"],
    SALE: ["disponible", "pausado", "reservado", "vendido", "eliminado"],
} as const;

export const PROPERTY_STATUS_LABELS: Record<string, string> = {
    // agent_pub_status (marketplace)
    disponible: "Disponible",
    pausado: "Pausada",
    reservado: "Reservada",
    vendido: "Vendida",
    alquilado: "Alquilada",
    eliminado: "Eliminada",
    eliminado_agencia: "Finalizado por Agencia",
    // user_listing_status (personal)
    ingresado: "📝 Ingresado",
    contactado: "📞 Contactado",
    visita_coordinada: "🗓️ Visita coordinada",
    visitado: "Visitado",
    a_analizar: "A analizar",
    descartado: "❌ Descartado",
    firme_candidato: "🔥 Alta prioridad",
    posible_interes: "💡 Interesado",
    meta_conseguida: "🎯 Meta conseguida",
};
