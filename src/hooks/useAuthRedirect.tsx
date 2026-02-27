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
                if (location.pathname !== "/auth") navigate("/auth");
                return;
            }

            const user = session.user;
            setUserEmail(user.email ?? null);

            // Verificar rol para redirección forzada
            try {
                const { data: roles } = await supabase
                    .from("user_roles")
                    .select("role")
                    .eq("user_id", user.id);

                const roleSet = new Set(roles?.map((r) => r.role) ?? []);

                if (roleSet.has("admin") && location.pathname !== "/admin") {
                    navigate("/admin");
                } else if (roleSet.has("agency") && location.pathname !== "/inmobiliaria") {
                    navigate("/inmobiliaria");
                } else if (!roleSet.has("admin") && !roleSet.has("agency") && location.pathname !== "/") {
                    if (["/admin", "/admininmobiliaria", "/inmobiliaria"].includes(location.pathname)) {
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
