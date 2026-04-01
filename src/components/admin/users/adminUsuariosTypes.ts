import type { LucideIcon } from "lucide-react";

/**
 * Datos enriquecidos que la tabla de administración muestra por usuario.
 */
export interface UserProfile {
  user_id: string;
  display_name: string;
  email: string | null;
  phone: string;
  status: "active" | "pending" | "suspended" | "rejected";
  roles: string[];
  personal_count: number;
  saved_count: number;
  referral_count: number;
  plan_type: "free" | "premium";
  created_at: string;
  referred_by_id?: string | null;
  referred_by_name?: string;
  orgName?: string;
}

/**
 * Roles administrables desde la consola.
 */
export type AgentRole = "user" | "agencymember" | "agency";

/**
 * Toast mínimo que necesita este módulo para informar errores y éxitos.
 */
export type AdminUsuariosToast = (opts: {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
}) => void;

/**
 * Forma cacheada de la query paginada.
 */
export type AdminUsuariosQueryData = {
  rows: UserProfile[];
  totalCount: number;
};

/**
 * Configuración visual para los badges de estado.
 */
export type AdminStatusConfig = {
  label: string;
  icon: LucideIcon;
  color: string;
};
