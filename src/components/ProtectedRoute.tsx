import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { ROUTES, ROLES } from "@/lib/constants";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/contexts/AuthProvider";
import { useUserRoles } from "@/hooks/useUserRoles";

import { AppRole } from "@/types/supabase";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: (AppRole | string)[];
}

/**
 * Componente que protege rutas requiriendo autenticación y opcionalmente roles específicos.
 * Limpia el caché de React Query cuando el usuario cambia para evitar mostrar datos del usuario anterior.
 */
export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  /** Si el usuario debe ser redirigido a su panel por rol (admin/agency en dashboard) */
  const [redirectTo, setRedirectTo] = useState<string | null>(null);
  const location = useLocation();
  const queryClient = useQueryClient();

  const { session, isLoading: authLoading } = useCurrentUser();
  const { data: userRoles = [], isLoading: rolesLoading } = useUserRoles(session?.user?.id);

  useEffect(() => {
    // Si aún cargando la auth o los roles, no emitir veredicto
    if (authLoading || rolesLoading) {
      if (isAuthorized !== null) setIsAuthorized(null);
      return;
    }

    // Si no hay sesión, el usuario no está autenticado
    if (!session) {
      setIsAuthorized(false);
      return;
    }

    // Si estamos en /dashboard y el usuario es admin o rol agente, redirigir a su panel
    const isDashboard = location.pathname === ROUTES.DASHBOARD;
    if (isDashboard && !allowedRoles?.length) {
      if (userRoles.includes(ROLES.ADMIN)) {
        setRedirectTo(ROUTES.ADMIN);
        return;
      }
      if (userRoles.includes(ROLES.AGENCY) || userRoles.includes(ROLES.AGENCY_MEMBER)) {
        setRedirectTo(ROUTES.AGENCY);
        return;
      }
    }

    // Chequear roles para rutas protegidas por rol
    if (allowedRoles && allowedRoles.length > 0) {
      const hasAccess = allowedRoles.some(role => userRoles.includes(role));
      setIsAuthorized(hasAccess);
    } else {
      // Si no se especifican roles permitidos, con estar logeado alcanza
      setIsAuthorized(true);
    }

    setRedirectTo(null);

    // Si no hay sesión (logout), limpiar caché
    if (!session && !authLoading) {
      queryClient.clear();
    }
  }, [session, authLoading, rolesLoading, userRoles, allowedRoles, location.pathname, queryClient, isAuthorized]);

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
