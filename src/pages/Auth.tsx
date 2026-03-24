import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Home, Mail, Lock, Eye, EyeOff, Loader2, Building2, Users, Phone } from "lucide-react";
import authBgImg from "@/assets/auth-bg.jpg";
import { useToast } from "@/hooks/use-toast";
import { DbStatusBadge } from "@/components/ui/DbStatusBadge";
import { useAuth } from "@/hooks/useAuth";
import { ROLES, ROUTES } from "@/lib/constants";
import { Footer } from "@/components/Footer";
import { useSystemConfig } from "@/hooks/useSystemConfig";
import {
  SHOW_AUTH_VIDEO_CONFIG_KEY,
  SHOW_AUTH_VIDEO_DEFAULT,
  APP_BRAND_NAME_DEFAULT,
  APP_BRAND_NAME_KEY,
} from "@/lib/config-keys";
import {
  readAuthRegisterDraft,
  writeAuthRegisterDraft,
  clearAuthRegisterDraft,
} from "@/lib/authRegisterDraftStorage";

// Tipos posibles del estado de la base de datos
type AccountType = "user" | "agency";

/**
 * DbStatusBadge solo se muestra si falla la conexión a la BD (ver componente).
 */

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [accountType, setAccountType] = useState<AccountType>("user");
  const [orgName, setOrgName] = useState("");
  const [orgPhone, setOrgPhone] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [familyName, setFamilyName] = useState("");
  /** Obligatorio solo en registro: aceptación de términos y privacidad */
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  /** Evita guardar el borrador vacío antes de hidratar desde sessionStorage */
  const registerHydratedRef = useRef(false);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { loading, isSigningUp, signIn, signUp, redirectByRole } = useAuth();
  const { value: showVideo } = useSystemConfig(SHOW_AUTH_VIDEO_CONFIG_KEY, SHOW_AUTH_VIDEO_DEFAULT);
  const { value: appBrandName, isLoading: brandLoading } = useSystemConfig(
    APP_BRAND_NAME_KEY,
    APP_BRAND_NAME_DEFAULT
  );

  useEffect(() => {
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && !isSigningUp) redirectByRole(session.user.id);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && !isSigningUp) redirectByRole(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, [navigate, redirectByRole, isSigningUp]);

  /** Vuelta desde /terminos o /privacidad: abrir registro y limpiar ?register=1 de la URL */
  useEffect(() => {
    if (searchParams.get("register") !== "1") return;
    setIsLogin(false);
    const next = new URLSearchParams(searchParams);
    next.delete("register");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  /**
   * Al entrar en modo registro: una vez hidratar desde sessionStorage.
   * Después, cada cambio guarda el borrador para no perder datos al navegar a legales.
   */
  useEffect(() => {
    if (isLogin) {
      registerHydratedRef.current = false;
      return;
    }
    if (!registerHydratedRef.current) {
      registerHydratedRef.current = true;
      const d = readAuthRegisterDraft();
      if (d) {
        setEmail(d.email);
        setPassword(d.password);
        setConfirmPassword(d.confirmPassword);
        setAccountType(d.accountType);
        setOrgName(d.orgName);
        setOrgPhone(d.orgPhone);
        setUserPhone(d.userPhone);
        setFamilyName(d.familyName);
        setAcceptedTerms(d.acceptedTerms);
      }
      return;
    }
    writeAuthRegisterDraft({
      email,
      password,
      confirmPassword,
      accountType,
      orgName,
      orgPhone,
      userPhone,
      familyName,
      acceptedTerms,
    });
  }, [
    isLogin,
    email,
    password,
    confirmPassword,
    accountType,
    orgName,
    orgPhone,
    userPhone,
    familyName,
    acceptedTerms,
  ]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLogin) {
      await signIn(email, password);
    } else {
      if (!acceptedTerms) {
        toast({
          title: "Aceptá los términos",
          description: "Marcá la casilla para continuar con el registro.",
          variant: "destructive",
        });
        return;
      }
      const signUpResult = await signUp({
        email,
        password,
        confirmPassword, // Pasado para validación Zod
        accountType,
        displayName: familyName.trim() || orgName.trim(),
        phone: userPhone.trim(),
        orgName: orgName.trim(),
        orgPhone: orgPhone.trim()
      });
      if (signUpResult && typeof signUpResult === "object" && "success" in signUpResult && signUpResult.success) {
        clearAuthRegisterDraft();
      }
    }
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
        {/* Contenedor del video de fondo - Condicional según AdminSystem */}
        {showVideo === "true" ? (
          <div className="absolute inset-0 -z-10">
            <video
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover"
            >
              <source src="/assets/videos/11661546-hd_720_1280_30fps+.mp4" type="video/mp4" />
            </video>
          </div>
        ) : (
          <div className="absolute inset-0 -z-10">
            <img
              src={authBgImg}
              alt="Fondo"
              className="w-full h-full object-cover"
            />
          </div>
        )}


        {/* Overlay oscuro y blur para mejorar legibilidad */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />

        <div className="w-full max-w-sm space-y-8 relative z-10">
          <div className="bg-background/40 backdrop-blur-2xl border border-white/20 rounded-2xl p-8 space-y-8 shadow-2xl">
            {/* Logo */}
            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="group inline-flex flex-col items-center gap-2"
              >
                <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center mx-auto transition-transform group-hover:scale-110 shadow-lg shadow-primary/20">
                  <Home className="w-6 h-6 text-primary-foreground" />
                </div>
                <h1 className="text-2xl font-bold text-foreground tracking-tight min-h-[2rem]">
                  {brandLoading ? (
                    <span className="inline-block h-8 w-40 max-w-[85%] mx-auto bg-muted/60 rounded-md animate-pulse" />
                  ) : (
                    appBrandName || "\u00a0"
                  )}
                </h1>
              </button>
              <p className="text-primary text-sm">
                {isLogin ? "Iniciá sesión para continuar" : "Creá tu cuenta"}
              </p>
            </div>

            {/* Selector de tipo de cuenta (solo en registro) */}
            {!isLogin &&
              <div className="space-y-2">
                <Label>Tipo de cuenta</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAccountType("user")}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all text-sm ${accountType === "user" ?
                      "border-4 border-primary bg-transparent text-primary" :
                      "border-2 border-primary/40 bg-transparent text-foreground hover:border-primary/60"}`
                    }>
                    
                    <Users className="w-5 h-5" />
                    <span className="font-medium">Familia</span>
                    <span className="text-[10px] leading-tight opacity-70">
                      Busco departamento
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountType("agency")}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all text-sm ${accountType === "agency" ?
                      "border-4 border-primary bg-transparent text-primary" :
                      "border-2 border-primary/40 bg-transparent text-foreground hover:border-primary/60"}`
                    }>

                    <Building2 className="w-5 h-5" />
                    <span className="font-medium">Agente</span>
                    <span className="text-[10px] leading-tight opacity-70">
                      Publico propiedades
                    </span>
                  </button>
                </div>
              </div>
            }

            {/* Formulario */}
            <form onSubmit={handleEmailAuth} className="space-y-4">
              {/* Campos de agente (solo en registro como agency) */}
              {!isLogin && accountType === "agency" &&
                <>
                  <div className="space-y-2">
                    <Label htmlFor="orgName">Nombre de la organización</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="orgName"
                        type="text"
                        placeholder="Organización Ejemplo S.A."
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        className="pl-9 h-11 rounded-xl"
                        required />

                    </div>
                  </div>
                </>
              }

              {/* Nombre de contacto (todos en registro) */}
              {!isLogin &&
                <div className="space-y-2">
                  <Label htmlFor="familyName">Nombre de contacto</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="familyName"
                      type="text"
                      // Nombre del usuario o familia para el perfil
                      placeholder="Nombre"
                      value={familyName}
                      onChange={(e) => setFamilyName(e.target.value)}
                      className="pl-9 h-11 rounded-xl"
                      required />
                  </div>
                </div>
              }

              {/* Teléfono de contacto personal (todos en registro) */}
              {!isLogin &&
                <div className="space-y-2">
                  <Label htmlFor="userPhone">Teléfono de contacto</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="userPhone"
                      type="tel"
                      placeholder="+598 99 123 456"
                      value={userPhone}
                      onChange={(e) => setUserPhone(e.target.value)}
                      className="pl-9 h-11 rounded-xl" />
                  </div>
                </div>
              }

              {/* Teléfono empresa (solo agencias) */}
              {!isLogin && accountType === "agency" &&
                <div className="space-y-2">
                  <Label htmlFor="orgPhone">Teléfono empresa</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="orgPhone"
                      type="tel"
                      placeholder="+598 2 123 4567"
                      value={orgPhone}
                      onChange={(e) => setOrgPhone(e.target.value)}
                      className="pl-9 h-11 rounded-xl" />
                  </div>
                </div>
              }

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 h-11 rounded-xl"
                    required />

                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-10 h-11 rounded-xl"
                    required
                    minLength={6} />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">

                    {showPassword ?
                      <EyeOff className="w-4 h-4" /> :

                      <Eye className="w-4 h-4" />
                    }
                  </button>
                </div>
                {isLogin && (
                  <div className="text-right pt-1">
                    <Link
                      to={ROUTES.AUTH_RECOVER}
                      className="text-xs font-medium text-foreground underline underline-offset-2 decoration-primary/70 hover:text-primary"
                    >
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
                )}
              </div>

              {/* Campo de confirmación de contraseña (solo en registro) */}
              {!isLogin &&
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Repetir contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-9 h-11 rounded-xl"
                      required
                      minLength={6} />

                  </div>
                </div>
              }

              {!isLogin && (
                <div className="rounded-xl border border-border/80 bg-muted/20 p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="auth-accept-terms"
                      checked={acceptedTerms}
                      onCheckedChange={(v) => setAcceptedTerms(v === true)}
                      className="mt-0.5"
                    />
                    <label htmlFor="auth-accept-terms" className="text-sm leading-snug text-foreground font-medium cursor-pointer select-none">
                      Acepto los{" "}
                      <Link
                        to={ROUTES.TERMS}
                        className="font-semibold text-foreground underline underline-offset-2 decoration-primary decoration-2 hover:text-primary"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Términos y condiciones
                      </Link>{" "}
                      y la{" "}
                      <Link
                        to={ROUTES.PRIVACY}
                        className="font-semibold text-foreground underline underline-offset-2 decoration-primary decoration-2 hover:text-primary"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Política de privacidad
                      </Link>
                      .
                    </label>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-11 rounded-xl"
                disabled={loading || (!isLogin && !acceptedTerms)}>

                {loading ?
                  "Cargando..." :
                  isLogin ?
                    "Iniciar sesión" :
                    accountType === "agency" ?
                      "Solicitar registro" :
                      "Crear cuenta"}
              </Button>
            </form>

            {/* Info para agentes */}
            {!isLogin && accountType === "agency" &&
              <p className="text-[11px] text-center text-muted-foreground leading-tight">
                Tu cuenta será revisada y aprobada por un administrador antes de poder publicar propiedades.
              </p>
            }

            {/* Toggle login / registro */}
            <p className="text-center text-sm text-muted-foreground">
              {isLogin ? "¿No tenés cuenta?" : "¿Ya tenés cuenta?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setAcceptedTerms(false);
                }}
                className="text-primary font-medium hover:underline">

                {isLogin ? "Registrate" : "Iniciá sesión"}
              </button>
            </p>
          </div>
        </div>
      </div>

      <DbStatusBadge />
      <Footer />
    </>);

};

export default Auth;