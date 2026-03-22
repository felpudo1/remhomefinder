import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, UserPlus } from "lucide-react";

interface CreateGroupFormProps {
  newName: string;
  setNewName: (v: string) => void;
  newDesc: string;
  setNewDesc: (v: string) => void;
  onCreate: () => void;
  creating: boolean;
  groupLabel: string;
  isAgent: boolean;
}

/**
 * Formulario para la creación de un nuevo grupo o equipo.
 */
export function CreateGroupForm({
  newName,
  setNewName,
  newDesc,
  setNewDesc,
  onCreate,
  creating,
  groupLabel,
  isAgent
}: CreateGroupFormProps) {
  return (
    <div className="space-y-4 mt-4">
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
      <Button 
        onClick={onCreate} 
        disabled={creating || !newName.trim()} 
        className="w-full rounded-xl"
      >
        {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
        Crear {groupLabel}
      </Button>
    </div>
  );
}

interface JoinGroupFormProps {
  inviteCode: string;
  setInviteCode: (v: string) => void;
  onJoin: () => void;
  joining: boolean;
  groupLabel: string;
  isAgent: boolean;
}

/**
 * Formulario para unirse a un grupo o equipo existente mediante un código de invitación.
 */
export function JoinGroupForm({
  inviteCode,
  setInviteCode,
  onJoin,
  joining,
  groupLabel,
  isAgent
}: JoinGroupFormProps) {
  return (
    <div className="space-y-4 mt-4">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          {isAgent 
            ? "Pegá el código que te pasó el owner de tu agencia para unirte."
            : "Pegá el código que te enviaron para unirte al grupo familiar."
          }
        </p>
        <Label>Código de invitación</Label>
        <Input
          placeholder="Pegá el código acá"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          className="rounded-xl font-mono tracking-wider"
        />
      </div>
      <Button 
        onClick={onJoin} 
        disabled={joining || !inviteCode.trim()} 
        className="w-full rounded-xl"
      >
        {joining ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
        Unirme al {groupLabel}
      </Button>
    </div>
  );
}
