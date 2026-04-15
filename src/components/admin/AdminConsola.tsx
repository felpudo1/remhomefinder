import { useState } from "react";
import { Users, Users2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminUsuarios } from "./AdminUsuarios";
import { AdminGrupos } from "./AdminGrupos";

type ConsolaTab = "usuarios" | "grupos";

interface AdminConsolaProps {
  toast: any;
}

export function AdminConsola({ toast }: AdminConsolaProps) {
  const [activeTab, setActiveTab] = useState<ConsolaTab>("usuarios");

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ConsolaTab)}>
        <TabsList className="grid w-full max-w-[320px] grid-cols-2 rounded-xl">
          <TabsTrigger value="usuarios" className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            Usuarios
          </TabsTrigger>
          <TabsTrigger value="grupos" className="flex items-center gap-1.5">
            <Users2 className="w-4 h-4" />
            Grupos / Equipos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="usuarios" className="space-y-4 mt-6">
          <AdminUsuarios toast={toast} />
        </TabsContent>

        <TabsContent value="grupos" className="space-y-4 mt-6">
          <AdminGrupos toast={toast} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
