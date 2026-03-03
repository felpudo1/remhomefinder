import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Shield, Building2, Users, Bot, BarChart3,
  LogOut, ArrowLeft, Loader2
} from "lucide-react";
import { ROUTES, ROLES } from "@/lib/constants";

// Sub-secciones importadas por separado (Regla 2)
import { AdminAgencias } from "@/components/admin/AdminAgencias";
import { AdminUsuarios } from "@/components/admin/AdminUsuarios";
import { AdminPrompt } from "@/components/admin/AdminPrompt";
import { AdminEstadisticas } from "@/components/admin/AdminEstadisticas";

// Tipos de menú disponibles
type AdminSection = "agentes" | "usuarios" | "prompt" | "estadisticas";

// Definición de los ítems del menú lateral
const MENU_ITEMS: {
  id: AdminSection;
  label: string;
  icon: React.ElementType;
  description: string;
}[] = [
    { id: "agentes", label: "Agentes", icon: Building2, description: "Solicitudes y estado de agencias" },
    { id: "usuarios", label: "Usuarios", icon: Users, description: "Todos los usuarios registrados" },
    { id: "prompt", label: "Prompt / IA", icon: Bot, description: "Editor del prompt del scraper" },
    { id: "estadisticas", label: "Estadísticas", icon: BarChart3, description: "Métricas de la plataforma" },
  ];

/**
 * Página principal del panel de administración.
 * Utiliza un layout de sidebar + contenido dinámico basado en la sección seleccionada.
 */
const Admin = () => {
  const [activeSection, setActiveSection] = useState<AdminSection>("agentes");
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

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
      setChecking(false);
    };

    checkAdmin();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate(ROUTES.AUTH);
  };

  // Pantalla de carga inicial
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return null;

  // Renderiza la sub-sección activa
  const renderSection = () => {
    switch (activeSection) {
      case "agentes": return <AdminAgencias toast={toast} />;
      case "usuarios": return <AdminUsuarios toast={toast} />;
      case "prompt": return <AdminPrompt toast={toast} />;
      case "estadisticas": return <AdminEstadisticas />;
      default: return null;
    }
  };

  const activeItem = MENU_ITEMS.find(m => m.id === activeSection);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(ROUTES.DASHBOARD)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-primary" />
              </div>
              <h1 className="text-base font-semibold text-foreground">Panel de Administración</h1>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-2 text-muted-foreground">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Salir</span>
          </Button>
        </div>

        {/* Pestañas superiores — scroll horizontal en mobile */}
        <div className="max-w-5xl mx-auto px-4 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          <nav className="flex gap-0 min-w-max border-t border-border/50">
            {MENU_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${isActive
                      ? "border-primary text-primary bg-primary/5"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="max-w-5xl mx-auto w-full px-4 py-6 flex-1">
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">{activeItem?.description}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6">
          {renderSection()}
        </div>
      </main>
    </div>
  );
};

export default Admin;
