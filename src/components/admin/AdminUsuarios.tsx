import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Shield, Loader2, CheckCircle, Clock, Ban, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface UserProfile {
    user_id: string;
    display_name: string;
    status: "active" | "pending" | "suspended" | "rejected";
    roles: string[];
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

    useEffect(() => { fetchUsers(); }, []);

    const fetchUsers = async () => {
        setLoading(true);

        // Fetch profiles and roles in parallel
        const [profilesRes, rolesRes] = await Promise.all([
            supabase.from("profiles").select("user_id, display_name, status"),
            supabase.from("user_roles").select("user_id, role"),
        ]);

        if (profilesRes.error || rolesRes.error) {
            toast({ title: "Error al cargar usuarios", description: profilesRes.error?.message || rolesRes.error?.message, variant: "destructive" });
            setLoading(false);
            return;
        }

        const roleMap: Record<string, string[]> = {};
        for (const r of rolesRes.data || []) {
            if (!roleMap[r.user_id]) roleMap[r.user_id] = [];
            roleMap[r.user_id].push(r.role);
        }

        const userList: UserProfile[] = (profilesRes.data || []).map((p: any) => ({
            user_id: p.user_id,
            display_name: p.display_name || "Sin nombre",
            status: p.status || "active",
            roles: roleMap[p.user_id] || ["user"],
        }));

        // Sort: admins first, then agencies, then users
        userList.sort((a, b) => {
            const priority = (roles: string[]) => roles.includes("admin") ? 0 : roles.includes("agency") ? 1 : 2;
            return priority(a.roles) - priority(b.roles);
        });

        setUsers(userList);
        setLoading(false);
    };

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
            <div className="grid grid-cols-4 gap-4 px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                <span>Usuario</span>
                <span>Rol</span>
                <span>Estado</span>
                <span>Acción</span>
            </div>

            {users.map((user) => {
                const sc = STATUS_CONFIG[user.status];
                const StatusIcon = sc.icon;
                const isAdmin = user.roles.includes("admin");

                return (
                    <div key={user.user_id} className="grid grid-cols-4 gap-4 px-4 py-3 rounded-xl hover:bg-muted/50 transition-colors items-center text-sm">
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
        </div>
    );
}
