import { Monitor, Database, Settings2, FileCode } from "lucide-react";
import { AdminMaintenance } from "./system/AdminMaintenance";
import { AdminPlans } from "./system/AdminPlans";
import { AdminSupport } from "./system/AdminSupport";
import { AdminVideoConfig } from "./system/AdminVideoConfig";
import { AdminButtons } from "./system/AdminButtons";
import { AdminAuditLog } from "./system/AdminAuditLog";
import { AdminMarketplaceTips } from "./system/AdminMarketplaceTips";
import { AdminBranding } from "./system/AdminBranding";
import { AdminMatchScore } from "./system/AdminMatchScore";
import { AdminDetailsDescription } from "./system/AdminDetailsDescription";
import { AdminSystemAlerts } from "./system/AdminSystemAlerts";
import { DbSchemaTab } from "@/components/infra/DbSchemaTab";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * Componente principal del panel de administración del sistema.
 * Actualizado para soportar navegación por pestañas (REGLA 2).
 * Ahora incluye la vista de documentación técnica para admins (anteriormente solo sysadmin).
 */
export function AdminSystem() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Monitor className="w-4 h-4" />
        <p>Ajustes globales de la plataforma y administración de datos internos.</p>
      </div>

      <Tabs defaultValue="config" className="w-full">
        <TabsList className="bg-slate-900 border-2 border-slate-700 mb-6 p-1 h-12">
          <TabsTrigger 
            value="config" 
            className="gap-2 px-6 py-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-slate-300 font-bold transition-all"
          >
            <Settings2 className="w-4 h-4" />
            Configuración General
          </TabsTrigger>
          <TabsTrigger 
            value="data" 
            className="gap-2 px-6 py-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-slate-300 font-bold transition-all"
          >
            <Database className="w-4 h-4" />
            Datos BD (Manual)
          </TabsTrigger>
          <TabsTrigger 
            value="docs" 
            className="gap-2 px-6 py-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-slate-300 font-bold transition-all"
          >
            <FileCode className="w-4 h-4" />
            Documentación BD
          </TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-8 animate-in slide-in-from-left-2 duration-300">
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

          {/* Configuración del algoritmo de Match Score */}
          <AdminMatchScore />

          <Separator className="my-2" />

          {/* Panel de auditoría de acciones críticas — solo lectura */}
          <AdminAuditLog />
        </TabsContent>

        <TabsContent value="data" className="animate-in slide-in-from-right-2 duration-300">
          <AdminDetailsDescription />
        </TabsContent>

        <TabsContent value="docs" className="animate-in slide-in-from-bottom-2 duration-300">
          <DbSchemaTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
