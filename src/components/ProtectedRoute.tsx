import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { ROUTES } from "@/lib/constants";

import { AppRole } from "@/types/supabase";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
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

        // Si no se especifican roles permitidos, con estar logeado alcanza
        if (!allowedRoles || allowedRoles.length === 0) {
          if (isMounted) setIsAuthorized(true);
          return;
        }

        // Chequear roles
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id);

        const userRoles = roles?.map((r) => r.role as AppRole) || [];
        const hasAccess = allowedRoles.some(role => userRoles.includes(role));

        if (isMounted) {
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

  if (isAuthorized === null) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthorized) {
    // Si no está autorizado y el acceso falló por rol, idealmente iría al dashboard.
    // Si no tiene sesión, va al login. Lo manejaremos con un chequeo rápido de sesión actual.
    // Lo mandamos a auth, que decidirá si está en sesión o no. 
    // Guardamos la ruta a la que quería ir por si luego de logearse queremos llevarlo (returnTo)
    const currentPath = location.pathname + location.search;
    return <Navigate to={`${ROUTES.AUTH}?returnTo=${encodeURIComponent(currentPath)}`} replace />;
  }

  return <>{children}</>;
}
