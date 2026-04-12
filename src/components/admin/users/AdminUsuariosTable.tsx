import { CheckCircle, ChevronDown, ChevronUp, Clock, Ban, Medal, Star, Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { AgentRole, AdminStatusConfig, UserProfile } from "./adminUsuariosTypes";

const STATUS_CONFIG: Record<UserProfile["status"], AdminStatusConfig> = {
  active: { label: "Activo", icon: CheckCircle, color: "bg-green-100 text-green-800" },
  pending: { label: "Pendiente", icon: Clock, color: "bg-yellow-100 text-yellow-800" },
  suspended: { label: "Suspendido", icon: Ban, color: "bg-orange-100 text-orange-800" },
  rejected: { label: "Eliminado", icon: Trash2, color: "bg-red-100 text-red-800" },
};

interface AdminUsuariosTableProps {
  users: UserProfile[];
  totalCount: number;
  pageSize: number;
  page: number;
  sortKey: keyof UserProfile;
  sortDirection: "asc" | "desc";
  searchQuery: string;
  onSort: (key: keyof UserProfile) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onUpdateStatus: (userId: string, newStatus: UserProfile["status"]) => Promise<void>;
  onUpdatePlan: (userId: string, newPlan: "free" | "premium") => Promise<void>;
  onUpdateRole: (userId: string, newRole: AgentRole) => Promise<void>;
  onDelete: (user: UserProfile) => void;
}

/**
 * Tabla principal del módulo de usuarios administrables.
 * Se apoya en subcomponentes internos para bajar complejidad visual.
 */
export function AdminUsuariosTable({
  users,
  totalCount,
  pageSize,
  page,
  sortKey,
  sortDirection,
  searchQuery,
  onSort,
  onPreviousPage,
  onNextPage,
  onUpdateStatus,
  onUpdatePlan,
  onUpdateRole,
  onDelete,
}: AdminUsuariosTableProps) {
  if (users.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {searchQuery ? "No se encontraron usuarios con ese criterio." : "No hay usuarios registrados."}
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto -mx-2">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[200px]">
                <SortableHead
                  label={`Usuario (${totalCount})`}
                  field="display_name"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={onSort}
                />
              </TableHead>
              <TableHead className="w-[160px]">
                <span className="text-[10px] font-bold uppercase tracking-wider">Email</span>
              </TableHead>
              <TableHead className="w-[120px]">
                <span className="text-[10px] font-bold uppercase tracking-wider">Organización/Origen</span>
              </TableHead>
              <TableHead className="w-[80px]">
                <SortableHead
                  label="Rol"
                  field="roles"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={onSort}
                  title="Orden solo entre usuarios de esta página"
                />
              </TableHead>
              <TableHead className="w-[60px] text-center">
                <SortableHead
                  label="Props"
                  field="personal_count"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={onSort}
                  title="Orden solo entre usuarios de esta página"
                  centered
                />
              </TableHead>
              <TableHead className="w-[50px] text-center">
                <SortableHead
                  label="Refs"
                  field="referral_count"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={onSort}
                  title="Orden solo entre usuarios de esta página"
                  centered
                />
              </TableHead>
              <TableHead className="w-[90px]">
                <SortableHead
                  label="Estado"
                  field="status"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={onSort}
                />
              </TableHead>
              <TableHead className="w-[90px]">
                <span className="text-[10px] font-bold uppercase tracking-wider">Plan</span>
              </TableHead>
              <TableHead className="w-[110px]">
                <span className="text-[10px] font-bold uppercase tracking-wider">Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {users.map((user) => (
              <AdminUsuariosTableRow
                key={user.user_id}
                user={user}
                onUpdateStatus={onUpdateStatus}
                onUpdatePlan={onUpdatePlan}
                onUpdateRole={onUpdateRole}
                onDelete={onDelete}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {totalCount > pageSize && (
        <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
          <span>
            Mostrando {page * pageSize + 1} - {Math.min((page + 1) * pageSize, totalCount)} de {totalCount}
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page === 0}
              onClick={onPreviousPage}
              className="h-7 text-xs rounded-lg"
            >
              Anterior
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={(page + 1) * pageSize >= totalCount}
              onClick={onNextPage}
              className="h-7 text-xs rounded-lg"
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

function SortableHead({
  label,
  field,
  sortKey,
  sortDirection,
  onSort,
  title,
  centered = false,
}: {
  label: string;
  field: keyof UserProfile;
  sortKey: keyof UserProfile;
  sortDirection: "asc" | "desc";
  onSort: (key: keyof UserProfile) => void;
  title?: string;
  centered?: boolean;
}) {
  return (
    <button
      title={title}
      onClick={() => onSort(field)}
      className={cn(
        "flex items-center gap-1 hover:text-foreground text-[10px] font-bold uppercase tracking-wider",
        centered && "mx-auto"
      )}
    >
      {label}
      {sortKey === field ? (
        sortDirection === "asc" ? (
          <ChevronUp className="w-3 h-3" />
        ) : (
          <ChevronDown className="w-3 h-3" />
        )
      ) : null}
    </button>
  );
}

function AdminUsuariosTableRow({
  user,
  onUpdateStatus,
  onUpdatePlan,
  onUpdateRole,
  onDelete,
}: {
  user: UserProfile;
  onUpdateStatus: (userId: string, newStatus: UserProfile["status"]) => Promise<void>;
  onUpdatePlan: (userId: string, newPlan: "free" | "premium") => Promise<void>;
  onUpdateRole: (userId: string, newRole: AgentRole) => Promise<void>;
  onDelete: (user: UserProfile) => void;
}) {
  const statusConfig = STATUS_CONFIG[user.status] || STATUS_CONFIG.active;
  const StatusIcon = statusConfig.icon;
  const isAdmin = user.roles.includes("admin");
  const isPlainUserRole =
    user.roles.includes("user") &&
    !user.roles.includes("agency") &&
    !user.roles.includes("agencymember");

  return (
    <TableRow className="group">
      <TableCell className="py-2 px-3">
        <div className="flex items-center gap-1.5 min-w-0">
          {!isAdmin && (
            <Button
              size="sm"
              variant="ghost"
              className="h-5 w-5 p-0 rounded shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-50"
              title="Borrar físicamente"
              onClick={() => onDelete(user)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
          <User className="w-3.5 h-3.5 text-primary/60 shrink-0" />
          <span className="truncate text-sm font-medium">{user.display_name}</span>
          <div className="flex items-center gap-1 shrink-0">
            {user.plan_type === "premium" ? (
              <span title="PREMIUM">
                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
              </span>
            ) : (
              <span title="FREE">
                <Star className="w-3 h-3 text-slate-300" />
              </span>
            )}
            {user.referred_by_id && (
              <span title="REFERENCIADO">
                <Medal className="w-3 h-3 text-blue-500" />
              </span>
            )}
          </div>
        </div>
      </TableCell>

      <TableCell className="py-2 px-3">
        <span className="truncate text-xs text-muted-foreground" title={user.email}>
          {user.email || "-"}
        </span>
      </TableCell>

      <TableCell className="py-2 px-3">
        <div className="flex flex-col min-w-0">
          {user.orgName && (
            <span
              className="truncate text-[10px] font-bold text-foreground"
              title={`Organización: ${user.orgName}`}
            >
              {user.orgName}
            </span>
          )}

          {user.referred_by_name && user.referred_by_id !== user.user_id && (
            <span
              className="truncate text-[9px] font-medium text-primary/70 italic"
              title={`Referido por: ${user.referred_by_name}`}
            >
              Ref: {user.referred_by_name}
            </span>
          )}

          {!user.orgName && !user.referred_by_name && (
            <span className="text-[10px] text-muted-foreground">-</span>
          )}
        </div>
      </TableCell>

      <TableCell className="py-2 px-3">
        <div className="flex flex-wrap gap-1">
          {user.roles.map((role) => (
            <span
              key={role}
              className={cn(
                "text-[9px] px-1.5 py-0.5 rounded font-bold uppercase",
                role === "admin"
                  ? "bg-amber-100 text-amber-800"
                  : role === "agency"
                    ? "bg-purple-100 text-purple-800"
                    : role === "agencymember"
                      ? "bg-violet-100 text-violet-800"
                      : "bg-blue-50 text-blue-700"
              )}
            >
              {role === "admin" ? "🛡️" : role === "agency" ? "🏢" : role === "agencymember" ? "🧩" : "👤"}{" "}
              {role}
            </span>
          ))}
        </div>
      </TableCell>

      <TableCell className="py-2 px-3 text-center">
        <div className="flex flex-col items-center gap-0.5">
          <span className="inline-flex items-center justify-center bg-blue-100 text-blue-700 w-5 h-5 rounded-full text-[10px] font-bold">
            {user.personal_count}
          </span>
          {user.saved_count > 0 && (
            <span className="text-[8px] text-muted-foreground">+{user.saved_count} mkt</span>
          )}
        </div>
      </TableCell>

      <TableCell className="py-2 px-3 text-center">
        <span
          className={cn(
            "inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold",
            user.referral_count > 0 ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
          )}
        >
          {user.referral_count}
        </span>
      </TableCell>

      <TableCell className="py-2 px-3">
        <span
          className={cn(
            "inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase",
            statusConfig.color
          )}
        >
          <StatusIcon className="w-3 h-3" />
          {statusConfig.label}
        </span>
      </TableCell>

      <TableCell className="py-2 px-3">
        <span
          className={cn(
            "inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
            user.plan_type === "premium"
              ? "bg-primary/10 text-primary border border-primary/20"
              : "bg-muted text-muted-foreground border border-transparent"
          )}
        >
          {user.plan_type}
        </span>
      </TableCell>

      <TableCell className="py-2 px-3">
        <div className="flex gap-1">
          {!isAdmin && (
            <>
              <Select
                value={user.status}
                onValueChange={(value) => onUpdateStatus(user.user_id, value as UserProfile["status"])}
              >
                <SelectTrigger className="h-6 text-[10px] w-[80px] rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="suspended">Suspendido</SelectItem>
                  <SelectItem value="rejected">Eliminado</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={user.plan_type}
                onValueChange={(value) => onUpdatePlan(user.user_id, value as "free" | "premium")}
              >
                <SelectTrigger className="h-6 text-[10px] w-[70px] rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={
                  user.roles.includes("agency")
                    ? "agency"
                    : user.roles.includes("agencymember")
                      ? "agencymember"
                      : "user"
                }
                onValueChange={(value) => onUpdateRole(user.user_id, value as AgentRole)}
                disabled={isPlainUserRole}
              >
                <SelectTrigger
                  className="h-6 text-[10px] w-[110px] rounded-lg"
                  title={isPlainUserRole ? "Solo lectura para cuentas User" : "Cambiar rol"}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="agency">Agency</SelectItem>
                  <SelectItem value="agencymember">AgencyMember</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
