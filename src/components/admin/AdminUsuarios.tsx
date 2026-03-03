import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Mail, Calendar, Shield, Loader2 } from "lucide-react";

interface UserProfile {
    id: string;
    email: string;
    created_at: string;
    role?: string;
}

interface Props {
    toast: (opts: { title: string; description?: string; variant?: "default" | "destructive" }) => void;
}

/**
 * Sección de administración de usuarios.
 * Muestra todos los usuarios registrados con sus roles.
 */
export function AdminUsuarios({ toast }: Props) {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        // Obtenemos perfiles y roles de las tablas disponibles
        const { data: rolesData, error } = await supabase
            .from("user_roles")
            .select("user_id, role");

        if (error) {
            toast({ title: "Error al cargar usuarios", description: error.message, variant: "destructive" });
            setLoading(false);
            return;
        }

        // Agrupamos roles por usuario
        const roleMap: Record<string, string[]> = {};
        for (const r of rolesData || []) {
            if (!roleMap[r.user_id]) roleMap[r.user_id] = [];
            roleMap[r.user_id].push(r.role);
        }

        // Construimos la lista de usuarios con sus roles
        const userList: UserProfile[] = Object.entries(roleMap).map(([userId, roles]) => ({
            id: userId,
            email: "Usuario " + userId.slice(0, 8) + "...",
            created_at: new Date().toISOString(),
            role: roles.join(", "),
        }));

        setUsers(userList);
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (users.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                No hay usuarios con roles asignados.
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {/* Encabezado de tabla */}
            <div className="grid grid-cols-3 gap-4 px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                <span>Usuario ID</span>
                <span>Rol</span>
                <span>Tipo</span>
            </div>

            {users.map((user) => (
                <div key={user.id} className="grid grid-cols-3 gap-4 px-4 py-3 rounded-xl hover:bg-muted/50 transition-colors items-center text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="w-3.5 h-3.5 text-primary/60 shrink-0" />
                        <span className="font-mono text-xs truncate">{user.id.slice(0, 16)}…</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5 text-primary/60 shrink-0" />
                        <span className="text-foreground">{user.role}</span>
                    </div>
                    <div>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${user.role?.includes("admin") ? "bg-red-100 text-red-700" :
                                user.role?.includes("agency") ? "bg-blue-100 text-blue-700" :
                                    "bg-gray-100 text-gray-600"
                            }`}>
                            {user.role?.includes("admin") ? "Admin" :
                                user.role?.includes("agency") ? "Agente" : "Usuario"}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
}
