import { useSystemConfig } from "@/hooks/useSystemConfig";
import { useCurrentUser } from "@/contexts/AuthProvider";
import { useUserRoles } from "@/hooks/useUserRoles";
import { ROLES } from "@/lib/constants";
import { useLocation } from "react-router-dom";
import { AlertTriangle, Hammer, ShieldAlert, Home } from "lucide-react";
import { APP_BRAND_NAME_DEFAULT, APP_BRAND_NAME_KEY } from "@/lib/config-keys";

/**
 * Componente Escudo de Mantenimiento (REGLA 2: Arquitectura de Componentes)
 * Se encarga de bloquear el acceso a la aplicación cuando el modo mantenimiento está activo.
 * Implementa un bypass para administradores para permitirles seguir operando.
 */
export function MaintenanceShield() {
  const location = useLocation();
  // Leemos el estado desde la BD
  const { value: maintenanceMode } = useSystemConfig("maintenance_mode", "false");
  const { value: maintenanceMessage } = useSystemConfig("maintenance_message", "Estamos optimizando la bd");
  const { value: appBrandName } = useSystemConfig(APP_BRAND_NAME_KEY, APP_BRAND_NAME_DEFAULT);
  
  const { user } = useCurrentUser();
  const { data: userRoles = [] } = useUserRoles(user?.id);

  const isActive = maintenanceMode === "true";
  
  // BYPASS DE SEGURIDAD: Los administradores y sysadmins pueden saltarse el bloqueo
  const isSuperUser = userRoles.includes(ROLES.ADMIN) || userRoles.includes(ROLES.SYSADMIN);

  // EXCEPCIÓN: La ruta de Auth (Login) nunca se bloquea para permitir el ingreso
  if (location.pathname.startsWith("/auth")) return null;

  if (!isActive) return null;

  // CASO A: Administrador - Mostramos un aviso discreto pero persistente
  if (isSuperUser) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[9999] bg-yellow-500 text-black text-[10px] font-bold py-1 px-4 flex items-center justify-center gap-2 shadow-lg animate-pulse pointer-events-none">
        <ShieldAlert className="w-3 h-3" />
        SISTEMA PROTEGIDO: MODO MANTENIMIENTO ACTIVO (Bypass Admin)
      </div>
    );
  }

  // CASO B: Usuario Común - Bloqueo total con diseño premium
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/40 backdrop-blur-3xl p-6 text-center select-none overflow-hidden">
      {/* Círculos de fondo decorativos */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 blur-[120px] rounded-full pointer-events-none animate-pulse" />
      <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="relative max-w-lg w-full space-y-8 animate-in fade-in zoom-in duration-700">
        {/* Logo + Brand Section */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/40 ring-4 ring-background animate-in slide-in-from-top-10 duration-1000">
              <Home className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-3xl font-black tracking-tighter text-foreground drop-shadow-sm">
              {appBrandName}
            </span>
          </div>
          <div className="h-px w-24 bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>

        {/* Status Graphic */}
        <div className="mx-auto w-24 h-24 bg-card border border-border rounded-3xl flex items-center justify-center shadow-xl shadow-black/5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors" />
          <Hammer className="w-10 h-10 text-primary animate-bounce relative z-10" />
          <div className="absolute -bottom-2 -left-2 w-8 h-8 bg-blue-500/10 blur-xl rounded-full" />
        </div>

        {/* Message Section */}
        <div className="space-y-4">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight text-foreground uppercase">
              SISTEMA EN <span className="text-primary italic">PAUSA</span>
            </h1>
            <p className="text-xs font-bold text-muted-foreground tracking-widest uppercase opacity-70">
              Mantenimiento Programado
            </p>
          </div>
          
          <div className="bg-card/50 border border-border/50 p-6 rounded-2xl shadow-sm backdrop-blur-sm relative transition-all hover:bg-card/80">
            <p className="text-lg text-foreground/90 font-medium leading-relaxed italic">
              "{maintenanceMessage}"
            </p>
          </div>
        </div>

        {/* Global Protection Badge */}
        <div className="pt-4 flex flex-col items-center gap-4">
          <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 text-[11px] font-black border border-yellow-500/20 shadow-sm animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" />
            ESCUDO DE INFRAESTRUCTURA ACTIVADO
          </div>
        </div>
      </div>
    </div>
  );
}
