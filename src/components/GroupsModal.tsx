import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useGroups, Group, GroupMember } from "@/hooks/useGroups";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Users, Plus, Copy, LogOut, Trash2, UserPlus, Crown, Loader2, ChevronRight, ArrowLeft, X, Building2,
} from "lucide-react";

interface GroupsModalProps {
  open: boolean;
  onClose: () => void;
  activeGroupId: string | null;
  onSelectGroup: (groupId: string | null) => void;
  isAgent?: boolean;
}

export function GroupsModal({ open, onClose, activeGroupId, onSelectGroup, isAgent = false }: GroupsModalProps) {
  const { groups, agencyOrg, loading, createGroup, joinGroup, leaveGroup, deleteGroup, fetchMembers, removeMember } = useGroups();
  const { toast } = useToast();

  const [tab, setTab] = useState<string>("groups");
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Detail view
  const [detailGroup, setDetailGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Agency members (for inline display)
  const [agencyMembers, setAgencyMembers] = useState<GroupMember[]>([]);
  const [loadingAgencyMembers, setLoadingAgencyMembers] = useState(false);

  useEffect(() => {
    if (open) {
      supabase.auth.getUser().then(({ data }) => {
        setCurrentUserId(data.user?.id || null);
      });
    } else {
      setDetailGroup(null);
      setTab("groups");
    }
  }, [open]);

  // Fetch agency members when modal opens and isAgent
  useEffect(() => {
    if (open && isAgent && agencyOrg) {
      setLoadingAgencyMembers(true);
      fetchMembers(agencyOrg.id)
        .then(setAgencyMembers)
        .catch(() => setAgencyMembers([]))
        .finally(() => setLoadingAgencyMembers(false));
    }
  }, [open, isAgent, agencyOrg?.id]);

  // Micro-copy helpers
  const groupLabel = isAgent ? "equipo" : "grupo";
  const groupLabelPlural = isAgent ? "Equipos" : "Grupos";
  const groupLabelPluralLower = isAgent ? "equipos" : "grupos";

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await createGroup({ name: newName.trim(), description: newDesc.trim() });
      setNewName("");
      setNewDesc("");
      setTab("groups");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
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
      toast({ title: "Error", description: e.message, variant: "destructive" });
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

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Código copiado", description: "Compartilo con tus colegas o familia para que se unan." });
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

  const isAgencyTeamDetail = detailGroup?.type === "agency_team";

  // Detail view
  if (detailGroup) {
    const isOwner = detailGroup.created_by === currentUserId;

    return (
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <button onClick={() => setDetailGroup(null)} className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4" />
              </button>
              {isAgencyTeamDetail && <Building2 className="w-4 h-4 text-primary" />}
              {detailGroup.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {isAgencyTeamDetail && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  Organización principal
                </span>
              </div>
            )}

            {detailGroup.description && (
              <p className="text-sm text-muted-foreground">{detailGroup.description}</p>
            )}

            {/* Invite code */}
            <div className="bg-muted/50 rounded-xl p-3 space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Código de invitación</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-background rounded-lg px-3 py-2 text-sm font-mono tracking-wider border border-border">
                  {detailGroup.invite_code}
                </code>
                <Button size="sm" variant="outline" onClick={() => handleCopyCode(detailGroup.invite_code)}>
                  <Copy className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* Members */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Miembros ({members.length})</p>
              {loadingMembers ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-1.5">
                  {members.map((m) => (
                    <div key={m.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-background border border-border group/member">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                        {(m.display_name || "U")[0].toUpperCase()}
                      </div>
                      <span className="text-sm flex-1 truncate">{m.display_name || "Usuario"}</span>
                      {m.role === "owner" && <Crown className="w-3.5 h-3.5 text-amber-500" />}
                      {isOwner && m.user_id !== currentUserId && (
                        <button
                          onClick={() => handleRemoveMember(m.user_id)}
                          className="p-1 hover:bg-destructive/10 rounded text-destructive transition-all"
                          title="Eliminar miembro"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-2">
              <Button
                variant={activeGroupId === detailGroup.id ? "default" : "outline"}
                className="w-full rounded-xl"
                onClick={() => {
                  onSelectGroup(activeGroupId === detailGroup.id ? null : detailGroup.id);
                  onClose();
                }}
              >
                {activeGroupId === detailGroup.id ? `${isAgent ? "Equipo" : "Grupo"} activo ✓` : `Ver propiedades del ${groupLabel}`}
              </Button>

              {/* Hide abandon button for agency_team org */}
              {!isAgencyTeamDetail && (
                <Button
                  variant="ghost"
                  className="w-full text-destructive hover:text-destructive hover:bg-destructive/5 rounded-xl"
                  onClick={async () => {
                    try {
                      await leaveGroup(detailGroup.id);
                      setDetailGroup(null);
                    } catch (e: any) {
                      toast({ title: "Error", description: e.message, variant: "destructive" });
                    }
                  }}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Abandonar {groupLabel}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {isAgent ? "Mi Agencia / Equipos" : "Mis Grupos / Equipos"}
          </DialogTitle>
        </DialogHeader>

        {/* Fixed agency section for agents */}
        {isAgent && agencyOrg && (
          <div className="space-y-3">
            <button
              onClick={() => openDetail(agencyOrg)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                activeGroupId === agencyOrg.id
                  ? "border-primary bg-primary/5"
                  : "border-primary/20 bg-primary/[0.02] hover:border-primary/40"
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{agencyOrg.name}</p>
                  <span className="text-[10px] font-medium bg-primary/10 text-primary px-1.5 py-0.5 rounded-full shrink-0">
                    Principal
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {loadingAgencyMembers ? "Cargando..." : `${agencyMembers.length} miembros`}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyCode(agencyOrg.invite_code);
                  }}
                  title="Copiar código de invitación"
                >
                  <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                </Button>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </button>

            <Separator />
          </div>
        )}

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="groups">Mis {groupLabelPluralLower}</TabsTrigger>
            <TabsTrigger value="create">Crear</TabsTrigger>
            <TabsTrigger value="join">Unirme</TabsTrigger>
          </TabsList>

          {/* List */}
          <TabsContent value="groups" className="space-y-2 mt-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : groups.length === 0 ? (
              <div className="text-center py-8 space-y-2 text-muted-foreground">
                <Users className="w-10 h-10 mx-auto opacity-30" />
                <p className="text-sm">No tenés {groupLabelPluralLower} adicionales</p>
                <p className="text-xs">Creá uno o unite con un código de invitación</p>
              </div>
            ) : (
              groups.map((g) => (
                <button
                  key={g.id}
                  onClick={() => openDetail(g)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${activeGroupId === g.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30 bg-background"
                    }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{g.name}</p>
                    {g.description && (
                      <p className="text-xs text-muted-foreground truncate">{g.description}</p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
              ))
            )}
          </TabsContent>

          {/* Create */}
          <TabsContent value="create" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Nombre del {groupLabel}</Label>
              <Input
                placeholder={isAgent ? "Ej: Equipo Zona Sur" : "Ej: Familia González"}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Descripción (opcional)</Label>
              <Input
                placeholder={isAgent ? "Ej: Equipo de ventas zona 1" : "Ej: Buscando depto en Pocitos"}
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <Button onClick={handleCreate} disabled={creating || !newName.trim()} className="w-full rounded-xl">
              {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Crear {groupLabel}
            </Button>
          </TabsContent>

          {/* Join */}
          <TabsContent value="join" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Código de invitación</Label>
              <Input
                placeholder="Pegá el código acá"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="rounded-xl font-mono tracking-wider"
              />
            </div>
            <Button onClick={handleJoin} disabled={joining || !inviteCode.trim()} className="w-full rounded-xl">
              {joining ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
              Unirme al {groupLabel}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
