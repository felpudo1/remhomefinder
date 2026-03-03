import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ROLES, ROUTES } from "@/lib/constants";

export function useAuthRedirect() {
    const navigate = useNavigate();
    const location = useLocation();
    const [userEmail, setUserEmail] = useState<string | null>(null);

    useEffect(() => {
        const checkUserAndRole = async (session: any) => {
            if (!session) {
                // Si acabamos de registrar y estamos en la app, no redirigir a /auth para mostrar el msj
                const isRegistered = new URLSearchParams(location.search).get("registered");
                // Si estamos en la landing (HOME), no forzamos auth
                if (location.pathname === ROUTES.HOME) return;

                if (location.pathname !== ROUTES.AUTH) navigate(ROUTES.AUTH);
                return;
            }

            const user = session.user;
            setUserEmail(user.email ?? null);

            // Si estamos en el dashboard con el flag de registrado pero ya tenemos sesión, limpiar la URL
            const searchParams = new URLSearchParams(location.search);
            if (searchParams.get("registered") === "true" && location.pathname === ROUTES.DASHBOARD) {
                navigate(ROUTES.DASHBOARD, { replace: true });
            }

            // Verificar rol para redirección forzada
            try {
                const { data: roles } = await supabase
                    .from("user_roles")
                    .select("role")
                    .eq("user_id", user.id);

                const roleSet = new Set(roles?.map((r) => r.role) ?? []);

                if (roleSet.has(ROLES.ADMIN) && location.pathname !== ROUTES.ADMIN) {
                    navigate(ROUTES.ADMIN);
                } else if (roleSet.has(ROLES.AGENCY) && location.pathname !== ROUTES.AGENCY) {
                    navigate(ROUTES.AGENCY);
                } else if (!roleSet.has(ROLES.ADMIN) && !roleSet.has(ROLES.AGENCY) && location.pathname !== ROUTES.DASHBOARD) {
                    // Solo para usuarios comunes (sin rol agency ni admin), forzamos /dashboard
                    if (([ROUTES.ADMIN, ROUTES.AGENCY, ROUTES.AUTH] as string[]).includes(location.pathname)) {
                        navigate(ROUTES.DASHBOARD);
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
        navigate(ROUTES.AUTH);
    };

    return { userEmail, handleLogout };
}
