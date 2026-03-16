/**
 * Roles de usuario definidos en el sistema.
 * Basado en la estructura de la base de datos (tabla user_roles).
 * Siguiendo la Regla 2 (Arquitectura Profesional).
 */
export const ROLES = {
    ADMIN: "admin",
    AGENCY: "agency",
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
    ADMIN: "/admin",
    ADMIN_SECTION: (section: string) => `/admin/${section}`,
    ADMIN_SECTION_PATH: "/admin/:section",
    AGENCY: "/agente",
    PUBLIC_PROPERTY: (id: string) => `/p/${id}`,
    PUBLIC_PROPERTY_PATH: "/p/:id",
    JOIN_TEAM: (code: string) => `/join/${code}`,
    JOIN_TEAM_PATH: "/join/:inviteCode",
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
    RENT: ["active", "paused", "reserved", "rented", "deleted"],
    SALE: ["active", "paused", "reserved", "sold", "deleted"],
} as const;

export const PROPERTY_STATUS_LABELS: Record<string, string> = {
    active: "Disponible",
    paused: "Pausada",
    reserved: "Reservada",
    rented: "Alquilada",
    sold: "Vendida",
    deleted: "Eliminada",
    eliminado_agencia: "Finalizado por Agencia",
};
