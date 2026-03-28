import { useSystemConfig } from "@/hooks/useSystemConfig";
import { useCurrentUser } from "@/contexts/AuthProvider";
import { useUserRoles } from "@/hooks/useUserRoles";
import { ROLES } from "@/lib/constants";
import { useLocation } from "react-router-dom";
import { AlertTriangle, Hammer, ShieldAlert } from "lucide-react";

/**
 * Componente Escudo de Mantenimiento (REGLA 2: Arquitectura de Componentes)
 * Se encarga de bloquear el acceso a la aplicación cuando el modo mantenimiento está activo.
 * Implementa un bypass para administradores para permitirles seguir operando.
 */
export function MaintenanceShield() {
  const location = useLocation();
  // Leemos el estado desde la BD (usando nuestro hook genérico de configuración)
  const { value: maintenanceMode } = useSystemConfig("maintenance_mode", "false");
  const { value: maintenanceMessage } = useSystemConfig("maintenance_message", "Mantenimiento...");
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-xl p-6 text-center">
      <div className="max-w-md space-y-6 animate-in fade-in zoom-in duration-500">
        <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
          <Hammer className="w-10 h-10 text-primary animate-bounce" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tighter text-foreground uppercase">SISTEMA EN PAUSA</h1>
          <p className="text-muted-foreground font-medium leading-relaxed italic">
            "{maintenanceMessage}"
          </p>
        </div>
        <div className="pt-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 text-secondary-foreground text-[10px] font-bold border border-border">
            <AlertTriangle className="w-3 h-3 text-yellow-500" />
            PROTECCIÓN DE INFRAESTRUCTURA ACTIVADA
          </div>
        </div>
      </div>
    </div>
  );
}
