import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ROUTES } from "@/lib/constants";
import { Loader2 } from "lucide-react";

const PENDING_SAVE_KEY = "pending_property_save";
const PENDING_SAVE_CONFIRM_KEY = "pending_property_save_require_accept";
const PENDING_SAVE_BACKUP_KEY = "pending_property_save_backup";
const PENDING_SAVE_URL_KEY = "pending_save_url";
const PENDING_SAVE_URL_FALLBACK_KEY = "pending_save_url_fallback";

/**
 * Página de callback de OAuth.
 * Procesa el intercambio de sesión, vincula referidos y redirige al dashboard por rol.
 * Soporta ?returnTo= para volver a la propiedad pública tras OAuth desde QR.
 */
const AuthCallback = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const { redirectByRole } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    console.log("💎 AuthCallback: useEffect montado. URL actual:", window.location.href);
    console.log("💎 AuthCallback: searchParams:", searchParams.toString());
    console.log("💎 AuthCallback: localStorage hf_referral_id =", localStorage.getItem("hf_referral_id"));
    let handled = false;

    const processSession = async (session: any) => {
      console.log("💎 AuthCallback: processSession llamada con session =", !!session);
      if (handled) {
        console.log("💎 AuthCallback: ya fue handled, saliendo.");
        return;
      }
      handled = true;

      try {
        if (session?.user) {
          console.log("💎 AuthCallback: user_id =", session.user.id);
          console.log("💎 AuthCallback: provider =", session.user.app_metadata?.provider);
          const isGoogleUser = session.user.app_metadata?.provider === "google";
          const hasPendingSave = !!sessionStorage.getItem(PENDING_SAVE_KEY);

          if (hasPendingSave && isGoogleUser) {
            sessionStorage.setItem(PENDING_SAVE_CONFIRM_KEY, "1");
          } else {
            sessionStorage.removeItem(PENDING_SAVE_CONFIRM_KEY);
          }

          // Vincular referido: priorizar query param ?ref= (viene de GoogleSignInButton)
          // fallback a localStorage (sobrevive redirects de OAuth)
          const refParam = searchParams.get("ref") || searchParams.get("agente");
          const refStorage = localStorage.getItem("hf_referral_id");
          let referralId: string | null = null;
          
          console.log("💎 AuthCallback: ref en URL params =", refParam);
          console.log("💎 AuthCallback: ref en localStorage =", refStorage);

          // --- CIRUGÍA DE VALIDACIÓN DE REFERIDO PARA OAUTH ---
          const rawReferral = refParam || refStorage;
          if (rawReferral) {
            const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(rawReferral.trim());
            if (isValidUUID) {
              referralId = rawReferral.trim();
              console.log("💎 AuthCallback: ✅ UUID válido capturado para referenciador =", referralId);
              
              // Guardar para consistencia
              if (!refStorage) {
                localStorage.setItem("hf_referral_id", referralId);
              }
            } else {
              console.error(`🚨 ABORTO DE REFERIDO: URL o localStorage contiene un UUID inválido. Valor corrupto interceptado: "${rawReferral}"`);
            }
          }
          
          console.log("💎 AuthCallback: user_id =", session.user.id);
          console.log("💎 AuthCallback: provider =", session.user.app_metadata?.provider);
          // ----------------------------------------------------

          // Si no hay referral cacheado, intentar resolverlo desde la publicación pendiente
          // (cachePublicationReferrer pudo fallar porque el usuario era anónimo y RLS lo bloqueó)
          if (!referralId) {
            try {
              const pendingSave = sessionStorage.getItem(PENDING_SAVE_KEY);
              if (pendingSave) {
                const { publicationId } = JSON.parse(pendingSave);
                if (publicationId) {
                  const { data: pub } = await supabase
                    .from("agent_publications")
                    .select("published_by")
                    .eq("id", publicationId)
                    .maybeSingle();
                  if (pub?.published_by && pub.published_by !== session.user.id) {
                    referralId = pub.published_by;
                    console.log("💎 AuthCallback: Referral resuelto desde publicación pendiente:", referralId);
                  }
                }
              }
            } catch (e) {
              console.error("💎 AuthCallback: Error resolviendo referral desde publicación:", e);
            }
          }

          if (referralId && referralId !== session.user.id) {
            console.log("💎 AuthCallback: Iniciando vinculación de referido:", referralId);
            try {
              // Retry: el trigger handle_new_user_profile puede no haber creado el perfil aún
              const linkReferral = async (retries = 5, delayMs = 600) => {
                for (let i = 0; i < retries; i++) {
                  console.log(`💎 AuthCallback: Intento ${i + 1}/${retries} - buscando perfil...`);
                  const { data: profile, error: selectErr } = await (supabase
                    .from("profiles") as any)
                    .select("referred_by_id")
                    .eq("user_id", session.user.id)
                    .maybeSingle();

                  console.log("💎 AuthCallback: profile =", profile);
                  console.log("💎 AuthCallback: selectErr =", selectErr);

                  if (!profile) {
                    console.log(`💎 AuthCallback: Perfil aún no existe, reintento ${i + 1}/${retries}...`);
                    await new Promise(r => setTimeout(r, delayMs));
                    continue;
                  }

                  console.log("💎 AuthCallback: referred_by_id actual =", profile.referred_by_id);

                  if (!profile.referred_by_id) {
                    console.log("💎 AuthCallback: Ejecutando update referred_by_id =", referralId);
                    const { data: updateData, error: updErr } = await (supabase
                      .from("profiles") as any)
                      .update({ referred_by_id: referralId })
                      .eq("user_id", session.user.id)
                      .select();
                    if (updErr) {
                      console.error("💎 AuthCallback: ❌ Error update referido:", updErr);
                      console.error("💎 AuthCallback: updateData =", updateData);
                    } else {
                      console.log("💎 AuthCallback: ✅ Referido vinculado exitosamente:", referralId);
                      console.log("💎 AuthCallback: update result =", updateData);
                    }
                  } else {
                    console.log("💎 AuthCallback: Perfil ya tiene referido, omitiendo.");
                  }
                  break;
                }
              };
              await linkReferral();
              await queryClient.invalidateQueries({ queryKey: ["profile", "current", session.user.id] });
              localStorage.removeItem("hf_referral_id");
            } catch (refErr) {
              console.error("💎 AuthCallback: Error al vincular referido:", refErr);
            }
          } else if (!referralId) {
            console.log("💎 AuthCallback: ❌ No hay referral ID disponible, omitiendo vinculación.");
          } else if (referralId === session.user.id) {
            console.log("💎 AuthCallback: Referral ID es el mismo usuario, evitando auto-referencia.");
          }

          // Check for returnTo param (from QR flow)
          // Fallback: si Supabase/Google droppeó el query param, intentar sessionStorage
          const returnToParam = searchParams.get("returnTo");
          const returnToFromSession = sessionStorage.getItem(PENDING_SAVE_URL_KEY);
          const returnToFromFallback = localStorage.getItem(PENDING_SAVE_URL_FALLBACK_KEY);
          const pendingSaveRaw = sessionStorage.getItem(PENDING_SAVE_KEY)
            || localStorage.getItem(PENDING_SAVE_BACKUP_KEY);

          let derivedReturnTo: string | null = null;
          if (!returnToParam && !returnToFromSession && !returnToFromFallback && pendingSaveRaw) {
            try {
              const { propertyId } = JSON.parse(pendingSaveRaw);
              if (propertyId) {
                derivedReturnTo = ROUTES.PUBLIC_PROPERTY(propertyId);
              }
            } catch (parseError) {
              console.error("💎 AuthCallback: No se pudo derivar returnTo desde pending save:", parseError);
            }
          }

          const returnTo = returnToParam
            || returnToFromSession
            || returnToFromFallback
            || derivedReturnTo;

          console.log("💎 AuthCallback: resolución de returnTo", {
            returnToParam,
            returnToFromSession,
            returnToFromFallback,
            derivedReturnTo,
            resolvedReturnTo: returnTo,
            pendingSaveRaw,
          });

          const isPublicPropertyRoute =
            returnTo?.startsWith("/p/") || returnTo?.startsWith("/property/");

          if (returnTo && isPublicPropertyRoute) {
            sessionStorage.removeItem(PENDING_SAVE_URL_KEY);
            localStorage.removeItem(PENDING_SAVE_URL_FALLBACK_KEY);
            console.log("💎 AuthCallback: Redirigiendo de nuevo a la propiedad pública:", returnTo);
            navigate(returnTo, { replace: true });
            return;
          }

          if (hasPendingSave) {
            console.warn("💎 AuthCallback: Hay pending save pero no se resolvió un returnTo público válido.", {
              returnTo,
              isPublicPropertyRoute,
            });
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
  }, [navigate, searchParams, redirectByRole, toast, queryClient]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
      <p className="text-muted-foreground text-sm">Procesando autenticación...</p>
    </div>
  );
};

export default AuthCallback;
