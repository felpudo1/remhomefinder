import { z } from "zod";

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
    phone: z.string().min(8, "El teléfono no es válido."),
    accountType: z.enum(["user", "agency"]),
    agencyName: z.string().optional(),
    agencyPhone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
}).refine((data) => {
    if (data.accountType === "agency") {
        return !!data.agencyName && data.agencyName.trim().length > 0;
    }
    return true;
}, {
    message: "El nombre de la agencia es obligatorio para agentes.",
    path: ["agencyName"],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
