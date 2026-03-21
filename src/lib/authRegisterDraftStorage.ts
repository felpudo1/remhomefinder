/**
 * Borrador del formulario de registro en sessionStorage.
 * Así al ir a términos/privacidad y volver no se pierden los datos (misma pestaña).
 */

export const AUTH_REGISTER_DRAFT_KEY = "remhomefinder_auth_register_draft";

export type AuthRegisterDraftAccountType = "user" | "agency";

export interface AuthRegisterDraft {
  email: string;
  password: string;
  confirmPassword: string;
  accountType: AuthRegisterDraftAccountType;
  orgName: string;
  orgPhone: string;
  userPhone: string;
  familyName: string;
  acceptedTerms: boolean;
}

/**
 * Lee el borrador guardado; devuelve null si no hay o el JSON es inválido.
 */
export function readAuthRegisterDraft(): AuthRegisterDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(AUTH_REGISTER_DRAFT_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as Partial<AuthRegisterDraft>;
    if (typeof d !== "object" || d === null) return null;
    return {
      email: typeof d.email === "string" ? d.email : "",
      password: typeof d.password === "string" ? d.password : "",
      confirmPassword: typeof d.confirmPassword === "string" ? d.confirmPassword : "",
      accountType: d.accountType === "agency" ? "agency" : "user",
      orgName: typeof d.orgName === "string" ? d.orgName : "",
      orgPhone: typeof d.orgPhone === "string" ? d.orgPhone : "",
      userPhone: typeof d.userPhone === "string" ? d.userPhone : "",
      familyName: typeof d.familyName === "string" ? d.familyName : "",
      acceptedTerms: d.acceptedTerms === true,
    };
  } catch {
    return null;
  }
}

/**
 * Guarda el borrador actual del registro.
 */
export function writeAuthRegisterDraft(d: AuthRegisterDraft): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(AUTH_REGISTER_DRAFT_KEY, JSON.stringify(d));
  } catch {
    /* cuota llena o modo privado */
  }
}

/**
 * Borra el borrador (p. ej. tras registro exitoso).
 */
export function clearAuthRegisterDraft(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(AUTH_REGISTER_DRAFT_KEY);
  } catch {
    /* noop */
  }
}
