import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Building2,
  LogOut,
  Loader2,
  Home,
  BarChart3,
  UserCircle
} from "lucide-react";
import { AgentProfile, Agency } from "@/components/agent/AgentProfile";
import { AgentProperties } from "@/components/agent/AgentProperties";
import { AgentEstadisticas } from "@/components/agent/AgentEstadisticas";
import { AgentWelcome } from "@/components/agent/AgentWelcome";
import { AgentHeader } from "@/components/AgentHeader";
import { Footer } from "@/components/Footer";

type AgentTab = "propiedades" | "estadisticas" | "perfil";

const TABS = [
  { id: "propiedades", label: "Mis Propiedades", icon: Home },
  { id: "estadisticas", label: "Estadísticas", icon: BarChart3 },
  { id: "perfil", label: "Perfil", icon: UserCircle },
];

const AgentDashboard = () => {
  const [agency, setAgency] = useState<Agency | null>(null);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AgentTab>("propiedades");
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }
      setUserEmail(user.email ?? null);

      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      if (!roles?.some(r => r.role === "agency")) { navigate("/dashboard"); return; }

      const { data: agencies, error } = await supabase.from("agencies").select("*").eq("created_by", user.id).limit(1);
      if (error) { console.error(error.message); }
      else if (agencies && agencies.length > 0) { setAgency(agencies[0] as Agency); }
      setLoading(false);
    };
    init();
  }, [navigate]);

  const handleLogout = async () => { await supabase.auth.signOut(); navigate("/auth"); };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AgentHeader
        userEmail={userEmail}
        agencyStatus={agency?.status}
        activeTab={activeTab}
        setActiveTab={(tab) => setActiveTab(tab)}
        tabs={TABS}
        handleLogout={handleLogout}
      />

      <main className="max-w-5xl mx-auto px-4 py-6 w-full flex-1">
        {agency ? (
          agency.status === "approved" ? (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              {activeTab === "propiedades" && <AgentProperties agency={agency} />}
              {activeTab === "estadisticas" && <AgentEstadisticas agency={agency} />}
              {activeTab === "perfil" && <AgentProfile agency={agency} />}
            </div>
          ) : agency.status === "pending" ? (
            <AgentWelcome userName={agency.contact_name} />
          ) : (
            <AgentProfile agency={agency} />
          )
        ) : (
          <div className="border border-border rounded-2xl bg-card p-8 text-center space-y-3">
            <Building2 className="w-10 h-10 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">No se encontró una agencia asociada a tu cuenta.</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default AgentDashboard;
