import { z } from "zod";

/**
 * Valida formato de teléfono internacional.
 * Acepta el formato generado por InputPhone: "+598 99 123 456"
 * También acepta solo dígitos: "59899123456"
 * Valida que haya al menos 8 dígitos (sin contar espacios, +, guiones).
 */
const phoneSchema = z.string()
    .refine((val) => {
        const digits = val.replace(/\D/g, "");
        return digits.length >= 8;
    }, "El teléfono debe tener al menos 8 dígitos.")
    .refine((val) => /^[\d\s+\-()]+$/.test(val), "El teléfono contiene caracteres inválidos.");

/**
 * Esquema para validación de inicio de sesión.
 */
export const loginSchema = z.object({
    email: z.string().email("El email no es válido."),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres."),
});

/**
 * Esquema para validación de registro.
 * Incluye lógica condicional según el tipo de cuenta.
 */
export const registerSchema = z.object({
    email: z.string().email("El email no es válido."),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres."),
    confirmPassword: z.string(),
    displayName: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
    phone: phoneSchema,
    accountType: z.enum(["user", "agency"]),
    orgName: z.string().optional(),
    orgPhone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
}).refine((data) => {
    if (data.accountType === "agency") {
        return !!data.orgName && data.orgName.trim().length > 0;
    }
    return true;
}, {
    message: "El nombre de la organización es obligatorio para agentes.",
    path: ["orgName"],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Solo email para pedir el link de recuperación (Supabase envía el correo).
 */
export const passwordRecoveryRequestSchema = z.object({
    email: z.string().email("El email no es válido."),
});

/**
 * Nueva contraseña tras abrir el link del mail (recovery).
 */
export const passwordResetSchema = z
    .object({
        password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres."),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Las contraseñas no coinciden.",
        path: ["confirmPassword"],
    });

export type PasswordRecoveryRequestInput = z.infer<typeof passwordRecoveryRequestSchema>;
export type PasswordResetInput = z.infer<typeof passwordResetSchema>;
