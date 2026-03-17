/**
 * Type aliases para los enums de Supabase.
 * Extraen los tipos directamente del archivo auto-generado types.ts,
 * para evitar usar "as any" en las operaciones de base de datos.
 *
 * Ejemplo de uso:
 * import type { OrgType, OrgRole } from "@/types/supabase";
 * const tipo: OrgType = "family"; // ✅ Tipado correcto sin "as any"
 */
import type { Database } from "@/integrations/supabase/types";

/** Tipos de organización: "family" | "agency_team" | "sub_team" */
export type OrgType = Database["public"]["Enums"]["org_type"];

/** Roles dentro de una organización: "owner" | "agent" | "member" | "system_admin_delegate" */
export type OrgRole = Database["public"]["Enums"]["org_role"];

/** Códigos de moneda soportados: "USD" | "ARS" | "UYU" | "CLP" */
export type CurrencyCode = Database["public"]["Enums"]["currency_code"];

/** Tipo de listado: "rent" | "sale" */
export type DbListingType = Database["public"]["Enums"]["listing_type"];

/** Estado de un user_listing: "ingresado" | "contactado" | "visita_coordinada" | "visitado" | "a_analizar" | "descartado" */
export type UserListingStatus = Database["public"]["Enums"]["user_listing_status"];

/** Estado de una publicación de agente: "disponible" | "reservado" | "vendido" | "alquilado" | "eliminado" | "pausado" */
export type AgentPubStatus = Database["public"]["Enums"]["agent_pub_status"];

/** Roles de la app: "admin" | "agency" | "agencymember" | "user" */
export type AppRole = Database["public"]["Enums"]["app_role"];

/** Estado del usuario: "active" | "pending" | "suspended" | "rejected" */
export type DbUserStatus = Database["public"]["Enums"]["user_status"];

/**
 * Helper genérico para extraer el tipo Row de cualquier tabla.
 * Ejemplo: TableRow<"profiles"> retorna el tipo de una fila de profiles.
 */
export type TableRow<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

/**
 * Helper genérico para extraer el tipo Insert de cualquier tabla.
 * Ejemplo: TableInsert<"properties"> retorna el tipo requerido para un insert.
 */
export type TableInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
