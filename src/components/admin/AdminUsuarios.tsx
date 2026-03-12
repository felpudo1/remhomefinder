import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Shield, Loader2, CheckCircle, Clock, Ban, Trash2, ChevronUp, ChevronDown, Search, Phone } from "lucide-react";
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
    agency_name?: string;
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

            // IDs de referidores únicos para buscar sus nombres
            const referrerIds = [...new Set(profiles.map(p => p.referred_by_id).filter(Boolean))];

            const [rolesRes, propsRes, agenciesRes, referralsRes, referrersNamesRes] = await Promise.all([
                supabase.from("user_roles").select("user_id, role").in("user_id", userIds),
                supabase.from("properties").select("user_id, source_marketplace_id").in("user_id", userIds),
                supabase.from("agencies").select("id, created_by, name").in("created_by", userIds),
                supabase.from("profiles").select("user_id, referred_by_id").in("referred_by_id", userIds),
                supabase.from("profiles").select("user_id, display_name").in("user_id", referrerIds),
            ]);

            const agencyIds = (agenciesRes.data || []).map(a => a.id);
            let marketplacePropsRes = { data: [] as any[] };
            if (agencyIds.length > 0) {
                const res = await supabase.from("marketplace_properties").select("agency_id").in("agency_id", agencyIds);
                marketplacePropsRes = { data: res.data || [] };
            }

            const roleMap: Record<string, string[]> = {};
            for (const r of rolesRes.data || []) {
                if (!roleMap[r.user_id]) roleMap[r.user_id] = [];
                roleMap[r.user_id].push(r.role);
            }

            const personalCountMap: Record<string, number> = {};
            const savedCountMap: Record<string, number> = {};
            for (const p of propsRes.data || []) {
                if (p.source_marketplace_id) {
                    savedCountMap[p.user_id] = (savedCountMap[p.user_id] || 0) + 1;
                } else {
                    personalCountMap[p.user_id] = (personalCountMap[p.user_id] || 0) + 1;
                }
            }

            const agencyToUserMap: Record<string, string> = {};
            const agencyNameMap: Record<string, string> = {};
            for (const a of agenciesRes.data || []) {
                agencyToUserMap[a.id] = a.created_by;
                agencyNameMap[a.created_by] = a.name;
            }

            for (const mp of marketplacePropsRes.data || []) {
                const userId = agencyToUserMap[mp.agency_id];
                if (userId) personalCountMap[userId] = (personalCountMap[userId] || 0) + 1;
            }

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
                agency_name: agencyNameMap[p.user_id],
            })));
        } catch (err: any) {
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
        setUsers(prev => prev.filter(u => u.user_id !== userId));
        setDeletingUser(null);
        setConfirmDeleteSingle("");
        setDeleteReason("");
        try {
            setIsActionInProgress(true);
            const { error } = await supabase.rpc("admin_physical_delete_user", { _user_id: userId });
            if (error) {
                setUsers(previousUsers);
                toast({ title: "Error al eliminar", description: error.message, variant: "destructive" });
            } else {
                toast({ title: "Usuario eliminado", description: "El registro ha sido borrado físicamente de la base de datos." });
                fetchUsers();
            }
        } catch (err: any) {
            setUsers(previousUsers);
            toast({ title: "Error fatal", description: err.message, variant: "destructive" });
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
            {/* Buscador */}
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
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Agencia/Origen</span>
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
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Acciones</span>
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
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-2 px-3">
                                                <span className="text-[10px] font-bold truncate max-w-[110px] block" title={user.agency_name || user.referred_by_name || "-"}>
                                                    {user.agency_name || user.referred_by_name || "-"}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-2 px-3">
                                                <span className={cn(
                                                    "inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold",
                                                    user.roles.includes("admin") ? "bg-red-100 text-red-700" :
                                                        user.roles.includes("agency") ? "bg-blue-100 text-blue-700" :
                                                            "bg-muted text-muted-foreground"
                                                )}>
                                                    {user.roles.includes("admin") ? "Admin" :
                                                        user.roles.includes("agency") ? "Agente" : "User"}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-2 px-3 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <span title="Propias" className="inline-flex items-center justify-center bg-blue-100 text-blue-700 w-5 h-5 rounded-full text-[10px] font-bold">
                                                        {user.personal_count}
                                                    </span>
                                                    {!user.roles.includes("agency") && (
                                                        <span title="Guardadas" className="inline-flex items-center justify-center bg-orange-100 text-orange-700 w-5 h-5 rounded-full text-[10px] font-bold">
                                                            {user.saved_count}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-2 px-3 text-center">
                                                <span className="text-xs font-semibold text-green-700">{user.referral_count}</span>
                                            </TableCell>
                                            <TableCell className="py-2 px-3">
                                                <span className={cn("inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium", statusCfg.color)}>
                                                    <StatusIcon className="w-3 h-3" />
                                                    {statusCfg.label}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-2 px-3">
                                                <Select value={user.plan_type} onValueChange={(v) => updatePlan(user.user_id, v as "free" | "premium")}>
                                                    <SelectTrigger className={cn(
                                                        "h-7 rounded-lg text-[10px] font-bold uppercase w-[80px]",
                                                        user.plan_type === "premium" ? "bg-primary/10 text-primary border-primary/20" : "bg-muted"
                                                    )}>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="free" className="text-[10px] font-bold uppercase">Free</SelectItem>
                                                        <SelectItem value="premium" className="text-[10px] font-bold uppercase">Premium</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell className="py-2 px-3">
                                                <div className="flex items-center gap-1">
                                                    {!isAdmin ? (
                                                        <Select value={user.status} onValueChange={(v) => updateStatus(user.user_id, v as UserProfile["status"])}>
                                                            <SelectTrigger className="h-7 rounded-lg text-[10px] w-[100px]">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="active"><span className="flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Activo</span></SelectItem>
                                                                <SelectItem value="pending"><span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Pendiente</span></SelectItem>
                                                                <SelectItem value="suspended"><span className="flex items-center gap-1"><Ban className="w-3 h-3" /> Suspendido</span></SelectItem>
                                                                <SelectItem value="rejected"><span className="flex items-center gap-1"><Trash2 className="w-3 h-3" /> Eliminado</span></SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-muted-foreground w-[100px] text-center">ADMIN</span>
                                                    )}
                                                    {!isAdmin && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => setDeletingUser(user)}
                                                            className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
                                                            title="Borrado físico"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Paginación */}
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                            {searchQuery ? `${filteredUsers.length} resultados` : `${users.length} de ${totalCount}`}
                        </span>
                        {!searchQuery && (
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="h-7 rounded-lg px-3 text-xs">
                                    Anterior
                                </Button>
                                <span className="flex items-center px-2 text-xs font-bold text-primary bg-primary/10 rounded-lg h-7">{page + 1}</span>
                                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={(page + 1) * PAGE_SIZE >= totalCount} className="h-7 rounded-lg px-3 text-xs">
                                    Siguiente
                                </Button>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Dialog de borrado físico */}
            <AlertDialog open={!!deletingUser} onOpenChange={(open) => {
                if (!open) { setDeletingUser(null); setConfirmDeleteSingle(""); setDeleteReason(""); }
            }}>
                <AlertDialogContent className="rounded-2xl border-2 border-red-100 shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-red-600 flex items-center gap-2">
                            <Trash2 className="w-5 h-5" /> ¿Eliminar permanentemente?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-3">
                            <p>Estás a punto de borrar a <strong>{deletingUser?.display_name}</strong>. Esta acción NO se puede deshacer.</p>
                            <div className="space-y-2 pt-2">
                                <p className="text-xs font-bold uppercase text-muted-foreground">Motivo (opcional)</p>
                                <textarea
                                    className="w-full min-h-[60px] p-3 rounded-xl border border-input text-sm resize-none focus-visible:ring-1 focus-visible:ring-ring bg-muted/30"
                                    placeholder="Motivo de eliminación..."
                                    value={deleteReason}
                                    onChange={(e) => setDeleteReason(e.target.value)}
                                />
                            </div>
                            <p className="text-sm font-semibold pt-2">Escribe <span className="text-red-600 font-bold">ELIMINAR</span> para confirmar:</p>
                            <Input
                                value={confirmDeleteSingle}
                                onChange={(e) => setConfirmDeleteSingle(e.target.value)}
                                placeholder="ELIMINAR"
                                className="border-red-200 focus-visible:ring-red-500 rounded-xl"
                            />
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="rounded-xl" disabled={isActionInProgress}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => { e.preventDefault(); if (deletingUser) handlePhysicalDelete(deletingUser.user_id); }}
                            disabled={confirmDeleteSingle !== "ELIMINAR" || isActionInProgress}
                            className="bg-red-600 hover:bg-red-700 rounded-xl text-white font-bold"
                        >
                            {isActionInProgress ? <Loader2 className="w-4 h-4 animate-spin" /> : "ELIMINAR"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
