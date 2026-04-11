import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const PENDING_SAVE_KEY = "pending_property_save";
const PENDING_SAVE_CONFIRM_KEY = "pending_property_save_require_accept";

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
          const isGoogleUser = session.user.app_metadata?.provider === "google";
          const hasPendingSave = !!sessionStorage.getItem(PENDING_SAVE_KEY);

          if (hasPendingSave && isGoogleUser) {
            sessionStorage.setItem(PENDING_SAVE_CONFIRM_KEY, "1");
          } else {
            sessionStorage.removeItem(PENDING_SAVE_CONFIRM_KEY);
          }

          // Vincular referido desde sessionStorage (OAuth no pasa metadata custom)
          const referralId = sessionStorage.getItem("hf_referral_id");
          if (referralId && referralId !== session.user.id) {
            try {
              // Retry: el trigger handle_new_user_profile puede no haber creado el perfil aún
              const linkReferral = async (retries = 5, delayMs = 600) => {
                for (let i = 0; i < retries; i++) {
                  const { data: profile } = await (supabase
                    .from("profiles") as any)
                    .select("referred_by_id")
                    .eq("user_id", session.user.id)
                    .maybeSingle();

                  if (!profile) {
                    console.log(`💎 AuthCallback: Perfil aún no existe, reintento ${i + 1}/${retries}...`);
                    await new Promise(r => setTimeout(r, delayMs));
                    continue;
                  }

                  if (!profile.referred_by_id) {
                    const { error: updErr } = await (supabase
                      .from("profiles") as any)
                      .update({ referred_by_id: referralId })
                      .eq("user_id", session.user.id);
                    if (updErr) {
                      console.error("💎 AuthCallback: Error update referido:", updErr);
                    } else {
                      console.log("💎 AuthCallback: Referido vinculado:", referralId);
                    }
                  } else {
                    console.log("💎 AuthCallback: Perfil ya tiene referido, omitiendo.");
                  }
                  break;
                }
              };
              await linkReferral();
              sessionStorage.removeItem("hf_referral_id");
            } catch (refErr) {
              console.error("💎 AuthCallback: Error al vincular referido:", refErr);
            }
          }

          // Check for returnTo param (from QR flow)
          // Fallback: si Supabase/Google droppeó el query param, intentar sessionStorage
          const returnTo = searchParams.get("returnTo")
            || sessionStorage.getItem("pending_save_url");
          const isPublicPropertyRoute =
            returnTo?.startsWith("/p/") || returnTo?.startsWith("/property/");

          if (returnTo && isPublicPropertyRoute) {
            sessionStorage.removeItem("pending_save_url");
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
