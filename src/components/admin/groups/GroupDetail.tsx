import { Group, GroupMember } from "@/hooks/useGroups";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ArrowLeft, Building2, Copy, Loader2, Crown, X, LogOut, Trash2
} from "lucide-react";

interface GroupDetailProps {
  group: Group;
  members: GroupMember[];
  loadingMembers: boolean;
  currentUserId: string | null;
  activeGroupId: string | null;
  isAgent: boolean;
  onBack: () => void;
  onSelectGroup: (groupId: string | null) => void;
  onClose: () => void;
  handleCopyCode: (code: string) => void;
  handleRemoveMember: (userId: string) => void;
  leaveGroup: (groupId: string) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
}

/**
 * Componente que muestra los detalles de un grupo: miembros, código de invitación
 * y acciones administrativas (abandonar, eliminar, ver propiedades).
 */
export function GroupDetail({
  group,
  members,
  loadingMembers,
  currentUserId,
  activeGroupId,
  isAgent,
  onBack,
  onSelectGroup,
  onClose,
  handleCopyCode,
  handleRemoveMember,
  leaveGroup,
  deleteGroup
}: GroupDetailProps) {
  
  const isAgencyTeamDetail = group.type === "agency_team";
  const currentUserMembership = members.find((m) => m.user_id === currentUserId);
  const isOwner = group.created_by === currentUserId || currentUserMembership?.role === "owner";
  const groupLabel = isAgent ? "equipo" : "grupo";

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
          </button>
          {isAgencyTeamDetail && <Building2 className="w-4 h-4 text-primary" />}
          {group.name}
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

        {group.description && (
          <p className="text-sm text-muted-foreground">{group.description}</p>
        )}

        {/* Código de invitación */}
        {(isOwner || !isAgencyTeamDetail) && (
          <div className="bg-muted/50 rounded-xl p-3 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Código de invitación
            </p>
            <div className="flex gap-2 min-w-0">
              <code className="flex-1 min-w-0 bg-background rounded-lg px-3 py-2 text-xs font-mono break-all border border-border">
                {group.invite_code}
              </code>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="shrink-0"
                onClick={() => handleCopyCode(group.invite_code)}
                title="Copiar código"
              >
                <Copy className="w-3.5 h-3.5" />
              </Button>
            </div>
            {isAgencyTeamDetail && (
              <p className="text-[10px] text-muted-foreground">
                Compartí este código con tus agentes para que lo peguen en la pestaña Unirme.
              </p>
            )}
          </div>
        )}

        {/* Lista de miembros */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Miembros ({members.length})</p>
          {loadingMembers ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-1.5">
              {members.map((m) => (
                <div key={m.id} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg bg-background border border-border group/member ${m.is_active === false ? "opacity-50" : ""}`}>
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                    {(m.display_name || "U")[0].toUpperCase()}
                  </div>
                  <span className="text-sm flex-1 truncate">{m.display_name || "Usuario"}</span>
                  {m.is_active === false && (
                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">Pausado</Badge>
                  )}
                  {m.role === "owner" && <Crown className="w-3.5 h-3.5 text-amber-500" />}
                  {isOwner && m.user_id !== currentUserId && isAgencyTeamDetail && (
                    <Switch
                      checked={m.is_active !== false}
                      disabled
                      className="scale-75"
                      aria-readonly="true"
                    />
                  )}
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

        {/* Acciones principales */}
        <div className="flex flex-col gap-2 pt-2">
          <Button
            variant={activeGroupId === group.id ? "default" : "outline"}
            className="w-full rounded-xl"
            onClick={() => {
              onSelectGroup(activeGroupId === group.id ? null : group.id);
              onClose();
            }}
          >
            {activeGroupId === group.id ? `${isAgent ? "Equipo" : "Grupo"} activo ✓` : `Ver propiedades del ${groupLabel}`}
          </Button>

          {!isAgencyTeamDetail && (
            <>
              <Button
                variant="ghost"
                className="w-full text-destructive hover:text-destructive hover:bg-destructive/5 rounded-xl"
                onClick={() => leaveGroup(group.id).then(onBack)}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Abandonar {groupLabel}
              </Button>

              {isOwner && (
                <Button
                  variant="ghost"
                  className="w-full text-destructive hover:text-destructive hover:bg-destructive/5 rounded-xl"
                  onClick={async () => {
                    if (!confirm(`¿Estás seguro de eliminar "${group.name}"? Se eliminarán todos los miembros.`)) return;
                    await deleteGroup(group.id).then(onClose);
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar {groupLabel}
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
