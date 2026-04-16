import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useImportRealtime } from "@/hooks/useImportRealtime";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  Users, BarChart3, Settings, FileText
} from "lucide-react";
import { ROUTES } from "@/lib/constants";

import { AdminConsola } from "@/components/admin/AdminConsola";
import { AdminConfiguracion } from "@/components/admin/AdminConfiguracion";
import { AdminSistema } from "@/components/admin/AdminSistema";
import { AdminEstadisticas } from "@/components/admin/AdminEstadisticas";
import { AdminPublicaciones } from "@/components/admin/AdminPublicaciones";
import { AdminHeader } from "@/components/AdminHeader";
import { Footer } from "@/components/Footer";
import { useProfile } from "@/hooks/useProfile";
import { useSubscription } from "@/hooks/useSubscription";

type AdminSection = "consola" | "publicaciones" | "configuracion" | "estadisticas" | "sistema";

const VALID_SECTIONS: AdminSection[] = ["consola", "publicaciones", "configuracion", "estadisticas", "sistema"];

const MENU_ITEMS: {
  id: AdminSection;
  label: string;
  icon: React.ElementType;
  description: string;
}[] = [
    { id: "consola", label: "Consola", icon: Users, description: "Usuarios, Grupos y Equipos de la plataforma" },
    { id: "publicaciones", label: "Publicaciones", icon: FileText, description: "Todas las publicaciones guardadas por usuarios" },
    { id: "configuracion", label: "Configuración App", icon: Settings, description: "Geografía, Feedback y Prompt / IA" },
    { id: "estadisticas", label: "Estadísticas", icon: BarChart3, description: "Métricas de la plataforma" },
    { id: "sistema", label: "Sistema", icon: Settings, description: "Config, Mensajes, Datos Admin y Landing" },
  ];

/**
 * Página principal del panel de administración.
 * Utiliza un layout de sidebar + contenido dinámico basado en la sección seleccionada.
 */
const Admin = () => {
  // Suscripción Realtime para importación masiva desde admin
  useImportRealtime();

  const { section } = useParams<{ section?: string }>();
  const activeSection: AdminSection = VALID_SECTIONS.includes(section as AdminSection)
    ? (section as AdminSection)
    : "consola";

  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: profile } = useProfile();
  const { isPremium } = useSubscription();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate(ROUTES.AUTH);
  };

  useEffect(() => {
    // Redirect /admin to /admin/consola
    if (!section) {
      navigate(ROUTES.ADMIN_SECTION("consola"), { replace: true });
    }
  }, [section, navigate]);

  const renderSection = () => {
    switch (activeSection) {
      case "consola": return <AdminConsola toast={toast} />;
      case "publicaciones": return <AdminPublicaciones toast={toast} />;
      case "configuracion": return <AdminConfiguracion toast={toast} />;
      case "estadisticas": return <AdminEstadisticas />;
      case "sistema": return <AdminSistema toast={toast} />;
      default: return null;
    }
  };

  const activeItem = MENU_ITEMS.find(m => m.id === activeSection);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AdminHeader
        activeSection={activeSection}
        onNavigate={(sec) => navigate(ROUTES.ADMIN_SECTION(sec))}
        onGoBack={() => navigate(ROUTES.DASHBOARD)}
        handleSignOut={handleSignOut}
        menuItems={MENU_ITEMS}
        userEmail={profile?.email}
        displayName={profile?.displayName}
        isPremium={isPremium}
      />

      {/* Contenido principal */}
      <main className="max-w-7xl mx-auto w-full px-4 py-6 flex-1">
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">{activeItem?.description}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6">
          {renderSection()}
        </div>
      </main>
      <Footer showDbStatus />
    </div>
  );
};

export default Admin;
