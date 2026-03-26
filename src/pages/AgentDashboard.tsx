import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import {
  Building2, Loader2, Home, BarChart3, Users, Gift, LineChart,
} from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { AgentProfile, Agency } from "@/components/agent/AgentProfile";
import { AgentProperties } from "@/components/agent/AgentProperties";
import { AgentEstadisticas } from "@/components/agent/AgentEstadisticas";
import { AgentIndicadores } from "@/components/agent/AgentIndicadores";
import { AgentWelcome } from "@/components/agent/AgentWelcome";
import { AgentTeamProperties } from "@/components/agent/AgentTeamProperties";
import { AgentReferralSection } from "@/components/agent/AgentReferralSection";
import { AgentPropertyListing } from "@/components/agent/AgentPropertyListing";
import { AgentHeader } from "@/components/AgentHeader";
import { GroupsModal } from "@/components/GroupsModal";
import { Footer } from "@/components/Footer";
import { UserStatus } from "@/types/property";
import { useProfile } from "@/hooks/useProfile";
import { useSubscription } from "@/hooks/useSubscription";
import { ROLES } from "@/lib/constants";
import { useCurrentUser } from "@/contexts/AuthProvider";

type AgentTab = "propiedades" | "listado" | "equipo" | "estadisticas" | "indicadores" | "referencias";

