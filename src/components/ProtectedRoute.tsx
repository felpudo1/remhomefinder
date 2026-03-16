import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { ROUTES, ROLES } from "@/lib/constants";

import { AppRole } from "@/types/supabase";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  /** Si el usuario debe ser redirigido a su panel por rol (admin/agency en dashboard) */
  const [redirectTo, setRedirectTo] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    const checkAccess = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          if (isMounted) setIsAuthorized(false);
          return;
        }

        // Obtener roles del usuario (siempre lo necesitamos para redirect por rol)
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id);

        const userRoles = roles?.map((r) => r.role as AppRole) || [];

        // Si estamos en /dashboard y el usuario es admin o agency, redirigir a su panel
        const isDashboard = location.pathname === ROUTES.DASHBOARD;
        if (isDashboard && !allowedRoles?.length) {
          if (userRoles.includes(ROLES.ADMIN)) {
            if (isMounted) setRedirectTo(ROUTES.ADMIN);
            return;
          }
          if (userRoles.includes(ROLES.AGENCY)) {
            if (isMounted) setRedirectTo(ROUTES.AGENCY);
            return;
          }
        }

        // Si no se especifican roles permitidos, con estar logeado alcanza
        if (!allowedRoles || allowedRoles.length === 0) {
          if (isMounted) {
            setRedirectTo(null);
            setIsAuthorized(true);
          }
          return;
        }

        // Chequear roles para rutas protegidas por rol
        const hasAccess = allowedRoles.some(role => userRoles.includes(role));

        if (isMounted) {
          setRedirectTo(null);
          setIsAuthorized(hasAccess);
        }
      } catch (error) {
        console.error("Error checkAccess:", error);
        if (isMounted) setIsAuthorized(false);
      }
    };

    checkAccess();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && isMounted) {
        setIsAuthorized(false);
      } else if (session) {
        checkAccess();
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [allowedRoles, location.pathname]);

  if (isAuthorized === null && !redirectTo) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (redirectTo) {
    return <Navigate to={redirectTo} replace />;
  }

  if (!isAuthorized) {
    const currentPath = location.pathname + location.search;
    return <Navigate to={`${ROUTES.AUTH}?returnTo=${encodeURIComponent(currentPath)}`} replace />;
  }

  return <>{children}</>;
}
