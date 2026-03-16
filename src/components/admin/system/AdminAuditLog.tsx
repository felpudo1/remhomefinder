/**
 * ARCHIVO: AdminAuditLog.tsx
 * Panel de solo lectura para visualizar los logs de auditoría de acciones críticas.
 * Muestra quién eliminó usuarios y publicaciones, con motivo y timestamp.
 * NO permite ninguna acción de modificación — solo visualización.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ShieldAlert, User, FileText, RefreshCw } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// Forma del registro de borrado de usuario
interface UserDeletionRecord {
    id: string;
    deleted_user_id: string;
    display_name: string | null;
    email: string | null;
    phone: string | null;
    plan_type: string | null;
    status_before: string | null;
    reason: string;
    deleted_by: string;
    deleted_at: string;
    deleted_by_name?: string; // Nombre del admin que borró
}

// Forma del registro de borrado de publicación
interface PubDeletionRecord {
    id: string;
    pub_id: string | null;
    pub_type: string | null;
    title: string | null;
    org_name: string | null;
    status_before: string | null;
    reason: string;
    deleted_by: string;
    deleted_at: string;
    deleted_by_name?: string; // Nombre del admin que borró
}

export function AdminAuditLog() {
    // --- Estado para log de usuarios eliminados ---
    const [userLog, setUserLog] = useState<UserDeletionRecord[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(true);

    // --- Estado para log de publicaciones eliminadas ---
    const [pubLog, setPubLog] = useState<PubDeletionRecord[]>([]);
    const [loadingPubs, setLoadingPubs] = useState(true);

    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        fetchUserLog();
        fetchPubLog();
    }, []);

    /**
     * Carga el log de usuarios eliminados físicamente.
     * Después une con profiles para obtener el nombre del admin que ejecutó la acción.
     */
    const fetchUserLog = async () => {
        setLoadingUsers(true);
        try {
            const { data, error } = await supabase
                .from("deletion_audit_log")
                .select("*")
                .order("deleted_at", { ascending: false })
                .limit(200);

            if (error) throw error;

            const records = data || [];
            const adminIds = [...new Set(records.map((r: any) => r.deleted_by).filter(Boolean))];

            // Obtener nombres de los admins que ejecutaron las acciones
            let adminNameMap: Record<string, string> = {};
            if (adminIds.length > 0) {
                const { data: profiles } = await supabase
                    .from("profiles")
                    .select("user_id, display_name")
                    .in("user_id", adminIds);
                for (const p of profiles || []) {
                    adminNameMap[p.user_id] = p.display_name || p.user_id;
                }
            }

            setUserLog(records.map((r: any) => ({
                ...r,
                deleted_by_name: adminNameMap[r.deleted_by] || r.deleted_by,
            })));
        } catch (err: unknown) {
            console.error("Error fetching user deletion log:", err);
        } finally {
            setLoadingUsers(false);
        }
    };

    /**
     * Carga el log de publicaciones eliminadas físicamente.
     * Une con profiles para obtener el nombre del admin.
     */
    const fetchPubLog = async () => {
        setLoadingPubs(true);
        try {
            const { data, error } = await supabase
                .from("publication_deletion_audit_log")
                .select("*")
                .order("deleted_at", { ascending: false })
                .limit(200);

            if (error) throw error;

            const records = data || [];
            const adminIds = [...new Set(records.map((r: any) => r.deleted_by).filter(Boolean))];

            let adminNameMap: Record<string, string> = {};
            if (adminIds.length > 0) {
                const { data: profiles } = await supabase
                    .from("profiles")
                    .select("user_id, display_name")
                    .in("user_id", adminIds);
                for (const p of profiles || []) {
                    adminNameMap[p.user_id] = p.display_name || p.user_id;
                }
            }

            setPubLog(records.map((r: any) => ({
                ...r,
                deleted_by_name: adminNameMap[r.deleted_by] || r.deleted_by,
            })));
        } catch (err: unknown) {
            console.error("Error fetching publication deletion log:", err);
        } finally {
            setLoadingPubs(false);
        }
    };

    /**
     * Refresca ambos logs simultáneamente.
     */
    const handleRefresh = async () => {
        setIsRefreshing(true);
        await Promise.all([fetchUserLog(), fetchPubLog()]);
        setIsRefreshing(false);
    };

    /**
     * Formatea una fecha ISO a formato legible en español argentino.
     */
    const formatDate = (iso: string) => {
        try {
            return new Date(iso).toLocaleString("es-AR", {
                day: "2-digit", month: "2-digit", year: "2-digit",
                hour: "2-digit", minute: "2-digit",
            });
        } catch {
            return "-";
        }
    };

    return (
        <div className="space-y-4">
            {/* Encabezado del panel de auditoría */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-destructive" />
                    <h3 className="text-sm font-bold text-foreground">Log de Auditoría</h3>
                    <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-medium uppercase tracking-wider">
                        Solo lectura
                    </span>
                </div>
                {/* Botón de refresco */}
                <button
                    title="Refrescar logs"
                    onClick={handleRefresh}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground border border-border"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                </button>
            </div>

            <Tabs defaultValue="users">
                <TabsList className="grid grid-cols-2 w-full">
                    <TabsTrigger value="users" className="gap-1.5 text-xs">
                        <User className="w-3.5 h-3.5" />
                        Usuarios eliminados
                        <span className="ml-1 text-[10px] opacity-60">({userLog.length})</span>
                    </TabsTrigger>
                    <TabsTrigger value="pubs" className="gap-1.5 text-xs">
                        <FileText className="w-3.5 h-3.5" />
                        Publicaciones eliminadas
                        <span className="ml-1 text-[10px] opacity-60">({pubLog.length})</span>
                    </TabsTrigger>
                </TabsList>

                {/* Tab: Usuarios eliminados */}
                <TabsContent value="users" className="mt-4">
                    {loadingUsers ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : userLog.length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground py-8">
                            No hay registros de usuarios eliminados.
                        </p>
                    ) : (
                        <div className="overflow-x-auto rounded-xl border border-border">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-border bg-muted/40">
                                        <th className="text-left px-3 py-2 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Usuario</th>
                                        <th className="text-left px-3 py-2 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Plan</th>
                                        <th className="text-left px-3 py-2 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Motivo</th>
                                        <th className="text-left px-3 py-2 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Admin</th>
                                        <th className="text-left px-3 py-2 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Fecha</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {userLog.map((r) => (
                                        <tr key={r.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                                            <td className="px-3 py-2">
                                                <div className="font-semibold text-foreground">{r.display_name || "-"}</div>
                                                <div className="text-muted-foreground text-[10px]">{r.email || "-"}</div>
                                            </td>
                                            <td className="px-3 py-2">
                                                <span className={cn(
                                                    "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase",
                                                    r.plan_type === "premium" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                                                )}>
                                                    {r.plan_type || "-"}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 text-foreground max-w-[200px]">
                                                <span className="italic text-muted-foreground">"{r.reason}"</span>
                                            </td>
                                            <td className="px-3 py-2 font-medium text-foreground">{r.deleted_by_name || "-"}</td>
                                            <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{formatDate(r.deleted_at)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </TabsContent>

                {/* Tab: Publicaciones eliminadas */}
                <TabsContent value="pubs" className="mt-4">
                    {loadingPubs ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : pubLog.length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground py-8">
                            No hay registros de publicaciones eliminadas.
                        </p>
                    ) : (
                        <div className="overflow-x-auto rounded-xl border border-border">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-border bg-muted/40">
                                        <th className="text-left px-3 py-2 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Publicación</th>
                                        <th className="text-left px-3 py-2 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Tipo</th>
                                        <th className="text-left px-3 py-2 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Motivo</th>
                                        <th className="text-left px-3 py-2 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Admin</th>
                                        <th className="text-left px-3 py-2 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Fecha</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pubLog.map((r) => (
                                        <tr key={r.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                                            <td className="px-3 py-2">
                                                <div className="font-semibold text-foreground truncate max-w-[160px]">{r.title || "-"}</div>
                                                {r.org_name && <div className="text-muted-foreground text-[10px]">{r.org_name}</div>}
                                            </td>
                                            <td className="px-3 py-2">
                                                <span className={cn(
                                                    "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase",
                                                    r.pub_type === "marketplace" ? "bg-purple-100 text-purple-800" : "bg-blue-50 text-blue-700"
                                                )}>
                                                    {r.pub_type === "marketplace" ? "Market" : "Listado"}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 max-w-[200px]">
                                                <span className="italic text-muted-foreground">"{r.reason}"</span>
                                            </td>
                                            <td className="px-3 py-2 font-medium text-foreground">{r.deleted_by_name || "-"}</td>
                                            <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{formatDate(r.deleted_at)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
