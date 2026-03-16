import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Shield, Building2, Users, Bot, BarChart3,
  LogOut, ArrowLeft, Loader2, Settings, FileText
} from "lucide-react";
import { ROUTES, ROLES } from "@/lib/constants";

import { AdminAgencias } from "@/components/admin/AdminAgencias";
import { AdminUsuarios } from "@/components/admin/AdminUsuarios";
import { AdminPrompt } from "@/components/admin/AdminPrompt";
import { AdminEstadisticas } from "@/components/admin/AdminEstadisticas";
import { AdminSystem } from "@/components/admin/AdminSystem";
import { AdminPublicaciones } from "@/components/admin/AdminPublicaciones";
import { AdminGrupos } from "@/components/admin/AdminGrupos";
import { AdminHeader } from "@/components/AdminHeader";
import { Footer } from "@/components/Footer";
import { useProfile } from "@/hooks/useProfile";
import { useSubscription } from "@/hooks/useSubscription";

type AdminSection = "agentes" | "usuarios" | "publicaciones" | "grupos" | "prompt" | "estadisticas" | "sistema";

const VALID_SECTIONS: AdminSection[] = ["agentes", "usuarios", "publicaciones", "grupos", "prompt", "estadisticas", "sistema"];

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

  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: profile } = useProfile();
  const { isPremium } = useSubscription();

  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    // Redirect /admin to /admin/agentes
    if (!section) {
      navigate(ROUTES.ADMIN_SECTION("agentes"), { replace: true });
    }
  }, [section, navigate]);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate(ROUTES.AUTH); return; }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", ROLES.ADMIN);

      if (!roles || roles.length === 0) {
        navigate(ROUTES.DASHBOARD);
        return;
      }

      setIsAdmin(true);
      setUserEmail(user.email ?? null);
      setChecking(false);
    };

    checkAdmin();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate(ROUTES.AUTH);
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return null;

  const renderSection = () => {
    switch (activeSection) {
      case "agentes": return <AdminAgencias toast={toast} />;
      case "usuarios": return <AdminUsuarios toast={toast} />;
      case "publicaciones": return <AdminPublicaciones toast={toast} />;
      case "prompt": return <AdminPrompt toast={toast} />;
      case "estadisticas": return <AdminEstadisticas />;
      case "sistema": return <AdminSystem />;
      default: return null;
    }
  };

  const activeItem = MENU_ITEMS.find(m => m.id === activeSection);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AdminHeader
        activeSection={activeSection}
        onNavigate={(sec) => navigate(ROUTES.ADMIN_SECTION(sec as any))}
        onGoBack={() => navigate(ROUTES.DASHBOARD)}
        handleSignOut={handleSignOut}
        menuItems={MENU_ITEMS}
        userEmail={userEmail}
        displayName={profile?.displayName}
        isPremium={isPremium}
      />

      {/* Contenido principal */}
      <main className="max-w-5xl mx-auto w-full px-4 py-6 flex-1">
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
