import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Shield, Loader2, CheckCircle, Clock, Ban, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface UserProfile {
    user_id: string;
    display_name: string;
    status: "active" | "pending" | "suspended" | "rejected";
    roles: string[];
    property_count: number;
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
            .select("user_id, display_name, status", { count: "exact" })
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

        // Fetch roles and properties only for the current page users
        const [rolesRes, propsRes] = await Promise.all([
            supabase.from("user_roles").select("user_id, role").in("user_id", userIds),
            supabase.from("properties").select("user_id").in("user_id", userIds),
        ]);

        const roleMap: Record<string, string[]> = {};
        for (const r of rolesRes.data || []) {
            if (!roleMap[r.user_id]) roleMap[r.user_id] = [];
            roleMap[r.user_id].push(r.role);
        }

        const propsCountMap: Record<string, number> = {};
        for (const p of propsRes.data || []) {
            propsCountMap[p.user_id] = (propsCountMap[p.user_id] || 0) + 1;
        }

        const userList: UserProfile[] = (profiles || []).map((p: any) => ({
            user_id: p.user_id,
            display_name: p.display_name || "Sin nombre",
            status: p.status || "active",
            roles: roleMap[p.user_id] || ["user"],
            property_count: propsCountMap[p.user_id] || 0,
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
        // Update optimista: actualizar el estado local de inmediato sin esperar al servidor
        const previousUsers = users;
        setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, status: newStatus } : u));

        const { error } = await supabase.rpc("admin_update_profile_status", {
            _user_id: userId,
            _status: newStatus,
        });

        if (error) {
            // Rollback: revertir al estado anterior si falló
            setUsers(previousUsers);
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } else {
            toast({ title: "Estado actualizado", description: `Cambiado a "${STATUS_CONFIG[newStatus].label}".` });
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
        <div className="space-y-2">
            <div className="grid grid-cols-5 gap-4 px-4 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border select-none">
                <button
                    onClick={() => handleSort('display_name')}
                    className="flex items-center gap-1 hover:text-foreground transition-colors text-left font-bold"
                >
                    Usuario
                    {sortConfig.key === 'display_name' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                    )}
                </button>
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
                    onClick={() => handleSort('property_count')}
                    className="flex items-center gap-1 hover:text-foreground transition-colors text-left font-bold"
                >
                    Propiedades
                    {sortConfig.key === 'property_count' && (
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
                <span>Acción</span>
            </div>

            {sortedUsers.map((user) => {
                const sc = STATUS_CONFIG[user.status];
                const StatusIcon = sc.icon;
                const isAdmin = user.roles.includes("admin");

                return (
                    <div key={user.user_id} className="grid grid-cols-5 gap-4 px-4 py-3 rounded-xl hover:bg-muted/50 transition-colors items-center text-sm">
                        <div className="flex items-center gap-2 min-w-0">
                            <User className="w-3.5 h-3.5 text-primary/60 shrink-0" />
                            <span className="truncate text-foreground">{user.display_name}</span>
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
                        <div className="flex items-center">
                            <span className="inline-flex items-center justify-center bg-primary/10 text-primary px-2 py-0.5 rounded-md text-xs font-semibold min-w-8">
                                {user.property_count}
                            </span>
                        </div>
                        <div>
                            <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium ${sc.color}`}>
                                <StatusIcon className="w-3 h-3" />
                                {sc.label}
                            </span>
                        </div>
                        <div className="shrink-0">
                            {isAdmin ? (
                                <span className="text-xs text-muted-foreground">—</span>
                            ) : (
                                <Select value={user.status} onValueChange={(v) => updateStatus(user.user_id, v as UserProfile["status"])}>
                                    <SelectTrigger className="h-8 rounded-xl text-xs w-[130px]">
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
