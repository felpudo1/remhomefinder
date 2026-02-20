import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Home, Mail, Lock, Eye, EyeOff, Database, Wifi, WifiOff, Loader2 } from "lucide-react";
import authBgImg from "@/assets/auth-bg.jpg";
import { useToast } from "@/hooks/use-toast";

// Tipos posibles del estado de la base de datos
type DbStatus = "checking" | "connected" | "error";

/**
 * Badge que muestra el estado de conexión con la base de datos Supabase.
 * Hace un ping real al endpoint REST de Supabase con la anon key.
 * Se posiciona fijo en la esquina inferior izquierda de la pantalla.
 *
 * Estados posibles:
 * - checking: verificando la conexión (muestra spinner)
 * - connected: BD respondió correctamente (verde + latencia en ms)
 * - error: no se pudo alcanzar la BD (rojo)
 */
function DbStatusBadge() {
  const [status, setStatus] = useState<DbStatus>("checking");
  const [latency, setLatency] = useState<number | null>(null);

  useEffect(() => {
    // Función que verifica la conexión haciendo una query liviana a Supabase
    const checkConnection = async () => {
      setStatus("checking");
      const start = performance.now();
      try {
        // Head request liviano — solo verifica si la tabla existe, no trae datos
        // Si hay error de red la promesa rechaza; si hay error de auth la BD está OK
        const { error } = await supabase
          .from("properties")
          .select("id", { count: "exact", head: true })
          .limit(1);

        const ms = Math.round(performance.now() - start);
        setLatency(ms);

        // Solo si es un error de red (fetch failed) marcamos como "error"
        // Errores de auth/RLS significan que la BD responde → connected
        if (error && error.message.toLowerCase().includes("fetch")) {
          setStatus("error");
        } else {
          setStatus("connected");
        }
      } catch {
        // Error de red inesperado
        setStatus("error");
      }
    };

    // Verificar al montar y luego cada 30 segundos
    checkConnection();
    const interval = setInterval(checkConnection, 30_000);
    return () => clearInterval(interval);
  }, []);

  // Configuración visual según el estado actual
  const config = {
    checking: {
      label: "Verificando BD...",
      icon: <Loader2 className="w-3 h-3 animate-spin" />,
      classes: "bg-muted/80 text-muted-foreground border-border",
    },
    connected: {
      label: "Base de datos conectada",
      icon: <Wifi className="w-3 h-3" />,
      classes: "bg-green-500/10 text-green-600 border-green-500/30",
    },
    error: {
      label: "Sin conexión a BD",
      icon: <WifiOff className="w-3 h-3" />,
      classes: "bg-red-500/10 text-red-600 border-red-500/30",
    },
  }[status];

  return (
    <div
      className={`fixed bottom-5 left-5 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium backdrop-blur-sm shadow-sm transition-all duration-500 ${config.classes}`}
    >
      {/* Ícono de base de datos */}
      <Database className="w-3 h-3 opacity-70" />
      {/* Ícono de estado: spinner / wifi / wifi-off */}
      {config.icon}
      {/* Texto descriptivo del estado */}
      <span>{config.label}</span>
      {/* Latencia en ms, solo visible cuando está conectado */}
      {status === "connected" && latency !== null && (
        <span className="opacity-60">{latency}ms</span>
      )}
    </div>
  );
}

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/");
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLogin && password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast({
          title: "¡Cuenta creada!",
          description: "Revisá tu email para confirmar tu cuenta.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Pantalla principal de auth con fondo de imagen */}
      <div
        className="min-h-screen flex items-center justify-center px-4 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${authBgImg})` }}
      >
        <div className="w-full max-w-sm space-y-8 relative rounded-2xl p-[3px] bg-gradient-to-br from-primary via-primary/50 to-transparent shadow-2xl">
          <div className="bg-background/90 backdrop-blur-md rounded-2xl p-8 space-y-8">

            {/* Logo */}
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center mx-auto">
                <Home className="w-6 h-6 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                BuscandoMiCasaPerfecta
              </h1>
              <p className="text-muted-foreground text-sm">
                {isLogin ? "Iniciá sesión para continuar" : "Creá tu cuenta"}
              </p>
            </div>

            {/* Formulario de email/contraseña */}
            <form onSubmit={handleEmailAuth} className="space-y-4">
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
                    required
                  />
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

              {/* Campo de confirmación de contraseña (solo en registro) */}
              {!isLogin && (
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
                      minLength={6}
                    />
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full h-11 rounded-xl" disabled={loading}>
                {loading ? "Cargando..." : isLogin ? "Iniciar sesión" : "Crear cuenta"}
              </Button>
            </form>

            {/* Toggle login / registro */}
            <p className="text-center text-sm text-muted-foreground">
              {isLogin ? "¿No tenés cuenta?" : "¿Ya tenés cuenta?"}{" "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary font-medium hover:underline"
              >
                {isLogin ? "Registrate" : "Iniciá sesión"}
              </button>
            </p>

          </div>
        </div>
      </div>

      {/* Badge de estado de la BD — fijo en esquina inferior izquierda */}
      <DbStatusBadge />
    </>
  );
};

export default Auth;
