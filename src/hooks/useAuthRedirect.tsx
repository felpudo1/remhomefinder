import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export function useAuthRedirect() {
    const navigate = useNavigate();
    const location = useLocation();
    const [userEmail, setUserEmail] = useState<string | null>(null);

    useEffect(() => {
        const checkUserAndRole = async (session: any) => {
            if (!session) {
                // Si acabamos de registrar y estamos en la home, no redirigir a /auth para mostrar el msj
                const isRegistered = new URLSearchParams(location.search).get("registered");
                if (location.pathname === "/" && isRegistered === "true") return;

                if (location.pathname !== "/auth") navigate("/auth");
                return;
            }

            const user = session.user;
            setUserEmail(user.email ?? null);

            // Si estamos en la home con el flag de registrado pero ya tenemos sesión, limpiar la URL
            const searchParams = new URLSearchParams(location.search);
            if (searchParams.get("registered") === "true" && location.pathname === "/") {
                navigate("/", { replace: true });
            }

            // Verificar rol para redirección forzada
            try {
                const { data: roles } = await supabase
                    .from("user_roles")
                    .select("role")
                    .eq("user_id", user.id);

                const roleSet = new Set(roles?.map((r) => r.role) ?? []);

                if (roleSet.has("admin") && location.pathname !== "/admin") {
                    navigate("/admin");
                } else if (roleSet.has("agency") && location.pathname !== "/agente") {
                    navigate("/agente");
                } else if (!roleSet.has("admin") && !roleSet.has("agency") && location.pathname !== "/") {
                    if (["/admin", "/agente"].includes(location.pathname)) {
                        navigate("/");
                    }
                }
            } catch (error) {
                console.error("Error checkUserAndRole:", error);
            }
        };

        supabase.auth.getSession().then(({ data: { session } }) => {
            checkUserAndRole(session);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            checkUserAndRole(session);
        });

        return () => subscription.unsubscribe();
    }, [navigate, location.pathname]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate("/auth");
    };

    return { userEmail, handleLogout };
}
