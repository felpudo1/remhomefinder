import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import {
  Building2, Loader2, Home, BarChart3, UserCircle, Users
} from "lucide-react";
import { AgentProfile, Agency } from "@/components/agent/AgentProfile";
import { AgentProperties } from "@/components/agent/AgentProperties";
import { AgentEstadisticas } from "@/components/agent/AgentEstadisticas";
import { AgentWelcome } from "@/components/agent/AgentWelcome";
import { AgentTeamProperties } from "@/components/agent/AgentTeamProperties";
import { AgentHeader } from "@/components/AgentHeader";
import { GroupsModal } from "@/components/GroupsModal";
import { Footer } from "@/components/Footer";
import { UserStatus } from "@/types/property";
import { useProfile } from "@/hooks/useProfile";
import { useSubscription } from "@/hooks/useSubscription";

type AgentTab = "propiedades" | "equipo" | "estadisticas" | "perfil";

const TABS = [
  { id: "propiedades", label: "Mis Propiedades", icon: Home },
  { id: "equipo", label: "Equipo", icon: Users },
  { id: "estadisticas", label: "Estadísticas", icon: BarChart3 },
  { id: "perfil", label: "Perfil", icon: UserCircle },
];

const AgentDashboard = () => {
  const [agency, setAgency] = useState<Agency | null>(null);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AgentTab>("propiedades");
  const [isGroupsOpen, setIsGroupsOpen] = useState(false);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const navigate = useNavigate();

  const { data: profile } = useProfile();
  const { isPremium } = useSubscription();
  const profileStatus: UserStatus = profile?.status ?? "pending";

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }
      setUserEmail(user.email ?? null);

      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      if (!roles?.some(r => r.role === "agency")) { navigate("/dashboard"); return; }

      // Get agency org
      const { data: orgs, error: orgErr } = await supabase
        .from("organizations")
        .select("*")
        .eq("created_by", user.id)
        .eq("type", "agency_team" as any)
        .limit(1);

      if (orgErr) console.error(orgErr.message);
      else if (orgs && orgs.length > 0) {
        const org = orgs[0];
        // Map organization to Agency interface
        setAgency({
          id: org.id,
          name: org.name,
          contact_name: profile?.displayName || "",
          contact_email: user.email || "",
          contact_phone: profile?.phone || "",
          contact_person_phone: "",
          description: org.description || "",
          created_by: org.created_by,
          created_at: org.created_at,
        } as Agency);
      }

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

  const effectiveStatus = profileStatus === "active" ? "approved" : profileStatus;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AgentHeader
        userEmail={userEmail}
        agencyStatus={effectiveStatus}
        activeTab={activeTab}
        setActiveTab={(tab) => setActiveTab(tab)}
        tabs={TABS}
        handleLogout={handleLogout}
        activeGroupId={activeGroupId}
        setIsGroupsOpen={setIsGroupsOpen}
        displayName={profile?.displayName}
        isPremium={isPremium}
      />

      <main className="max-w-5xl mx-auto px-4 py-6 w-full flex-1">
        {agency ? (
          profileStatus === "active" ? (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              {activeTab === "propiedades" && <AgentProperties agency={agency} profileStatus={profileStatus} activeGroupId={activeGroupId} />}
              {activeTab === "equipo" && <AgentTeamProperties activeGroupId={activeGroupId} onOpenGroups={() => setIsGroupsOpen(true)} />}
              {activeTab === "estadisticas" && <AgentEstadisticas agency={agency} />}
              {activeTab === "perfil" && <AgentProfile agency={agency} profileStatus={profileStatus} />}
            </div>
          ) : profileStatus === "pending" ? (
            <AgentWelcome userName={agency.contact_name} />
          ) : (
            <AgentProfile agency={agency} profileStatus={profileStatus} />
          )
        ) : (
          <div className="border border-border rounded-2xl bg-card p-8 text-center space-y-3">
            <Building2 className="w-10 h-10 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">No se encontró una agencia asociada a tu cuenta.</p>
          </div>
        )}
      </main>
      <GroupsModal
        open={isGroupsOpen}
        onClose={() => setIsGroupsOpen(false)}
        activeGroupId={activeGroupId}
        onSelectGroup={setActiveGroupId}
        isAgent={true}
      />
      <Footer />
    </div>
  );
};

export default AgentDashboard;
