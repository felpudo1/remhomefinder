import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Shield, Loader2, CheckCircle, Clock, Ban, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface UserProfile {
    user_id: string;
    display_name: string;
    email: string | null;
    status: "active" | "pending" | "suspended" | "rejected";
    roles: string[];
    personal_count: number;
    saved_count: number;
    referral_count: number;
    plan_type: "free" | "premium";
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
    const PAGE_SIZE = 50;

    const [sortConfig, setSortConfig] = useState<{ key: keyof UserProfile; direction: 'asc' | 'desc' }>({
        key: 'display_name',
        direction: 'asc'
    });

    useEffect(() => { fetchUsers(); }, [page, sortConfig]);

    const fetchUsers = async () => {
        setLoading(true);

        const from = page * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        // Fetch profiles with pagination and count
        const { data: profiles, error: profilesError, count } = await supabase
            .from("profiles")
            .select("user_id, display_name, email, status, plan_type", { count: "exact" })
            .order(sortConfig.key === 'display_name' ? 'display_name' : 'user_id', {
                ascending: sortConfig.direction === 'asc'
            })
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

        // Fetch roles, properties, marketplace properties, agencies and referrals
        const [rolesRes, propsRes, agenciesRes, referralsRes] = await Promise.all([
            supabase.from("user_roles").select("user_id, role").in("user_id", userIds),
            supabase.from("properties").select("user_id, source_marketplace_id").in("user_id", userIds),
            supabase.from("agencies").select("id, created_by").in("created_by", userIds),
            supabase.from("profiles").select("user_id, referred_by_id").in("referred_by_id", userIds),
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
                // Es una propiedad guardada del marketplace
                savedCountMap[p.user_id] = (savedCountMap[p.user_id] || 0) + 1;
            } else {
                // Es una propiedad cargada manualmente
                personalCountMap[p.user_id] = (personalCountMap[p.user_id] || 0) + 1;
            }
        }

        // Map agency to creator user_id
        const agencyToUserMap: Record<string, string> = {};
        for (const a of agenciesRes.data || []) {
            agencyToUserMap[a.id] = a.created_by;
        }

        // Add marketplace properties (agent publishes) to personal count
        for (const mp of marketplacePropsRes.data || []) {
            const userId = agencyToUserMap[mp.agency_id];
            if (userId) {
                personalCountMap[userId] = (personalCountMap[userId] || 0) + 1;
            }
        }

        const referralsCountMap: Record<string, number> = {};
        for (const r of referralsRes.data || []) {
            if (r.referred_by_id) {
                referralsCountMap[r.referred_by_id] = (referralsCountMap[r.referred_by_id] || 0) + 1;
            }
        }

        const userList: UserProfile[] = (profiles || []).map((p: any) => ({
            user_id: p.user_id,
            display_name: p.display_name || "Sin nombre",
            email: p.email || "-",
            status: p.status || "active",
            roles: roleMap[p.user_id] || ["user"],
            personal_count: personalCountMap[p.user_id] || 0,
            saved_count: savedCountMap[p.user_id] || 0,
            referral_count: referralsCountMap[p.user_id] || 0,
            plan_type: (p.plan_type as "free" | "premium") || "free",
        }));

        setUsers(userList);
        setLoading(false);
    };

    const handleSort = (key: keyof UserProfile) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Nota: El sorting ya se realiza en la DB para display_name.
    // Para otros criterios (roles), se mantiene local solo para la página actual por ahora.
    const sortedUsers = [...users];

    const updateStatus = async (userId: string, newStatus: UserProfile["status"]) => {
        // Update optimista
        const previousUsers = users;
        setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, status: newStatus } : u));

        const { error } = await supabase.rpc("admin_update_profile_status", {
            _user_id: userId,
            _status: newStatus,
        });

        if (error) {
            setUsers(previousUsers);
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } else {
            toast({ title: "Estado actualizado", description: `Cambiado a "${STATUS_CONFIG[newStatus].label}".` });
        }
    };

    const updatePlan = async (userId: string, newPlan: "free" | "premium") => {
        // Update optimista
        const previousUsers = users;
        const targetUser = users.find(u => u.user_id === userId);
        setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, plan_type: newPlan } : u));

        const { error } = await supabase
            .from("profiles")
            .update({ plan_type: newPlan })
            .eq("user_id", userId);

        if (error) {
            setUsers(previousUsers);
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } else {
            toast({ title: "Plan actualizado", description: `Usuario ahora es ${newPlan.toUpperCase()}.` });
            fetchUsers();
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (users.length === 0) {
        return <div className="text-center py-12 text-muted-foreground">No hay usuarios registrados.</div>;
    }

    return (
        <div className="space-y-4">
            <div className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-thin scrollbar-thumb-muted-foreground/20">
                <div className="min-w-[1000px] space-y-2">
                    {/* Encabezado de la Tabla */}
                    <div className="grid grid-cols-[1.5fr_1.5fr_0.8fr_0.8fr_0.8fr_1fr_1.8fr] gap-4 px-4 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border select-none">
                        <button
                            onClick={() => handleSort('display_name')}
                            className="flex items-center gap-1 hover:text-foreground transition-colors text-left font-bold"
                        >
                            Usuario
                            {sortConfig.key === 'display_name' && (
                                sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                            )}
                        </button>
                        <div className="flex items-center gap-1 text-left font-bold">
                            Email
                        </div>
                        <button
                            onClick={() => handleSort('roles')}
                            className="flex items-center gap-1 hover:text-foreground transition-colors text-left font-bold"
                        >
                            Rol
                            {sortConfig.key === 'roles' && (
                                sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                            )}
                        </button>
                        <button
                            onClick={() => handleSort('personal_count')}
                            className="flex items-center gap-1 hover:text-foreground transition-colors text-left font-bold"
                        >
                            Propiedades
                            {sortConfig.key === 'personal_count' && (
                                sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                            )}
                        </button>
                        <button
                            onClick={() => handleSort('referral_count')}
                            className="flex items-center gap-1 hover:text-foreground transition-colors text-left font-bold"
                        >
                            Referidos
                            {sortConfig.key === 'referral_count' && (
                                sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                            )}
                        </button>
                        <button
                            onClick={() => handleSort('status')}
                            className="flex items-center gap-1 hover:text-foreground transition-colors text-left font-bold"
                        >
                            Estado
                            {sortConfig.key === 'status' && (
                                sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                            )}
                        </button>
                        <div className="grid grid-cols-2 gap-2">
                            <span>Plan</span>
                            <span>Acción</span>
                        </div>
                    </div>

                    {/* Listado de Usuarios */}
                    {sortedUsers.map((user) => {
                        const sc = STATUS_CONFIG[user.status];
                        const StatusIcon = sc.icon;
                        const isAdmin = user.roles.includes("admin");

                        return (
                            <div key={user.user_id} className="grid grid-cols-[1.5fr_1.5fr_0.8fr_0.8fr_0.8fr_1fr_1.8fr] gap-4 px-4 py-3 rounded-xl hover:bg-muted/50 transition-colors items-center text-sm">
                                <div className="flex items-center gap-2 min-w-0">
                                    <User className="w-3.5 h-3.5 text-primary/60 shrink-0" />
                                    <span className="truncate text-foreground font-medium">{user.display_name}</span>
                                </div>
                                <div className="min-w-0">
                                    <span className="truncate text-muted-foreground text-xs">{user.email}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Shield className="w-3.5 h-3.5 text-primary/60 shrink-0" />
                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${user.roles.includes("admin") ? "bg-red-100 text-red-700" :
                                        user.roles.includes("agency") ? "bg-blue-100 text-blue-700" :
                                            "bg-gray-100 text-gray-600"
                                        }`}>
                                        {user.roles.includes("admin") ? "Admin" :
                                            user.roles.includes("agency") ? "Agente" : "Usuario"}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span
                                        title="Propiedades propias/publicadas"
                                        className="inline-flex items-center justify-center bg-blue-100 text-blue-700 w-6 h-6 rounded-full text-[10px] font-bold shadow-sm"
                                    >
                                        {user.personal_count}
                                    </span>
                                    {!user.roles.includes("agency") && (
                                        <span
                                            title="Propiedades guardadas del marketplace"
                                            className="inline-flex items-center justify-center bg-orange-100 text-orange-700 w-6 h-6 rounded-full text-[10px] font-bold shadow-sm"
                                        >
                                            {user.saved_count}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center">
                                    <span className="inline-flex items-center justify-center bg-green-100 text-green-700 px-2 py-0.5 rounded-md text-xs font-semibold min-w-8">
                                        {user.referral_count}
                                    </span>
                                </div>
                                <div>
                                    <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium ${sc.color}`}>
                                        <StatusIcon className="w-3 h-3" />
                                        {sc.label}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <Select value={user.plan_type} onValueChange={(v) => updatePlan(user.user_id, v as "free" | "premium")}>
                                        <SelectTrigger className={cn(
                                            "h-8 rounded-xl text-[10px] font-bold uppercase tracking-wider",
                                            user.plan_type === "premium" ? "bg-primary/10 text-primary border-primary/20" : "bg-muted"
                                        )}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="free" className="text-[10px] font-bold uppercase tracking-wider">Free</SelectItem>
                                            <SelectItem value="premium" className="text-[10px] font-bold uppercase tracking-wider">Premium</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    {isAdmin ? (
                                        <span className="text-xs text-muted-foreground text-center">—</span>
                                    ) : (
                                        <Select value={user.status} onValueChange={(v) => updateStatus(user.user_id, v as UserProfile["status"])}>
                                            <SelectTrigger className="h-8 rounded-xl text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="active"><span className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3" /> Activo</span></SelectItem>
                                                <SelectItem value="pending"><span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> Pendiente</span></SelectItem>
                                                <SelectItem value="suspended"><span className="flex items-center gap-1.5"><Ban className="w-3 h-3" /> Suspendido</span></SelectItem>
                                                <SelectItem value="rejected"><span className="flex items-center gap-1.5"><Trash2 className="w-3 h-3" /> Eliminado</span></SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            {/* Controles de Paginación */}
            <div className="flex items-center justify-between px-4 py-4 border-t border-border mt-4">
                <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                    Mostrando {users.length} de {totalCount} usuarios
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0 || loading}
                        className="h-8 rounded-xl px-4 text-xs"
                    >
                        Anterior
                    </Button>
                    <div className="flex items-center px-3 text-xs font-bold text-primary bg-primary/10 rounded-xl h-8">
                        {page + 1}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => p + 1)}
                        disabled={(page + 1) * PAGE_SIZE >= totalCount || loading}
                        className="h-8 rounded-xl px-4 text-xs"
                    >
                        Siguiente
                    </Button>
                </div>
            </div>
        </div>
    );
}