const TABS = [
  { id: "propiedades", label: "Mis Propiedades", icon: Home },
  { id: "listado", label: "Listado", icon: Building2 },
  { id: "equipo", label: "Equipo", icon: Users },
  { id: "estadisticas", label: "Estadísticas", icon: BarChart3 },
  { id: "indicadores", label: "Indicadores", icon: LineChart },
  { id: "referencias", label: "Referencias", icon: Gift },
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

  // Usuario del AuthProvider centralizado: 0 auth requests HTTP adicionales
  const { user: authUser } = useCurrentUser();
  const { data: profile } = useProfile();
  const { isPremium } = useSubscription();
  const profileStatus: UserStatus = profile?.status ?? "pending";

  /**
   * Carga inicial de roles y agencia del usuario.
   * Dependencia: authUser?.id (string primitivo) — solo re-corre en login/logout,
   * NO en cada refetch de profile (que antes generaba 5-6 requests cada 5 minutos).
   */
  useEffect(() => {
    const init = async () => {
      // Usamos authUser del AuthProvider en lugar de supabase.auth.getUser()
      // para evitar un auth request HTTP extra por cada ejecución de init()
      if (!authUser) return;

      setUserId(authUser.id);
      const { data: roleRows } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", authUser.id);
      const roleSet = new Set((roleRows || []).map((r) => r.role));
      const hasAgencyRole = roleSet.has(ROLES.AGENCY);
      const hasAgencyMemberRole = roleSet.has(ROLES.AGENCY_MEMBER);
      setCanManageTeams(hasAgencyRole);
      setShowFormarEquipo(hasAgencyRole || hasAgencyMemberRole);

      // Buscar agencia: primero la que creó el usuario, luego cualquier agency_team donde sea miembro (ej. owner agregado por admin)
      const { data: orgsCreated } = await supabase
        .from("organizations")
        // Proyectar solo columnas necesarias (evitar traer campos pesados)
        .select("id, name, description, created_by, created_at, type, invite_code, logo_url")
        .eq("created_by", authUser.id)
        .eq("type", "agency_team")
        .limit(1);

      let org = orgsCreated?.[0];
      if (!org) {
        const { data: memberships } = await supabase
          .from("organization_members")
          .select("org_id")
          .eq("user_id", authUser.id);
        const orgIds = memberships?.map((m) => m.org_id) || [];
        if (orgIds.length > 0) {
          const { data: orgsMember } = await supabase
            .from("organizations")
            // Proyectar solo columnas necesarias (evitar traer campos pesados)
            .select("id, name, description, created_by, created_at, type, invite_code, logo_url")
            .eq("type", "agency_team")
            .in("id", orgIds)
            .limit(1);
          org = orgsMember?.[0];
        }
      }

      if (org) {
        // Owner = solo si tiene role 'owner' en organization_members (RPC de BD, source of truth)
        const { data: isOwnerResult, error: ownerErr } = await supabase.rpc("is_org_owner" as any, {
          _user_id: authUser.id,
          _org_id: org.id,
        });
        if (ownerErr) console.warn("is_org_owner RPC:", ownerErr);
        setIsOwner(hasAgencyRole && Boolean(isOwnerResult));
        // logo_url added via migration; cast to handle stale types
        const orgAny = org as any;
        setAgency({
          id: org.id,
          name: org.name,
          contact_name: "",
          contact_email: authUser.email || "",
          contact_phone: "",
          contact_person_phone: "",
          description: org.description || "",
          created_by: org.created_by,
          created_at: org.created_at,
          logo_url: orgAny.logo_url ?? "",
        } as Agency);
      }

      setLoading(false);
    };
    init();
  }, [authUser?.id]);

  /**
   * Sincroniza displayName y phone del perfil en la agency cuando el perfil carga o cambia.
   * Es un useEffect liviano (sin requests a BD) separado del init() principal.
   * Así, los refetch de profile cada 5 min NO re-corren todas las queries de init().
   */
  useEffect(() => {
    if (!profile) return;
    setAgency((prev) =>
      prev
        ? {
            ...prev,
            contact_name: profile.displayName || prev.contact_name,
            contact_phone: profile.phone || prev.contact_phone,
          }
        : prev
    );
  }, [profile?.displayName, profile?.phone]);

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
        userEmail={profile?.email ?? null}
        agencyStatus={effectiveStatus}
        activeTab={activeTab}
        setActiveTab={(tab) => setActiveTab(tab)}
        tabs={visibleTabs}
        handleLogout={handleLogout}
        activeGroupId={activeGroupId}
        setIsGroupsOpen={setIsGroupsOpen}
        displayName={profile?.displayName}
        avatarUrl={profile?.avatarUrl}
        isPremium={isPremium}
        isOwner={isOwner}
        canManageTeams={canManageTeams}
        showFormarEquipo={showFormarEquipo}
        agencyId={agency?.id ?? null}
        agencyLogoUrl={agency?.logo_url ?? ""}
        onAgencyLogoUpdated={(url) =>
          setAgency((prev) => (prev ? { ...prev, logo_url: url } : prev))
        }
        agency={agency}
        profileStatus={profileStatus}
      />

      <main className="max-w-7xl mx-auto px-4 py-6 w-full flex-1">
        {agency ? (
          profileStatus === "active" ? (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
              {activeTab === "propiedades" && <AgentProperties agency={agency} profileStatus={profileStatus} activeGroupId={isOwner ? activeGroupId : null} />}
              {activeTab === "listado" && <AgentPropertyListing agency={agency} />}
              {activeTab === "equipo" && canManageTeams && (
                <AgentTeamProperties
                  activeGroupId={isOwner ? activeGroupId : agency.id}
                  onOpenGroups={() => setIsGroupsOpen(true)}
                  isOwner={isOwner}
                />
              )}
              {activeTab === "estadisticas" && <AgentEstadisticas agency={agency} />}
              {activeTab === "indicadores" && <AgentIndicadores />}
              {activeTab === "referencias" && <AgentReferralSection agency={agency} />}
            </div>
          ) : profileStatus === "pending" ? (
            <AgentWelcome userName={agency.contact_name} />
          ) : (
            <AgentProfile
              agency={agency}
              profileStatus={profileStatus}
              onAgencyLogoUpdated={(url) =>
                setAgency((prev) => (prev ? { ...prev, logo_url: url } : prev))
              }
            />
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
      <Footer showDbStatus />
    </div>
  );
};

export default AgentDashboard;
