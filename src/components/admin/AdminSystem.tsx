import { Monitor } from "lucide-react";
import { AdminMaintenance } from "./system/AdminMaintenance";
import { AdminPlans } from "./system/AdminPlans";
import { AdminSupport } from "./system/AdminSupport";
import { AdminVideoConfig } from "./system/AdminVideoConfig";
import { AdminButtons } from "./system/AdminButtons";
import { AdminAuditLog } from "./system/AdminAuditLog";
import { AdminMarketplaceTips } from "./system/AdminMarketplaceTips";
import { AdminBranding } from "./system/AdminBranding";
import { Separator } from "@/components/ui/separator";

/**
 * Componente principal del panel de administración del sistema.
 * Refactorizado para usar sub-componentes modulares según principios de SRP (REGLA 2).
 */
export function AdminSystem() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Monitor className="w-4 h-4" />
                <p>Estos ajustes controlan qué elementos de UI se muestran a los usuarios regulares de la plataforma.</p>
            </div>

            {/* Escudo de Mantenimiento / Kill Switch */}
            <AdminMaintenance />

            {/* Configuración de Planes y Límites */}
            <AdminPlans />

            {/* Configuración de Canales de Soporte */}
            <AdminSupport />

            {/* Configuración de Video de Fondo */}
            <AdminVideoConfig />

            {/* Configuración de Botones de Interfaz */}
            <AdminButtons />

            {/* Configuración del tip de contacto en marketplace */}
            <AdminMarketplaceTips />

            {/* Configuración de nombre comercial de la app */}
            <AdminBranding />

            <Separator className="my-2" />

            {/* Panel de auditoría de acciones críticas — solo lectura */}
            <AdminAuditLog />
        </div>
    );
}
