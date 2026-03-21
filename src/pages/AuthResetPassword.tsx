import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Home, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import authBgImg from "@/assets/auth-bg.jpg";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/lib/constants";
import { useSystemConfig } from "@/hooks/useSystemConfig";
import {
  SHOW_AUTH_VIDEO_CONFIG_KEY,
  SHOW_AUTH_VIDEO_DEFAULT,
  APP_BRAND_NAME_DEFAULT,
  APP_BRAND_NAME_KEY,
} from "@/lib/config-keys";

/**
 * Nueva contraseña tras abrir el link del email de Supabase (recovery).
 * Misma cuenta para usuario familia o agente.
 */
const AuthResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  /** null = comprobando sesión de recuperación; true = ok; false = enlace inválido o vencido */
  const [recoveryOk, setRecoveryOk] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const { loading, completePasswordReset } = useAuth();
  const { value: showVideo } = useSystemConfig(SHOW_AUTH_VIDEO_CONFIG_KEY, SHOW_AUTH_VIDEO_DEFAULT);
  const { value: appBrandName, isLoading: brandLoading } = useSystemConfig(
    APP_BRAND_NAME_KEY,
    APP_BRAND_NAME_DEFAULT
  );

  useEffect(() => {
    let cancelled = false;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (session && (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN")) {
        setRecoveryOk(true);
      }
    });

    const checkSession = async () => {
      await new Promise((r) => setTimeout(r, 200));
      if (cancelled) return;
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session) {
        setRecoveryOk(true);
      } else {
        setRecoveryOk(false);
      }
    };
    void checkSession();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await completePasswordReset(password, confirmPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {showVideo === "true" ? (
        <div className="absolute inset-0 -z-10">
          <video autoPlay muted loop playsInline className="w-full h-full object-cover">
            <source src="/assets/videos/11661546-hd_720_1280_30fps+.mp4" type="video/mp4" />
          </video>
        </div>
      ) : (
        <div className="absolute inset-0 -z-10">
          <img src={authBgImg} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />

      <div className="w-full max-w-sm space-y-6 relative z-10">
        <div className="bg-background/40 backdrop-blur-2xl border border-white/20 rounded-2xl p-8 space-y-6 shadow-2xl">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-primary/20">
              <Home className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground tracking-tight min-h-[1.75rem]">
              {brandLoading ? <span className="inline-block h-7 w-36 max-w-[80%] mx-auto bg-muted/60 rounded-md animate-pulse" /> : appBrandName || "\u00a0"}
            </h1>
            <p className="text-muted-foreground text-sm">Nueva contraseña</p>
          </div>

          {recoveryOk === null && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {recoveryOk === false && (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                Este enlace no es válido o expiró. Pedí uno nuevo desde inicio de sesión.
              </p>
              <Button type="button" className="w-full rounded-xl" onClick={() => navigate(ROUTES.AUTH_RECOVER)}>
                Pedir nuevo enlace
              </Button>
              <Link to={ROUTES.AUTH} className="block text-sm text-primary font-medium hover:underline">
                Ir a iniciar sesión
              </Link>
            </div>
          )}

          {recoveryOk === true && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">Nueva contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-10 h-11 rounded-xl"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-new-password">Repetir contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="confirm-new-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-9 h-11 rounded-xl"
                    required
                    minLength={6}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full h-11 rounded-xl" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Guardando…
                  </>
                ) : (
                  "Guardar contraseña"
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthResetPassword;
