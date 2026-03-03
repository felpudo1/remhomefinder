import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Home, Mail, Lock, Eye, EyeOff, Database, Wifi, WifiOff, Loader2, Building2, Users, Phone } from "lucide-react";
import authBgImg from "@/assets/auth-bg.jpg";
import { useToast } from "@/hooks/use-toast";
import { DbStatusBadge } from "@/components/ui/DbStatusBadge";
import { useAuth } from "@/hooks/useAuth";
import { ROLES, ROUTES } from "@/lib/constants";

// Tipos posibles del estado de la base de datos
type AccountType = "user" | "agency";

/**
 * La lógica de DbStatusBadge se ha movido a /components/ui/DbStatusBadge.tsx
 * para mejorar la modularidad (Regla 2).
 */

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [accountType, setAccountType] = useState<AccountType>("user");
  const [agencyName, setAgencyName] = useState("");
  const [agencyPhone, setAgencyPhone] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [familyName, setFamilyName] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { loading, signIn, signUp, redirectByRole } = useAuth();

  useEffect(() => {
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) redirectByRole(session.user.id);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) redirectByRole(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, [navigate, redirectByRole]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLogin) {
      await signIn(email, password);
    } else {
      await signUp({
        email,
        password,
        confirmPassword, // Pasado para validación Zod
        accountType,
        displayName: familyName.trim() || agencyName.trim(),
        phone: userPhone.trim(),
        agencyName: agencyName.trim(),
        agencyPhone: agencyPhone.trim()
      });
    }
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
        {/* Contenedor de la imagen de fondo con efectos y filtros */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-[10000ms] scale-100 animate-slow-zoom"
          style={{ backgroundImage: `url(${authBgImg})` }} />


        {/* Overlay oscuro y blur para mejorar legibilidad */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />

        <div className="w-full max-w-sm space-y-8 relative z-10">
          <div className="bg-background/40 backdrop-blur-2xl border border-white/20 rounded-2xl p-8 space-y-8 shadow-2xl">
            {/* Logo */}
            <div className="text-center space-y-2">
              <button
                onClick={() => navigate("/")}
                className="group inline-flex flex-col items-center gap-2"
              >
                <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center mx-auto transition-transform group-hover:scale-110 shadow-lg shadow-primary/20">
                  <Home className="w-6 h-6 text-primary-foreground" />
                </div>
                <h1 className="text-2xl font-bold text-foreground tracking-tight">HomeFinder</h1>
              </button>
              <p className="text-muted-foreground text-sm">
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
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-sm ${accountType === "user" ?
                      "border-primary bg-primary/5 text-primary" :
                      "border-border text-muted-foreground hover:border-primary/30"}`
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
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-sm ${accountType === "agency" ?
                      "border-primary bg-primary/5 text-primary" :
                      "border-border text-muted-foreground hover:border-primary/30"}`
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
                    <Label htmlFor="agencyName">Nombre de la agencia</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="agencyName"
                        type="text"
                        placeholder="Agencia Ejemplo S.A."
                        value={agencyName}
                        onChange={(e) => setAgencyName(e.target.value)}
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
                  <Label htmlFor="agencyPhone">Teléfono empresa</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="agencyPhone"
                      type="tel"
                      placeholder="+598 2 123 4567"
                      value={agencyPhone}
                      onChange={(e) => setAgencyPhone(e.target.value)}
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

              <Button
                type="submit"
                className="w-full h-11 rounded-xl"
                disabled={loading}>

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
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary font-medium hover:underline">

                {isLogin ? "Registrate" : "Iniciá sesión"}
              </button>
            </p>
          </div>
        </div>
      </div>

      <DbStatusBadge />
    </>);

};

export default Auth;