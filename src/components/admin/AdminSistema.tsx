import { useState } from "react";
import { Settings, MessageSquare, KeyRound, LayoutDashboard } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminSystem } from "./AdminSystem";
import { AdminAnnouncements } from "./AdminAnnouncements";
import { AdminDatosAdmin } from "./AdminDatosAdmin";
import { AdminLanding } from "./AdminLanding";

type SistemaTab = "config" | "mensajes" | "datos-admin" | "landing";

interface AdminSistemaProps {
  toast: any;
}

export function AdminSistema({ toast }: AdminSistemaProps) {
  const [activeTab, setActiveTab] = useState<SistemaTab>("config");

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SistemaTab)}>
        <TabsList className="grid w-full max-w-[600px] grid-cols-4 rounded-xl">
          <TabsTrigger value="config" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Config</span>
          </TabsTrigger>
          <TabsTrigger value="mensajes" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Mensajes</span>
          </TabsTrigger>
          <TabsTrigger value="datos-admin" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <KeyRound className="w-4 h-4" />
            <span className="hidden sm:inline">Datos Admin</span>
          </TabsTrigger>
          <TabsTrigger value="landing" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <LayoutDashboard className="w-4 h-4" />
            <span className="hidden sm:inline">Landing</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-4 mt-6">
          <AdminSystem />
        </TabsContent>

        <TabsContent value="mensajes" className="space-y-4 mt-6">
          <AdminAnnouncements />
        </TabsContent>

        <TabsContent value="datos-admin" className="space-y-4 mt-6">
          <AdminDatosAdmin />
        </TabsContent>

        <TabsContent value="landing" className="space-y-4 mt-6">
          <AdminLanding />
        </TabsContent>
      </Tabs>
    </div>
  );
}
