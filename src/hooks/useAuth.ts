import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { ROLES, ROUTES } from "@/lib/constants";
import { loginSchema, registerSchema } from "@/lib/schemas/auth";

/**
 * Hook que centraliza la lógica de autenticación con Supabase (registro, login y redirección por rol).
 * Usado en pantallas de login/registro y tras el callback de confirmación de email.
 *
 * @returns Objeto con:
 *   - loading: true mientras hay una operación de login/signup en curso.
 *   - isSigningUp: true durante el registro (para deshabilitar UI o mostrar estado distinto).
 *   - signIn(email, password): inicia sesión; retorna { success, user? } o { success: false, error }.
 *   - signUp(params): registra usuario o agencia; agentes quedan con status "pending" hasta aprobación admin.
 *   - redirectByRole(userId): redirige a /admin, /agency o /dashboard según user_roles; respeta query returnTo.
 *
 * @example
 * const { signIn, redirectByRole, loading } = useAuth();
 * const result = await signIn("user@example.com", "password");
 * if (result.success && result.user) await redirectByRole(result.user.id);
 */
export const useAuth = () => {
    const [loading, setLoading] = useState(false);
    const [isSigningUp, setIsSigningUp] = useState(false);
    const navigate = useNavigate();
    const { toast } = useToast();

    /**
     * Redirige al usuario según su rol definido en la tabla user_roles.
     * Si la URL tiene ?returnTo=/ruta, redirige ahí (si es path local). Si no, usa admin → agency → dashboard.
     *
     * @param userId - ID del usuario autenticado (Supabase auth.user.id).
     */
    const redirectByRole = async (userId: string) => {
        try {
            // Check for returnTo parameter first
            const params = new URLSearchParams(window.location.search);
            const returnTo = params.get("returnTo");
            if (returnTo && returnTo.startsWith("/")) {
                navigate(returnTo);
                return;
            }

            const { data: roles, error } = await supabase
                .from("user_roles")
                .select("role")
                .eq("user_id", userId);

            if (error) {
                console.warn("Error fetching roles:", error);
                navigate(ROUTES.DASHBOARD);
                return;
            }

            const roleSet = new Set(roles?.map((r) => r.role) ?? []);

            if (roleSet.has(ROLES.ADMIN)) {
                navigate(ROUTES.ADMIN);
            } else if (roleSet.has(ROLES.AGENCY) || roleSet.has(ROLES.AGENCY_MEMBER)) {
                navigate(ROUTES.AGENCY);
            } else {
                navigate(ROUTES.DASHBOARD);
            }
        } catch (e) {
            console.error("Redirect error:", e);
            navigate(ROUTES.DASHBOARD);
        }
    };

    /**
     * Registra un nuevo usuario: crea cuenta en Supabase Auth, upsert en profiles y (vía triggers) agencia/rol si es agente.
     * Usuarios normales quedan con profiles.status "active"; agentes con "pending" hasta aprobación en /admin/usuarios.
     *
     * @param params - email, password, confirmPassword, accountType ("user" | "agency"), displayName, phone; opcionales orgName, orgPhone para agency.
     * @returns { success: true } en éxito (y redirige a dashboard tras 1.5s), o { success: false, error } con toast de error.
     */
    const signUp = async (params: {
        email: string;
        password: string;
        confirmPassword: string; // Agregado para validación Zod
        accountType: "user" | "agency";
        displayName: string;
        phone: string;
        orgName?: string;
        orgPhone?: string;
    }) => {
        const { email, password, confirmPassword, accountType, displayName, phone, orgName, orgPhone } = params;
        setLoading(true);
        setIsSigningUp(true);
        try {
            // Validación con Zod
            const validation = registerSchema.safeParse(params);
            if (!validation.success) {
                const firstError = validation.error.errors[0].message;
                throw new Error(firstError);
            }

            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: window.location.origin,
                    data: {
                        display_name: displayName,
                        full_name: displayName,
                        name: displayName,
                        phone: phone,
                        account_type: accountType,
                        agency_name: orgName?.trim() || '',
                        agency_phone: orgPhone?.trim() || '',
                    }
                }
            });

            if (error) throw error;

            if (data.user) {
                // Refuerzo: persistir metadata explícitamente
                await supabase.auth.updateUser({
                    data: {
                        display_name: displayName,
                        full_name: displayName,
                        name: displayName,
                        phone: phone,
                        account_type: accountType,
                        agency_name: orgName?.trim() || '',
                        agency_phone: orgPhone?.trim() || '',
                    },
                });

                // Intentar guardar perfil con reintentos para evitar race conditions
                const upsertProfile = async (retries = 3) => {
                    const referralId = sessionStorage.getItem("hf_referral_id");
                    let lastError: unknown = null;
                    for (let i = 0; i < retries; i++) {
                        const { error: profileError } = await supabase.from("profiles").upsert({
                            user_id: data.user!.id,
                            phone: phone,
                            display_name: displayName,
                            email: email,
                            referred_by_id: referralId,
                            ...(accountType === ROLES.AGENCY ? { status: "pending" } : {}),
                        }, {
                            onConflict: "user_id"
                        });

                        if (!profileError) return;
                        lastError = profileError;
                        await new Promise(r => setTimeout(r, 500 * (i + 1)));
                    }
                    if (lastError) throw lastError;
                };

                try {
                    await upsertProfile();
                } catch (e) {
                    console.error("Profile upsert error:", e);
                }
                // Nota: la agencia y el rol se crean automáticamente en el servidor
                // mediante triggers en handle_new_user_profile y handle_new_user_role
            }

            toast({
                title: "¡Cuenta creada!",
                description: accountType === ROLES.AGENCY
                    ? "Tu solicitud de agente está pendiente de aprobación. Revisá tu email para confirmar tu cuenta."
                    : "Revisá tu email para confirmar tu cuenta."
            });

            setTimeout(() => navigate(`${ROUTES.DASHBOARD}?registered=true`), 1500);
            return { success: true };
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            });
            return { success: false, error };
        } finally {
            setLoading(false);
            setIsSigningUp(false);
        }
    };

    /**
     * Inicia sesión con email y contraseña. Valida con Zod antes de llamar a Supabase.
     *
     * @param email - Email del usuario.
     * @param password - Contraseña.
     * @returns { success: true, user } en éxito, o { success: false, error } con toast de error.
     */
    const signIn = async (email: string, password: string) => {
        setLoading(true);
        try {
            // Validación con Zod
            const validation = loginSchema.safeParse({ email, password });
            if (!validation.success) {
                const firstError = validation.error.errors[0].message;
                throw new Error(firstError);
            }

            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;
            return { success: true, user: data.user };
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            });
            return { success: false, error };
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        isSigningUp,
        signIn,
        signUp,
        redirectByRole
    };
};
