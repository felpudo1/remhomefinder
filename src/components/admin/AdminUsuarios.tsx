import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Shield, Loader2, CheckCircle, Clock, Ban, Trash2, ChevronUp, ChevronDown, Search, Phone, Star, Medal, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { OrgType } from "@/types/supabase";

interface UserProfile {
    user_id: string;
    display_name: string;
    email: string | null;
    phone: string;
    status: "active" | "pending" | "suspended" | "rejected";
    roles: string[];
    personal_count: number;
    saved_count: number;
    referral_count: number;
    plan_type: "free" | "premium";
    created_at: string;
    referred_by_id?: string | null;
    referred_by_name?: string;
    orgName?: string;
}

interface Props {
    toast: (opts: { title: string; description?: string; variant?: "default" | "destructive" }) => void;
}

const STATUS_CONFIG = {
    active: { label: "Activo", icon: CheckCircle, color: "bg-green-100 text-green-800" },
    pending: { label: "Pendiente", icon: Clock, color: "bg-yellow-100 text-yellow-800" },
    suspended: { label: "Suspendido", icon: Ban, color: "bg-orange-100 text-orange-800" },
    rejected: { label: "Eliminado", icon: Trash2, color: "bg-red-100 text-red-800" },
};

export function AdminUsuarios({ toast }: Props) {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const PAGE_SIZE = 50;

    const [sortConfig, setSortConfig] = useState<{ key: keyof UserProfile; direction: 'asc' | 'desc' }>({
        key: 'display_name',
        direction: 'asc'
    });

    const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null);
    const [confirmDeleteSingle, setConfirmDeleteSingle] = useState("");
    const [deleteReason, setDeleteReason] = useState("");
    const [isActionInProgress, setIsActionInProgress] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => { fetchUsers(); }, [page, sortConfig]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const from = page * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;

            const { data: profiles, error: profilesError, count } = await supabase
                .from("profiles")
                .select("user_id, display_name, email, status, plan_type, phone, created_at, referred_by_id", { count: "exact" })
                .order(sortConfig.key, { ascending: sortConfig.direction === 'asc' })
                .range(from, to);

            if (profilesError) {
                toast({ title: "Error al cargar usuarios", description: profilesError.message, variant: "destructive" });
                setLoading(false);
                return;
            }

            setTotalCount(count || 0);
            const userIds = profiles.map(p => p.user_id);

            if (userIds.length === 0) {
                setUsers([]);
                setLoading(false);
                return;
            }

            const referrerIds = [...new Set(profiles.map(p => p.referred_by_id).filter(Boolean))];

            // Obtenemos membresías de cada usuario para luego buscar la agencia a la que pertenecen
            const [rolesRes, listingsRes, membershipsRes, referralsRes, referrersNamesRes] = await Promise.all([
                supabase.from("user_roles").select("user_id, role").in("user_id", userIds),
                supabase.from("user_listings").select("added_by, source_publication_id").in("added_by", userIds),
                supabase.from("organization_members").select("user_id, org_id").in("user_id", userIds),
                supabase.from("profiles").select("user_id, referred_by_id").in("referred_by_id", userIds),
                supabase.from("profiles").select("user_id, display_name").in("user_id", referrerIds),
            ]);

            // Buscar nombres de agencias (agency_team, no personal) para las orgs encontradas
            const membershipOrgIds = [...new Set((membershipsRes.data || []).map((m) => m.org_id))];
            const orgNameMap: Record<string, string> = {};
            if (membershipOrgIds.length > 0) {
                const { data: agencyOrgs } = await supabase
                    .from("organizations")
                    .select("id, name")
                    .eq("type", "agency_team" satisfies OrgType)
                    .eq("is_personal", false)
                    .in("id", membershipOrgIds);

                // Mapa: org_id -> nombre de agencia
                const agencyOrgById: Record<string, string> = {};
                for (const o of agencyOrgs || []) {
                    agencyOrgById[o.id] = o.name;
                }

                // Mapa final: user_id -> nombre de su agencia (primera encontrada)
                for (const m of membershipsRes.data || []) {
                    if (agencyOrgById[m.org_id] && !orgNameMap[m.user_id]) {
                        orgNameMap[m.user_id] = agencyOrgById[m.org_id];
                    }
                }
            }

            const roleMap: Record<string, string[]> = {};
            for (const r of rolesRes.data || []) {
                if (!roleMap[r.user_id]) roleMap[r.user_id] = [];
                roleMap[r.user_id].push(r.role);
            }

            const personalCountMap: Record<string, number> = {};
            const savedCountMap: Record<string, number> = {};
            for (const l of listingsRes.data || []) {
                if (l.source_publication_id) {
                    savedCountMap[l.added_by] = (savedCountMap[l.added_by] || 0) + 1;
                } else {
                    personalCountMap[l.added_by] = (personalCountMap[l.added_by] || 0) + 1;
                }
            }

            // orgNameMap ya fue construido arriba con la lógica de membresías

            const referralsCountMap: Record<string, number> = {};
            for (const r of referralsRes.data || []) {
                if (r.referred_by_id) referralsCountMap[r.referred_by_id] = (referralsCountMap[r.referred_by_id] || 0) + 1;
            }

            const referrerNameMap: Record<string, string> = {};
            for (const r of referrersNamesRes.data || []) {
                referrerNameMap[r.user_id] = r.display_name;
            }

            setUsers((profiles || []).map((p: any) => ({
                user_id: p.user_id,
                display_name: p.display_name || "Sin nombre",
                email: p.email || "-",
                phone: p.phone || "-",
                status: p.status || "active",
                roles: roleMap[p.user_id] || ["user"],
                personal_count: personalCountMap[p.user_id] || 0,
                saved_count: savedCountMap[p.user_id] || 0,
                referral_count: referralsCountMap[p.user_id] || 0,
                plan_type: (p.plan_type as "free" | "premium") || "free",
                created_at: p.created_at,
                referred_by_id: p.referred_by_id,
                referred_by_name: p.referred_by_id ? referrerNameMap[p.referred_by_id] : undefined,
                orgName: orgNameMap[p.user_id],
            })));
        } catch (err: unknown) {
            console.error("Critical error in fetchUsers:", err);
            toast({ title: "Error fatal", description: "Ocurrió un error al procesar los datos de usuarios.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleSort = (key: keyof UserProfile) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
        }));
    };

    const filteredUsers = useMemo(() => {
        if (!searchQuery.trim()) return users;
        const q = searchQuery.toLowerCase().trim();
        return users.filter(u =>
            u.display_name.toLowerCase().includes(q) ||
            (u.email && u.email.toLowerCase().includes(q))
        );
    }, [users, searchQuery]);

    const updateStatus = async (userId: string, newStatus: UserProfile["status"]) => {
        const previousUsers = users;
        setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, status: newStatus } : u));
        const { error } = await supabase.rpc("admin_update_profile_status", { _user_id: userId, _status: newStatus });
        if (error) {
            setUsers(previousUsers);
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } else {
            toast({ title: "Estado actualizado", description: `Cambiado a "${STATUS_CONFIG[newStatus].label}".` });
        }
    };

    const updatePlan = async (userId: string, newPlan: "free" | "premium") => {
        const previousUsers = users;
        setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, plan_type: newPlan } : u));
        const { error } = await supabase.from("profiles").update({ plan_type: newPlan }).eq("user_id", userId);
        if (error) {
            setUsers(previousUsers);
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } else {
            toast({ title: "Plan actualizado", description: `Usuario ahora es ${newPlan.toUpperCase()}.` });
            fetchUsers();
        }
    };

    const handlePhysicalDelete = async (userId: string) => {
        const previousUsers = users;
        // Guardar reason ANTES de limpiar el estado
        const reason = deleteReason.trim();
        setUsers(prev => prev.filter(u => u.user_id !== userId));
        setDeletingUser(null);
        setConfirmDeleteSingle("");
        setDeleteReason("");
        try {
            setIsActionInProgress(true);
            // Obtener el admin que ejecuta la acción para el log de auditoría
            const { data: { user: adminUser } } = await supabase.auth.getUser();
            const { error } = await supabase.rpc("admin_physical_delete_user", {
                _user_id: userId,
                _reason: reason,
                _deleted_by: adminUser?.id,
            });
            if (error) {
                setUsers(previousUsers);
                toast({ title: "Error al eliminar", description: error.message, variant: "destructive" });
            } else {
                toast({ title: "Usuario eliminado", description: "El registro ha sido borrado físicamente de la base de datos." });
                fetchUsers();
            }
        } catch (err: unknown) {
            setUsers(previousUsers);
            toast({ title: "Error fatal", description: err instanceof Error ? err.message : "Error desconocido", variant: "destructive" });
        } finally {
            setIsActionInProgress(false);
        }
    };

    const SortIcon = ({ field }: { field: keyof UserProfile }) =>
        sortConfig.key === field
            ? sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
            : null;

    if (loading) {
        return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
    }

    return (
        <div className="space-y-3">
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar por nombre o email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 rounded-xl text-sm"
                />
            </div>

            {filteredUsers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    {searchQuery ? "No se encontraron usuarios con ese criterio." : "No hay usuarios registrados."}
                </div>
            ) : (
                <>
                    <div className="overflow-x-auto -mx-2">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="w-[160px]">
                                        <button onClick={() => handleSort('display_name')} className="flex items-center gap-1 hover:text-foreground text-[10px] font-bold uppercase tracking-wider">
                                            Usuario <SortIcon field="display_name" />
                                        </button>
                                    </TableHead>
                                    <TableHead className="w-[120px]">
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Organización/Origen</span>
                                    </TableHead>
                                    <TableHead className="w-[80px]">
                                        <button onClick={() => handleSort('roles')} className="flex items-center gap-1 hover:text-foreground text-[10px] font-bold uppercase tracking-wider">
                                            Rol <SortIcon field="roles" />
                                        </button>
                                    </TableHead>
                                    <TableHead className="w-[60px] text-center">
                                        <button onClick={() => handleSort('personal_count')} className="flex items-center gap-1 hover:text-foreground text-[10px] font-bold uppercase tracking-wider mx-auto">
                                            Props <SortIcon field="personal_count" />
                                        </button>
                                    </TableHead>
                                    <TableHead className="w-[50px] text-center">
                                        <button onClick={() => handleSort('referral_count')} className="flex items-center gap-1 hover:text-foreground text-[10px] font-bold uppercase tracking-wider mx-auto">
                                            Refs <SortIcon field="referral_count" />
                                        </button>
                                    </TableHead>
                                    <TableHead className="w-[90px]">
                                        <button onClick={() => handleSort('status')} className="flex items-center gap-1 hover:text-foreground text-[10px] font-bold uppercase tracking-wider">
                                            Estado <SortIcon field="status" />
                                        </button>
                                    </TableHead>
                                    <TableHead className="w-[90px]">
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Plan</span>
                                    </TableHead>
                                    <TableHead className="w-[110px]">
                                        <div className="flex items-center justify-between w-full">
                                            <span className="text-[10px] font-bold uppercase tracking-wider">Acciones</span>
                                            {/* Botón para refrescar la lista de usuarios manualmente */}
                                            <button
                                                title="Refrescar datos"
                                                onClick={async () => {
                                                    setIsRefreshing(true);
                                                    await fetchUsers();
                                                    setIsRefreshing(false);
                                                }}
                                                className="p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                                            >
                                                <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                                            </button>
                                        </div>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUsers.map((user) => {
                                    const statusCfg = STATUS_CONFIG[user.status] || STATUS_CONFIG.active;
                                    const StatusIcon = statusCfg.icon;
                                    const isAdmin = user.roles.includes("admin");

                                    return (
                                        <TableRow key={user.user_id} className="group">
                                            <TableCell className="py-2 px-3">
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <User className="w-3.5 h-3.5 text-primary/60 shrink-0" />
                                                    <span className="truncate text-sm font-medium">{user.display_name}</span>
                                                    <div className="flex items-center gap-1 shrink-0">
                                                        {user.plan_type === "premium" ? (
                                                            <span title="PREMIUM"><Star className="w-3 h-3 text-yellow-500 fill-yellow-500" /></span>
                                                        ) : (
                                                            <span title="FREE"><Star className="w-3 h-3 text-slate-300" /></span>
                                                        )}
                                                        {user.referred_by_id && (
                                                            <span title="REFERENCIADO"><Medal className="w-3 h-3 text-blue-500" /></span>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-2 px-3">
                                                <div className="flex flex-col min-w-0">
                                                    {user.orgName && (
                                                        <span className="truncate text-[10px] font-bold text-foreground" title={`Organización: ${user.orgName}`}>
                                                            {user.orgName}
                                                        </span>
                                                    )}
                                                    {user.referred_by_name && user.referred_by_id !== user.user_id && (
                                                        <span className="truncate text-[9px] font-medium text-primary/70 italic" title={`Referido por: ${user.referred_by_name}`}>
                                                            Ref: {user.referred_by_name}
                                                        </span>
                                                    )}
                                                    {!user.orgName && !user.referred_by_name && <span className="text-[10px] text-muted-foreground">-</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-2 px-3">
                                                <div className="flex flex-wrap gap-1">
                                                    {user.roles.map(r => (
                                                        <span key={r} className={cn(
                                                            "text-[9px] px-1.5 py-0.5 rounded font-bold uppercase",
                                                            r === 'admin' ? "bg-amber-100 text-amber-800" :
                                                                r === 'agency' ? "bg-purple-100 text-purple-800" :
                                                                    "bg-blue-50 text-blue-700"
                                                        )}>
                                                            {r === 'admin' ? '🛡️' : r === 'agency' ? '🏢' : '👤'} {r}
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
                                                <span className={cn(
                                                    "inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold",
                                                    user.referral_count > 0 ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
                                                )}>
                                                    {user.referral_count}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-2 px-3">
                                                <span className={cn("inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase", statusCfg.color)}>
                                                    <StatusIcon className="w-3 h-3" />
                                                    {statusCfg.label}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-2 px-3">
                                                <span className={cn(
                                                    "inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                                                    user.plan_type === "premium" ? "bg-primary/10 text-primary border border-primary/20" : "bg-muted text-muted-foreground border border-transparent"
                                                )}>
                                                    {user.plan_type}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-2 px-3">
                                                <div className="flex gap-1">
                                                    {!isAdmin && (
                                                        <>
                                                            <Select
                                                                value={user.status}
                                                                onValueChange={(val) => updateStatus(user.user_id, val as UserProfile["status"])}
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
                                                                onValueChange={(val) => updatePlan(user.user_id, val as "free" | "premium")}
                                                            >
                                                                <SelectTrigger className="h-6 text-[10px] w-[70px] rounded-lg">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="free">Free</SelectItem>
                                                                    <SelectItem value="premium">Premium</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                className="h-6 w-6 p-0 rounded-lg"
                                                                title="Borrar físicamente"
                                                                onClick={() => setDeletingUser(user)}
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>

                    {totalCount > PAGE_SIZE && (
                        <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
                            <span>Mostrando {page * PAGE_SIZE + 1} - {Math.min((page + 1) * PAGE_SIZE, totalCount)} de {totalCount}</span>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)} className="h-7 text-xs rounded-lg">
                                    Anterior
                                </Button>
                                <Button size="sm" variant="outline" disabled={(page + 1) * PAGE_SIZE >= totalCount} onClick={() => setPage(p => p + 1)} className="h-7 text-xs rounded-lg">
                                    Siguiente
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Modal de confirmación de borrado físico */}
            <AlertDialog open={!!deletingUser} onOpenChange={(open) => { if (!open) { setDeletingUser(null); setConfirmDeleteSingle(""); setDeleteReason(""); } }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-destructive">⚠️ Borrado físico permanente</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2">
                            <p>Estás a punto de eliminar <strong>permanentemente</strong> al usuario <strong>{deletingUser?.display_name}</strong> ({deletingUser?.email}).</p>
                            <p className="text-destructive font-semibold">Esta acción NO se puede deshacer. Se borrarán todos sus datos: propiedades, comentarios, calificaciones, membresías y su registro de autenticación.</p>
                            <div className="pt-2">
                                {/* Motivo obligatorio: el botón no se habilita sin él */}
                                <label className="text-xs font-medium">
                                    Motivo <span className="text-destructive">*</span>
                                </label>
                                <Input
                                    value={deleteReason}
                                    onChange={(e) => setDeleteReason(e.target.value)}
                                    placeholder="Ej: cuenta duplicada, spam, solicitud del usuario..."
                                    className="mt-1 text-sm"
                                />
                            </div>
                            <div className="pt-2">
                                <label className="text-xs font-medium">Escribí <strong>ELIMINAR</strong> para confirmar:</label>
                                <Input
                                    value={confirmDeleteSingle}
                                    onChange={(e) => setConfirmDeleteSingle(e.target.value)}
                                    placeholder="ELIMINAR"
                                    className="mt-1 text-sm"
                                />
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isActionInProgress}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={confirmDeleteSingle !== "ELIMINAR" || isActionInProgress || !deleteReason.trim()}
                            onClick={() => deletingUser && handlePhysicalDelete(deletingUser.user_id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isActionInProgress ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                            Eliminar permanentemente
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
