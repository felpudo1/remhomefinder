import { useState } from "react";
import { MapPin, MessageSquare, Bot, Building2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminGeografia } from "./AdminGeografia";
import { AdminStatusFeedbackConfig } from "./status-feedback/AdminStatusFeedbackConfig";
import { AdminPrompt } from "./AdminPrompt";
import { AdminDirectorio } from "./AdminDirectorio";

type ConfigTab = "geografia" | "feedback" | "prompt" | "directorio";

interface AdminConfiguracionProps {
  toast: any;
}

export function AdminConfiguracion({ toast }: AdminConfiguracionProps) {
  const [activeTab, setActiveTab] = useState<ConfigTab>("geografia");

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ConfigTab)}>
        <TabsList className="grid w-full max-w-[650px] grid-cols-4 rounded-xl">
          <TabsTrigger value="geografia" className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4" />
            Geografía
          </TabsTrigger>
          <TabsTrigger value="feedback" className="flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4" />
            Feedback
          </TabsTrigger>
          <TabsTrigger value="prompt" className="flex items-center gap-1.5">
            <Bot className="w-4 h-4" />
            Prompt / IA
          </TabsTrigger>
          <TabsTrigger value="directorio" className="flex items-center gap-1.5">
            <Building2 className="w-4 h-4" />
            Directorio
          </TabsTrigger>
        </TabsList>

        <TabsContent value="geografia" className="space-y-4 mt-6">
          <AdminGeografia toast={toast} />
        </TabsContent>

        <TabsContent value="feedback" className="space-y-4 mt-6">
          <AdminStatusFeedbackConfig />
        </TabsContent>

        <TabsContent value="prompt" className="space-y-4 mt-6">
          <AdminPrompt toast={toast} />
        </TabsContent>

        <TabsContent value="directorio" className="space-y-4 mt-6">
          <AdminDirectorio />
        </TabsContent>
      </Tabs>
    </div>
  );
}
