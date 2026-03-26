import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGroups, Group, GroupMember } from "@/hooks/useGroups";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Users } from "lucide-react";

// Componentes modulares
import { GroupList } from "./admin/groups/GroupList";
import { GroupDetail } from "./admin/groups/GroupDetail";
import { CreateGroupForm, JoinGroupForm } from "./admin/groups/GroupForms";

interface GroupsModalProps {
  open: boolean;
  onClose: () => void;
  activeGroupId: string | null;
  onSelectGroup: (groupId: string | null) => void;
  isAgent?: boolean;
  isOwner?: boolean;
  canManageTeams?: boolean;
}

/**
 * Orquestador principal de la gestión de grupos y equipos (Regla 2).
 * Refactorizado para delegar la complejidad visual a sub-componentes especializados.
 */
export function GroupsModal({ 
  open, 
  onClose, 
  activeGroupId, 
  onSelectGroup, 
  isAgent = false, 
  canManageTeams = true 
}: GroupsModalProps) {
  const { 
    groups, agencyOrg, loading, refetchGroups, createGroup, joinGroup, 
    leaveGroup, deleteGroup, fetchMembers, removeMember 
  } = useGroups();
  
  const { toast } = useToast();

  const [tab, setTab] = useState<string>("groups");
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Vista de detalle y miembros
  const [detailGroup, setDetailGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Miembros de la agencia (para vista inline en lista)
  const [agencyMembers, setAgencyMembers] = useState<GroupMember[]>([]);
  const [loadingAgencyMembers, setLoadingAgencyMembers] = useState(false);

  useEffect(() => {
    if (open) {
      supabase.auth.getUser().then(({ data }) => {
        setCurrentUserId(data.user?.id || null);
      });
      // Forzar refetch de grupos al abrir el modal
      refetchGroups();
    } else {
      setDetailGroup(null);
      setTab("groups");
      setInviteCode("");
    }
  }, [open]);

  useEffect(() => {
    if (open && isAgent && agencyOrg) {
      setLoadingAgencyMembers(true);
      fetchMembers(agencyOrg.id)
        .then(setAgencyMembers)
        .catch(() => setAgencyMembers([]))
        .finally(() => setLoadingAgencyMembers(false));
    }
  }, [open, isAgent, agencyOrg?.id]);

  const groupLabel = isAgent ? "equipo" : "grupo";
  const groupLabelPlural = isAgent ? "Equipos" : "Grupos";
  const groupLabelPluralLower = isAgent ? "equipos" : "grupos";

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await createGroup({ 
        name: newName.trim(), 
        description: newDesc.trim(), 
        ...(isAgent && agencyOrg ? { parentOrgId: agencyOrg.id } : {}) 
      });
      setNewName("");
      setNewDesc("");
      setTab("groups");
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Error al crear", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async () => {
    if (!inviteCode.trim()) return;
    setJoining(true);
    try {
      await joinGroup(inviteCode.trim());
      setInviteCode("");
      setTab("groups");
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Error al unirse", variant: "destructive" });
    } finally {
      setJoining(false);
    }
  };

  const openDetail = async (group: Group) => {
    setDetailGroup(group);
    setLoadingMembers(true);
    try {
      const m = await fetchMembers(group.id);
      setMembers(m);
    } catch {
      setMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleCopyCode = async (code: string) => {
    const text = String(code ?? "").trim();
    if (!text) return;

    // Intento 1: Clipboard API (contextos seguros)
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        toast({ title: "Código copiado" });
        return;
      }
    } catch { /* fallthrough */ }

    // Intento 2: execCommand (HTTP / webviews)
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      Object.assign(ta.style, { position: "fixed", left: "-9999px", top: "0", opacity: "0" });
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      ta.setSelectionRange(0, text.length); // iOS Safari
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      if (ok) {
        toast({ title: "Código copiado" });
        return;
      }
    } catch { /* fallthrough */ }

    // Intento 3: prompt manual
    window.prompt("Copiá este código de invitación:", text);
    toast({ title: "Copialo manualmente", description: "Seleccioná y copiá el código del cuadro." });
  };

  const handleRemoveMember = async (userId: string) => {
    if (!detailGroup) return;
    try {
      await removeMember({ groupId: detailGroup.id, userId });
      const m = await fetchMembers(detailGroup.id);
      setMembers(m);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  // Renderizado condicional: Vista de detalle
  if (detailGroup) {
    return (
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <GroupDetail
            group={detailGroup}
            members={members}
            loadingMembers={loadingMembers}
            currentUserId={currentUserId}
            activeGroupId={activeGroupId}
            isAgent={isAgent}
            onBack={() => setDetailGroup(null)}
            onSelectGroup={onSelectGroup}
            onClose={onClose}
            handleCopyCode={handleCopyCode}
            handleRemoveMember={handleRemoveMember}
            leaveGroup={leaveGroup}
            deleteGroup={deleteGroup}
          />
        </DialogContent>
      </Dialog>
    );
  }

  // Renderizado condicional: Agente sin permisos de gestión (solo puede unirse)
  if (isAgent && !canManageTeams) {
    return (
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Unirme al equipo
            </DialogTitle>
          </DialogHeader>
          <JoinGroupForm 
            inviteCode={inviteCode} 
            setInviteCode={setInviteCode} 
            onJoin={handleJoin} 
            joining={joining} 
            groupLabel={groupLabel} 
            isAgent={isAgent}
          />
        </DialogContent>
      </Dialog>
    );
  }

  // Vista principal: Tabs de Mis Grupos, Crear y Unirme
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {isAgent ? "Mi Agencia / Equipos" : "Mis Grupos / Equipos"}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="groups">Mis {groupLabelPluralLower}</TabsTrigger>
            <TabsTrigger value="create">Crear</TabsTrigger>
            <TabsTrigger value="join">Unirme</TabsTrigger>
          </TabsList>

          <TabsContent value="groups" className="mt-4">
            <GroupList
              groups={groups}
              activeGroupId={activeGroupId}
              openDetail={openDetail}
              loading={loading}
              isAgent={isAgent}
              agencyOrg={agencyOrg}
              agencyMembers={agencyMembers}
              loadingAgencyMembers={loadingAgencyMembers}
              currentUserId={currentUserId}
              handleCopyCode={handleCopyCode}
              groupLabelPluralLower={groupLabelPluralLower}
              onSelectGroup={onSelectGroup}
            />
          </TabsContent>

          <TabsContent value="create">
            <CreateGroupForm
              newName={newName}
              setNewName={setNewName}
              newDesc={newDesc}
              setNewDesc={setNewDesc}
              onCreate={handleCreate}
              creating={creating}
              groupLabel={groupLabel}
              isAgent={isAgent}
            />
          </TabsContent>

          <TabsContent value="join">
            <JoinGroupForm
              inviteCode={inviteCode}
              setInviteCode={setInviteCode}
              onJoin={handleJoin}
              joining={joining}
              groupLabel={groupLabel}
              isAgent={isAgent}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
