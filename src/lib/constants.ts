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
} as const;

/**
 * Mensajes de error comunes centralizados.
 */
export const ERROR_MESSAGES = {
    PERMISSION_DENIED: "No tiene permisos para realizar esta acción.",
    AUTH_REQUIRED: "Debe iniciar sesión para continuar.",
} as const;
