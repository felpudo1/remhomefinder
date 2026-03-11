import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { ROLES, ROUTES } from "@/lib/constants";
import { loginSchema, registerSchema } from "@/lib/schemas/auth";

/**
 * Hook personalizado para centralizar toda la lógica de autenticación de Supabase.
 * Siguiendo la Regla 2 (Arquitectura Profesional).
 */
export const useAuth = () => {
    const [loading, setLoading] = useState(false);
    const [isSigningUp, setIsSigningUp] = useState(false);
    const navigate = useNavigate();
    const { toast } = useToast();

    /**
     * Redirige al usuario según su rol definido en la tabla user_roles.
     */
    const redirectByRole = async (userId: string) => {
        try {
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
            } else if (roleSet.has(ROLES.AGENCY)) {
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
     * Realiza el registro de un nuevo usuario, incluyendo perfiles y agencias si aplica.
     */
    const signUp = async (params: {
        email: string;
        password: string;
        confirmPassword: string; // Agregado para validación Zod
        accountType: "user" | "agency";
        displayName: string;
        phone: string;
        agencyName?: string;
        agencyPhone?: string;
    }) => {
        const { email, password, confirmPassword, accountType, displayName, phone, agencyName, agencyPhone } = params;
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
                        agency_name: agencyName?.trim() || '',
                        agency_phone: agencyPhone?.trim() || '',
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
                        agency_name: agencyName?.trim() || '',
                        agency_phone: agencyPhone?.trim() || '',
                    },
                });

                // Intentar guardar perfil con reintentos para evitar race conditions
                const upsertProfile = async (retries = 3) => {
                    const referralId = sessionStorage.getItem("hf_referral_agent_id");
                    let lastError: unknown = null;
                    for (let i = 0; i < retries; i++) {
                        const { error: profileError } = await supabase.from("profiles").upsert({
                            user_id: data.user!.id,
                            phone: phone,
                            display_name: displayName,
                            email: email,
                            referred_by_agent_id: referralId,
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
     * Inicia sesión con email y contraseña.
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
