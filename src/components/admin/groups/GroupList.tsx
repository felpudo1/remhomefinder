import { Group, GroupMember } from "@/hooks/useGroups";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Users, Building2, ChevronRight, Copy, Loader2, Network 
} from "lucide-react";

interface GroupListProps {
  groups: Group[];
  activeGroupId: string | null;
  onSelectGroup: (groupId: string | null) => void;
  openDetail: (group: Group) => void;
  loading: boolean;
  isAgent: boolean;
  agencyOrg: Group | null;
  agencyMembers: GroupMember[];
  loadingAgencyMembers: boolean;
  currentUserId: string | null;
  handleCopyCode: (code: string) => void;
  groupLabelPluralLower: string;
}

/**
 * Componente que renderiza la lista de grupos y equipos disponibles para el usuario.
 * Incluye la sección destacada de la agencia si el usuario es un agente.
 */
export function GroupList({
  groups,
  activeGroupId,
  openDetail,
  loading,
  isAgent,
  agencyOrg,
  agencyMembers,
  loadingAgencyMembers,
  currentUserId,
  handleCopyCode,
  groupLabelPluralLower
}: GroupListProps) {
  
  const isOwnerOfAgency = (org: Group) => {
     return org.created_by === currentUserId || agencyMembers.find((m) => m.user_id === currentUserId)?.role === "owner";
  };

  return (
    <div className="space-y-4">
      {/* Sección fija de la agencia para agentes */}
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
              {isOwnerOfAgency(agencyOrg) && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyCode(agencyOrg.invite_code);
                  }}
                  title="Copiar código"
                >
                  <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                </Button>
              )}
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </button>
          <Separator />
        </div>
      )}

      {/* Lista de grupos adicionales */}
      <div className="space-y-2">
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
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                activeGroupId === g.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/30 bg-background"
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${g.type === "sub_team" ? "bg-accent/15" : "bg-primary/10"}`}>
                {g.type === "sub_team" ? <Network className="w-4 h-4 text-accent-foreground" /> : <Users className="w-4 h-4 text-primary" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium truncate">{g.name}</p>
                  <Badge variant={g.type === "sub_team" ? "secondary" : "outline"} className="text-[10px] px-1.5 py-0 shrink-0">
                    {g.type === "sub_team" ? "Equipo" : "Grupo"}
                  </Badge>
                </div>
                {g.description && (
                  <p className="text-xs text-muted-foreground truncate">{g.description}</p>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </button>
          ))
        )}
      </div>
    </div>
  );
}
