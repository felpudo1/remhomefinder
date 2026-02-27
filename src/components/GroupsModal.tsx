import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGroups, Group, GroupMember } from "@/hooks/useGroups";
import { useToast } from "@/hooks/use-toast";
import {
  Users, Plus, Copy, LogOut, Trash2, UserPlus, Crown, Loader2, ChevronRight, ArrowLeft,
} from "lucide-react";

interface GroupsModalProps {
  open: boolean;
  onClose: () => void;
  activeGroupId: string | null;
  onSelectGroup: (groupId: string | null) => void;
}

export function GroupsModal({ open, onClose, activeGroupId, onSelectGroup }: GroupsModalProps) {
  const { groups, loading, createGroup, joinGroup, leaveGroup, deleteGroup, fetchMembers } = useGroups();
  const { toast } = useToast();

  const [tab, setTab] = useState<string>("groups");
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  // Detail view
  const [detailGroup, setDetailGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  useEffect(() => {
    if (!open) {
      setDetailGroup(null);
      setTab("groups");
    }
  }, [open]);

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
    toast({ title: "Código copiado", description: "Compartilo con tu familia para que se unan." });
  };

  // Detail view
  if (detailGroup) {
    return (
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <button onClick={() => setDetailGroup(null)} className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4" />
              </button>
              {detailGroup.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
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
                    <div key={m.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-background border border-border">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                        {(m.display_name || "U")[0].toUpperCase()}
                      </div>
                      <span className="text-sm flex-1 truncate">{m.display_name || "Usuario"}</span>
                      {m.role === "owner" && <Crown className="w-3.5 h-3.5 text-amber-500" />}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                variant={activeGroupId === detailGroup.id ? "default" : "outline"}
                className="flex-1"
                onClick={() => {
                  onSelectGroup(activeGroupId === detailGroup.id ? null : detailGroup.id);
                  onClose();
                }}
              >
                {activeGroupId === detailGroup.id ? "Grupo activo ✓" : "Ver propiedades del grupo"}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={async () => {
                  try {
                    await leaveGroup(detailGroup.id);
                    setDetailGroup(null);
                  } catch (e: any) {
                    toast({ title: "Error", description: e.message, variant: "destructive" });
                  }
                }}
                title="Salir del grupo"
              >
                <LogOut className="w-4 h-4" />
              </Button>
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
            Grupos Familiares
          </DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="groups">Mis grupos</TabsTrigger>
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
                <p className="text-sm">No pertenecés a ningún grupo</p>
                <p className="text-xs">Creá uno o unite con un código de invitación</p>
              </div>
            ) : (
              groups.map((g) => (
                <button
                  key={g.id}
                  onClick={() => openDetail(g)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                    activeGroupId === g.id
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
              <Label>Nombre del grupo</Label>
              <Input
                placeholder="Ej: Familia González"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Descripción (opcional)</Label>
              <Input
                placeholder="Buscando depto en Pocitos"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <Button onClick={handleCreate} disabled={creating || !newName.trim()} className="w-full rounded-xl">
              {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Crear grupo
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
              Unirme al grupo
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
