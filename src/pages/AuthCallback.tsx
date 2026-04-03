import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

/**
 * Página de callback de OAuth.
 * Procesa el intercambio de sesión, vincula referidos y redirige al dashboard por rol.
 * Soporta ?returnTo= para volver a la propiedad pública tras OAuth desde QR.
 */
const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { redirectByRole } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    let handled = false;

    const processSession = async (session: any) => {
      if (handled) return;
      handled = true;

      try {
        if (session?.user) {
          // Vincular referido desde sessionStorage (OAuth no pasa metadata custom)
          const referralId = sessionStorage.getItem("hf_referral_id");
          if (referralId && referralId !== session.user.id) {
            try {
              const { data: profile } = await (supabase
                .from("profiles") as any)
                .select("referred_by_id")
                .eq("user_id", session.user.id)
                .maybeSingle();

              if (profile && !profile.referred_by_id) {
                await (supabase
                  .from("profiles") as any)
                  .update({ referred_by_id: referralId })
                  .eq("user_id", session.user.id);
                console.log("💎 AuthCallback: Referido vinculado:", referralId);
              }
              sessionStorage.removeItem("hf_referral_id");
            } catch (refErr) {
              console.error("💎 AuthCallback: Error al vincular referido:", refErr);
            }
          }

          // Check for returnTo param (from QR flow)
          const returnTo = searchParams.get("returnTo");
          if (returnTo && returnTo.startsWith("/p/")) {
            navigate(returnTo, { replace: true });
            return;
          }
          await redirectByRole(session.user.id);
        } else {
          navigate("/auth", { replace: true });
        }
      } catch (err: any) {
        console.error("Auth callback error:", err);
        toast({
          title: "Error de autenticación",
          description: err?.message || "No se pudo completar el inicio de sesión.",
          variant: "destructive",
        });
        navigate("/auth", { replace: true });
      }
    };

    // Escuchar el evento de auth para capturar el intercambio OAuth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        processSession(session);
      }
    });

    // Fallback: si la sesión ya existe (intercambio ya ocurrió)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) processSession(session);
    });

    // Timeout de seguridad: si no hay sesión en 10s, volver a auth
    const timeout = setTimeout(() => {
      if (!handled) {
        handled = true;
        navigate("/auth", { replace: true });
      }
    }, 10000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [navigate, searchParams, redirectByRole, toast]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
      <p className="text-muted-foreground text-sm">Procesando autenticación...</p>
    </div>
  );
};

export default AuthCallback;
