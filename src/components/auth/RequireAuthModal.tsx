import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { InputPhone } from "@/components/ui/InputPhone";
import { Loader2, Mail, Lock, Eye, EyeOff, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RequireAuthModalProps {
  open: boolean;
  onClose: () => void;
  /** Callback después de login/signup exitoso con el user_id */
  onAuthenticated: (userId: string) => void;
  /** URL actual para redirect post-OAuth */
  returnUrl: string;
}

/**
 * Modal de autenticación para la vista pública de propiedad.
 * Soporta Google OAuth con redirectTo y email/password con registro completo.
 * Guarda estado pendiente en sessionStorage para recuperar post-OAuth.
 * 
 * Registro completo incluye: nombre, teléfono, confirmación de password y aceptación de términos.
 */
export function RequireAuthModal({
  open,
  onClose,
  onAuthenticated,
  returnUrl,
}: RequireAuthModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  /**
   * Verifica que el trigger guardó referred_by_id. Si no, hace update manual.
   * Incluye retry para esperar que el trigger cree el perfil.
   */
  const verifyAndLinkReferral = async (userId: string, referralId: string) => {
    try {
      for (let attempt = 1; attempt <= 5; attempt++) {
        const { data: profile, error: selErr } = await (supabase
          .from("profiles") as any)
          .select("referred_by_id")
          .eq("user_id", userId)
          .maybeSingle();

        if (selErr) {
          console.error("RequireAuthModal: Error leyendo perfil post-signup:", selErr);
          break;
        }

        if (!profile) {
          console.log(`RequireAuthModal: Perfil aún no existe, reintento ${attempt}/5...`);
          await new Promise(r => setTimeout(r, 800));
          continue;
        }

        if (profile.referred_by_id) {
          console.log("RequireAuthModal: ✅ Trigger guardó referred_by_id:", profile.referred_by_id);
          break;
        }

        // Trigger no guardó el referral → update manual
        console.log("RequireAuthModal: Trigger no guardó referral, update manual con:", referralId);
        const { error: updErr } = await (supabase
          .from("profiles") as any)
          .update({ referred_by_id: referralId })
          .eq("user_id", userId);

        if (updErr) {
          console.error("RequireAuthModal: ❌ Error en update manual de referral:", updErr);
        } else {
          console.log("RequireAuthModal: ✅ Referral vinculado manualmente.");
        }
        break;
      }
    } catch (err) {
      console.error("RequireAuthModal: Error verificando referral:", err);
    }
  };

  /**
   * Maneja login o registro con email/password.
   * En modo registro: valida confirmPassword, datos requeridos y términos aceptados.
   */
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // Login: solo necesita email y password
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) onAuthenticated(data.user.id);
      } else {
        // Registro: validaciones completas
        if (password.length < 6) {
          toast({ title: "La contraseña debe tener al menos 6 caracteres", variant: "destructive" });
          setLoading(false);
          return;
        }

        if (password !== confirmPassword) {
          toast({ title: "Las contraseñas no coinciden", variant: "destructive" });
          setLoading(false);
          return;
        }

        if (!acceptedTerms) {
          toast({ title: "Aceptá los términos", description: "Marcá la casilla para continuar con el registro.", variant: "destructive" });
          setLoading(false);
          return;
        }

        // Crear cuenta con metadata completa
        // El referral_id se pasa en metadata y el trigger handle_new_user_profile
        // lo lee automáticamente y actualiza profiles.referred_by_id
        const referralId = localStorage.getItem("hf_referral_id") || null;
        
        console.log("RequireAuthModal: signUp con referral_id =", referralId);
        
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              account_type: "user",
              display_name: familyName.trim(),
              phone: userPhone.trim(),
              referral_id: referralId || undefined,
            },
          },
        });
        if (error) throw error;
        if (data.user) {
          if (data.session) {
            // Verificar que el trigger guardó el referral correctamente
            // Si no lo hizo, hacer update manual como fallback
            if (referralId) {
              await verifyAndLinkReferral(data.user.id, referralId);
            }
            localStorage.removeItem("hf_referral_id");
            onAuthenticated(data.user.id);
          } else {
            toast({
              title: "Verificá tu email",
              description: "Te enviamos un enlace de confirmación. Después de verificar, volvé a esta página.",
            });
            onClose();
          }
        }
      }
    } catch (err: any) {
      toast({
        title: isLogin ? "Error al iniciar sesión" : "Error al registrarse",
        description: err?.message || "Ocurrió un error inesperado.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    // Guardar estado pendiente para post-OAuth
    sessionStorage.setItem("pending_save_url", returnUrl);

    // Preservar referral ID en la URL de redirect
    const redirectUrl = new URL(`${window.location.origin}/auth/callback`);
    redirectUrl.searchParams.set("returnTo", returnUrl);
    const existingReferral = localStorage.getItem("hf_referral_id");
    if (existingReferral) {
      redirectUrl.searchParams.set("ref", existingReferral);
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl.toString(),
      },
    });

    if (error) {
      toast({
        title: "Error al iniciar sesión con Google",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isLogin ? "Iniciar sesión" : "Crear cuenta"}</DialogTitle>
          <DialogDescription>
            {isLogin
              ? "Iniciá sesión para guardar esta propiedad en tu listado."
              : "Creá tu cuenta gratuita para guardar propiedades."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Google OAuth */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-11 rounded-xl gap-3 font-medium"
            onClick={handleGoogleSignIn}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continuar con Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">o con email</span>
            </div>
          </div>

          {/* Email/Password form */}
          <form onSubmit={handleEmailAuth} className="space-y-3">
            {/* Nombre de contacto (solo en registro) */}
            {!isLogin && (
              <div className="space-y-1.5">
                <Label htmlFor="auth-familyName">Nombre de contacto</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="auth-familyName"
                    type="text"
                    placeholder="Tu nombre"
                    value={familyName}
                    onChange={(e) => setFamilyName(e.target.value)}
                    className="pl-9 h-11 rounded-xl"
                    required
                  />
                </div>
              </div>
            )}

            {/* Teléfono de contacto (solo en registro) */}
            {!isLogin && (
              <InputPhone
                id="auth-userPhone"
                label="Teléfono de contacto"
                countryCode="+598"
                placeholder="99 123 456"
                value={userPhone}
                onChange={(e) => setUserPhone(e.target.value)}
              />
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="auth-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="pl-9 h-11 rounded-xl"
                  required
                />
              </div>
            </div>

            {/* Contraseña */}
            <div className="space-y-1.5">
              <Label htmlFor="auth-password">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="auth-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  className="pl-9 pr-9 h-11 rounded-xl"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirmar contraseña (solo en registro) */}
            {!isLogin && (
              <div className="space-y-1.5">
                <Label htmlFor="auth-confirmPassword">Repetir contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="auth-confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••"
                    className="pl-9 h-11 rounded-xl"
                    required
                    minLength={6}
                  />
                </div>
              </div>
            )}

            {/* Aceptar términos (solo en registro) */}
            {!isLogin && (
              <div className="rounded-xl border border-border/80 bg-muted/20 p-3">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="auth-accept-terms"
                    checked={acceptedTerms}
                    onCheckedChange={(v) => setAcceptedTerms(v === true)}
                    className="mt-0.5"
                  />
                  <label htmlFor="auth-accept-terms" className="text-sm leading-snug text-foreground font-medium cursor-pointer select-none">
                    Acepto los{" "}
                    <a
                      href="/terminos"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-foreground underline underline-offset-2 decoration-primary decoration-2 hover:text-primary"
                    >
                      Términos y condiciones
                    </a>{" "}
                    y la{" "}
                    <a
                      href="/privacidad"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-foreground underline underline-offset-2 decoration-primary decoration-2 hover:text-primary"
                    >
                      Política de privacidad
                    </a>
                    .
                  </label>
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 rounded-xl"
              disabled={loading || (!isLogin && !acceptedTerms)}
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isLogin ? "Iniciar sesión" : "Crear cuenta"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {isLogin ? "¿No tenés cuenta? " : "¿Ya tenés cuenta? "}
            <button
              type="button"
              className="text-primary underline font-medium"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "Registrate" : "Iniciá sesión"}
            </button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
