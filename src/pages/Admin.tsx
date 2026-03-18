import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  Building2, Users, Bot, BarChart3,
  Settings, FileText, KeyRound
} from "lucide-react";
import { ROUTES } from "@/lib/constants";

import { AdminAgencias } from "@/components/admin/AdminAgencias";
import { AdminUsuarios } from "@/components/admin/AdminUsuarios";
import { AdminPrompt } from "@/components/admin/AdminPrompt";
import { AdminEstadisticas } from "@/components/admin/AdminEstadisticas";
import { AdminSystem } from "@/components/admin/AdminSystem";
import { AdminPublicaciones } from "@/components/admin/AdminPublicaciones";
import { AdminGrupos } from "@/components/admin/AdminGrupos";
import { AdminDatosAdmin } from "@/components/admin/AdminDatosAdmin";
import { AdminHeader } from "@/components/AdminHeader";
import { Footer } from "@/components/Footer";
import { useProfile } from "@/hooks/useProfile";
import { useSubscription } from "@/hooks/useSubscription";

type AdminSection = "agentes" | "usuarios" | "publicaciones" | "grupos" | "prompt" | "estadisticas" | "sistema" | "datos-admin";

const VALID_SECTIONS: AdminSection[] = ["agentes", "usuarios", "publicaciones", "grupos", "prompt", "estadisticas", "sistema", "datos-admin"];

const MENU_ITEMS: {
  id: AdminSection;
  label: string;
  icon: React.ElementType;
  description: string;
}[] = [
    { id: "agentes", label: "Datos Users", icon: Building2, description: "Información completa de todos los usuarios y agentes" },
    { id: "usuarios", label: "Consola", icon: Users, description: "Gestión rápida de roles y estados" },
    { id: "publicaciones", label: "Publicaciones", icon: FileText, description: "Todas las publicaciones guardadas por usuarios" },
    { id: "grupos", label: "Grupos / Equipos", icon: Users, description: "Todos los grupos y equipos de la plataforma" },
    { id: "prompt", label: "Prompt / IA", icon: Bot, description: "Editor del prompt del scraper" },
    { id: "estadisticas", label: "Estadísticas", icon: BarChart3, description: "Métricas de la plataforma" },
    { id: "sistema", label: "Sistema", icon: Settings, description: "Configuración general de la plataforma" },
    { id: "datos-admin", label: "Datos Admin", icon: KeyRound, description: "Datos privados del administrador (cuentas, claves, notas)" },
  ];

/**
 * Página principal del panel de administración.
 * Utiliza un layout de sidebar + contenido dinámico basado en la sección seleccionada.
 */
const Admin = () => {
  const { section } = useParams<{ section?: string }>();
  const activeSection: AdminSection = VALID_SECTIONS.includes(section as AdminSection)
    ? (section as AdminSection)
    : "agentes";

  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: profile } = useProfile();
  const { isPremium } = useSubscription();

  useEffect(() => {
    // Redirect /admin to /admin/agentes
    if (!section) {
      navigate(ROUTES.ADMIN_SECTION("agentes"), { replace: true });
    }
  }, [section, navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate(ROUTES.AUTH);
  };

  const renderSection = () => {
    switch (activeSection) {
      case "agentes": return <AdminAgencias toast={toast} />;
      case "usuarios": return <AdminUsuarios toast={toast} />;
      case "publicaciones": return <AdminPublicaciones toast={toast} />;
      case "grupos": return <AdminGrupos toast={toast} />;
      case "prompt": return <AdminPrompt toast={toast} />;
      case "estadisticas": return <AdminEstadisticas />;
      case "sistema": return <AdminSystem />;
      case "datos-admin": return <AdminDatosAdmin />;
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
      <Footer />
    </div>
  );
};

export default Admin;
