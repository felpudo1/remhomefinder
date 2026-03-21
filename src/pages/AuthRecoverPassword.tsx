import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Home, Mail, Loader2, ArrowLeft } from "lucide-react";
import authBgImg from "@/assets/auth-bg.jpg";
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
 * Pedir enlace de recuperación por email (misma cuenta Supabase para familia y agente).
 */
const AuthRecoverPassword = () => {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();
  const { loading, requestPasswordReset } = useAuth();
  const { value: showVideo } = useSystemConfig(SHOW_AUTH_VIDEO_CONFIG_KEY, SHOW_AUTH_VIDEO_DEFAULT);
  const { value: appBrandName, isLoading: brandLoading } = useSystemConfig(
    APP_BRAND_NAME_KEY,
    APP_BRAND_NAME_DEFAULT
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await requestPasswordReset(email.trim());
    if (res.success) {
      setEmail("");
    }
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
            <p className="text-muted-foreground text-sm">Recuperar contraseña</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Te enviamos instrucciones al correo (válido para usuarios y agentes). Revisá también spam.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recover-email">Email de tu cuenta</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="recover-email"
                  type="email"
                  autoComplete="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 h-11 rounded-xl"
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full h-11 rounded-xl" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Enviando…
                </>
              ) : (
                "Enviar"
              )}
            </Button>
          </form>

          <Button
            type="button"
            variant="ghost"
            className="w-full gap-2 text-muted-foreground"
            onClick={() => navigate(ROUTES.AUTH)}
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio de sesión
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AuthRecoverPassword;
