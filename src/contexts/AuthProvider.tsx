import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

/**
 * Estado centralizado de autenticación.
 * - user: objeto User de Supabase (null si no hay sesión)
 * - session: objeto Session completo (null si no hay sesión)
 * - isLoading: true mientras se resuelve la sesión inicial
 *
 * REGLA 2 (Arquitectura Pro): Este provider centraliza TODA la lógica de auth
 * para evitar llamadas redundantes a supabase.auth.getUser() en cada hook/componente.
 * Antes de este provider, la app hacía ~38 llamadas independientes a getUser(),
 * generando ~1,252 auth requests en 24h con solo 10 usuarios.
 */
interface AuthContextType {
  /** Usuario autenticado actual (null si no hay sesión) */
  user: User | null;
  /** Sesión completa de Supabase (null si no hay sesión) */
  session: Session | null;
  /** true mientras se resuelve la sesión inicial al montar */
  isLoading: boolean;
  /** Fuerza una recarga del usuario desde el servidor (útil post-update de perfil) */
  refreshUser: () => Promise<void>;
}

// Contexto con valor por defecto null — verificamos en el hook
const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Hook para consumir el estado de autenticación centralizado.
 * Reemplaza las llamadas directas a supabase.auth.getUser() en hooks y componentes.
 *
 * Ejemplo de uso:
 *   const { user, isLoading } = useCurrentUser();
 *   if (isLoading) return <Loader2 />;
 *   if (!user) return <Navigate to="/auth" />;
 *
 * @returns {AuthContextType} - user, session, isLoading, refreshUser
 * @throws Error si se usa fuera de AuthProvider
 */
export function useCurrentUser(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error(
      "useCurrentUser() debe usarse dentro de <AuthProvider>. " +
      "Verificá que App.tsx tenga el AuthProvider wrapping la app."
    );
  }
  return ctx;
}

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Provider centralizado de autenticación.
 * Escucha onAuthStateChange UNA sola vez y distribuye el estado
 * a toda la app via Context, eliminando auth requests redundantes.
 *
 * Se coloca en App.tsx envolviendo toda la app:
 *   <QueryClientProvider>
 *     <AuthProvider>
 *       <BrowserRouter>...</BrowserRouter>
 *     </AuthProvider>
 *   </QueryClientProvider>
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Obtener sesión actual al montar (1 sola vez)
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setIsLoading(false);
    });

    // 2. Escuchar cambios de auth (login, logout, token refresh)
    // Este es el ÚNICO listener de onAuthStateChange en toda la app
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        // Si era el primer mount y aún estaba en loading, desactivar
        setIsLoading(false);
      }
    );

    // Cleanup: desuscribir al desmontar
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Fuerza una recarga del usuario desde Supabase.
   * Útil después de actualizar perfil o metadata del usuario.
   * NOTA: Esta es la ÚNICA situación donde hacemos getUser() al servidor.
   */
  const refreshUser = useCallback(async () => {
    const { data: { user: freshUser } } = await supabase.auth.getUser();
    setUser(freshUser);
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, isLoading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
