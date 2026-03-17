import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import {
  Building2, Loader2, Home, BarChart3, UserCircle, Users, Gift
} from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { AgentProfile, Agency } from "@/components/agent/AgentProfile";
import { AgentProperties } from "@/components/agent/AgentProperties";
import { AgentEstadisticas } from "@/components/agent/AgentEstadisticas";
import { AgentWelcome } from "@/components/agent/AgentWelcome";
import { AgentTeamProperties } from "@/components/agent/AgentTeamProperties";
import { AgentReferralSection } from "@/components/agent/AgentReferralSection";
import { AgentHeader } from "@/components/AgentHeader";
import { GroupsModal } from "@/components/GroupsModal";
import { Footer } from "@/components/Footer";
import { UserStatus } from "@/types/property";
import type { OrgType } from "@/types/supabase";
import { useProfile } from "@/hooks/useProfile";
import { useSubscription } from "@/hooks/useSubscription";
import { ROLES } from "@/lib/constants";

type AgentTab = "propiedades" | "equipo" | "estadisticas" | "referencias" | "perfil";

const TABS = [
  { id: "propiedades", label: "Mis Propiedades", icon: Home },
  { id: "equipo", label: "Equipo", icon: Users },
  { id: "estadisticas", label: "Estadísticas", icon: BarChart3 },
  { id: "referencias", label: "Referencias", icon: Gift },
  { id: "perfil", label: "Perfil", icon: UserCircle },
];

const AgentDashboard = () => {
  const [agency, setAgency] = useState<Agency | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [canManageTeams, setCanManageTeams] = useState(false);
  const [activeTab, setActiveTab] = useState<AgentTab>("propiedades");
  const [isGroupsOpen, setIsGroupsOpen] = useState(false);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [showFormarEquipo, setShowFormarEquipo] = useState(false);
  const navigate = useNavigate();

  const { data: profile } = useProfile();
  const { isPremium } = useSubscription();
  const profileStatus: UserStatus = profile?.status ?? "pending";

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return; // ProtectedRoute already handles unauthenticated users

      setUserId(user.id);
      const { data: roleRows } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      const roleSet = new Set((roleRows || []).map((r) => r.role));
      const hasAgencyRole = roleSet.has(ROLES.AGENCY);
      const hasAgencyMemberRole = roleSet.has(ROLES.AGENCY_MEMBER);
      setCanManageTeams(hasAgencyRole);
      setShowFormarEquipo(hasAgencyRole || hasAgencyMemberRole);

      // Buscar agencia: primero la que creó el usuario, luego cualquier agency_team donde sea miembro (ej. owner agregado por admin)
      const { data: orgsCreated } = await supabase
        .from("organizations")
        .select("*")
        .eq("created_by", user.id)
        .eq("type", "agency_team" satisfies OrgType)
        .limit(1);

      let org = orgsCreated?.[0];
      if (!org) {
        const { data: memberships } = await supabase
          .from("organization_members")
          .select("org_id")
          .eq("user_id", user.id);
        const orgIds = memberships?.map((m) => m.org_id) || [];
        if (orgIds.length > 0) {
          const { data: orgsMember } = await supabase
            .from("organizations")
            .select("*")
            .eq("type", "agency_team" satisfies OrgType)
            .in("id", orgIds)
            .limit(1);
          org = orgsMember?.[0];
        }
      }

      if (org) {
        // Owner = solo si tiene role 'owner' en organization_members (RPC de BD, source of truth)
        const { data: isOwnerResult, error: ownerErr } = await supabase.rpc("is_org_owner", {
          _user_id: user.id,
          _org_id: org.id,
        });
        if (ownerErr) console.warn("is_org_owner RPC:", ownerErr);
        setIsOwner(hasAgencyRole && Boolean(isOwnerResult));
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
  }, [navigate, profile]);

  useEffect(() => {
    if (!canManageTeams && activeTab === "equipo") {
      setActiveTab("propiedades");
    }
  }, [canManageTeams, activeTab]);

  const handleLogout = async () => { await supabase.auth.signOut(); navigate(ROUTES.AUTH); };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const effectiveStatus = profileStatus === "active" ? "approved" : profileStatus;
  const visibleTabs = canManageTeams ? TABS : TABS.filter((t) => t.id !== "equipo");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AgentHeader
        userEmail={null}
        agencyStatus={effectiveStatus}
        activeTab={activeTab}
        setActiveTab={(tab) => setActiveTab(tab)}
        tabs={visibleTabs}
        handleLogout={handleLogout}
        activeGroupId={activeGroupId}
        setIsGroupsOpen={setIsGroupsOpen}
        displayName={profile?.displayName}
        isPremium={isPremium}
        isOwner={isOwner}
        canManageTeams={canManageTeams}
        showFormarEquipo={showFormarEquipo}
      />

      <main className="max-w-5xl mx-auto px-4 py-6 w-full flex-1">
        {agency ? (
          profileStatus === "active" ? (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
              {activeTab === "propiedades" && <AgentProperties agency={agency} profileStatus={profileStatus} activeGroupId={isOwner ? activeGroupId : null} />}
              {activeTab === "equipo" && canManageTeams && (
                <AgentTeamProperties
                  activeGroupId={isOwner ? activeGroupId : agency.id}
                  onOpenGroups={() => setIsGroupsOpen(true)}
                  isOwner={isOwner}
                />
              )}
              {activeTab === "estadisticas" && <AgentEstadisticas agency={agency} />}
              {activeTab === "referencias" && <AgentReferralSection agency={agency} />}
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
      {(canManageTeams || showFormarEquipo) && (
        <GroupsModal
          open={isGroupsOpen}
          onClose={() => setIsGroupsOpen(false)}
          activeGroupId={activeGroupId}
          onSelectGroup={setActiveGroupId}
          isAgent={true}
          isOwner={isOwner}
          canManageTeams={canManageTeams}
        />
      )}
      <Footer />
    </div>
  );
};

export default AgentDashboard;
