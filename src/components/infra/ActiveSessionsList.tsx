import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Users, Shield, Trash2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SessionRow {
  session_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  display_name: string;
  email: string;
  role: string;
}

const roleBadge: Record<string, { label: string; className: string }> = {
  sysadmin: { label: "Sysadmin", className: "bg-red-600 text-white" },
  admin: { label: "Admin", className: "bg-amber-600 text-white" },
  agency: { label: "Agencia", className: "bg-blue-600 text-white" },
  agencymember: { label: "Agente", className: "bg-cyan-600 text-white" },
  user: { label: "Usuario", className: "bg-slate-600 text-white" },
};

async function getAuthHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  if (!token) throw new Error("No hay sesión activa");
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

function getEdgeFunctionUrl() {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  return `https://${projectId}.supabase.co/functions/v1/get-system-metrics`;
}

export function ActiveSessionsList() {
  const [sessions, setSessions] = useState<SessionRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [closingId, setClosingId] = useState<string | null>(null);
  const [closingAll, setClosingAll] = useState(false);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${getEdgeFunctionUrl()}?action=list_sessions`, { headers });
      const result = await res.json();
      if (result.sessions) {
        setSessions(result.sessions);
      } else {
        toast.error(result.error || "Error al listar sesiones");
      }
    } catch (err: any) {
      toast.error(err?.message || "Error de red");
    } finally {
      setLoading(false);
    }
  };

  const closeSession = async (sessionId: string) => {
    setClosingId(sessionId);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(getEdgeFunctionUrl(), {
        method: "POST",
        headers,
        body: JSON.stringify({ action: "close_session", session_id: sessionId }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success("Sesión cerrada");
        setSessions((prev) => prev?.filter((s) => s.session_id !== sessionId) ?? null);
      } else {
        toast.error(result.error || "Error al cerrar sesión");
      }
    } catch (err: any) {
      toast.error(err?.message || "Error de red");
    } finally {
      setClosingId(null);
    }
  };

  const closeAllSessions = async () => {
    setClosingAll(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(getEdgeFunctionUrl(), {
        method: "POST",
        headers,
        body: JSON.stringify({ action: "close_all_sessions" }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success(`${result.sessions ?? 0} sesiones cerradas`);
        await fetchSessions();
      } else {
        toast.error(result.error || "Error al cerrar sesiones");
      }
    } catch (err: any) {
      toast.error(err?.message || "Error de red");
    } finally {
      setClosingAll(false);
    }
  };

  // Group by user_id
  const grouped = sessions
    ? Object.values(
        sessions.reduce<Record<string, { user: SessionRow; sessionIds: string[]; count: number; lastActivity: string }>>((acc, s) => {
          if (!acc[s.user_id]) {
            acc[s.user_id] = { user: s, sessionIds: [s.session_id], count: 0, lastActivity: s.updated_at };
          } else {
            acc[s.user_id].sessionIds.push(s.session_id);
          }
          acc[s.user_id].count++;
          if (s.updated_at > acc[s.user_id].lastActivity) {
            acc[s.user_id].lastActivity = s.updated_at;
          }
          return acc;
        }, {})
      ).sort((a, b) => b.lastActivity.localeCompare(a.lastActivity))
    : null;

  return (
    <div className="p-4 border border-slate-700 rounded-xl bg-slate-900/50 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-400" />
          <h2 className="font-bold text-lg">Sesiones Activas</h2>
          {grouped && (
            <span className="text-xs text-slate-400">
              {sessions!.length} sesiones · {grouped.length} usuarios
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {grouped && grouped.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={closingAll}
                  className="border-red-800 bg-red-950/50 text-red-300 hover:bg-red-900/60 hover:text-red-200"
                >
                  <XCircle className={`w-4 h-4 mr-1 ${closingAll ? "animate-spin" : ""}`} />
                  Cerrar Todas
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-slate-900 border-slate-700">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-slate-100">¿Cerrar TODAS las sesiones?</AlertDialogTitle>
                  <AlertDialogDescription className="text-slate-400">
                    Se cerrarán todas las sesiones excepto la tuya. Los usuarios deberán iniciar sesión nuevamente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700">Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={closeAllSessions} className="bg-red-700 hover:bg-red-600 text-white">Confirmar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSessions}
            disabled={loading}
            className="border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700"
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            {sessions === null ? "Cargar" : "Refrescar"}
          </Button>
        </div>
      </div>

      {loading && !sessions && (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 bg-slate-800" />)}
        </div>
      )}

      {grouped && grouped.length === 0 && (
        <p className="text-sm text-slate-500 text-center py-4">No hay sesiones activas</p>
      )}

      {grouped && grouped.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 text-xs">
                <th className="text-left py-2 px-2">Usuario</th>
                <th className="text-left py-2 px-2">Email</th>
                <th className="text-center py-2 px-2">Rol</th>
                <th className="text-center py-2 px-2">Sesiones</th>
                <th className="text-right py-2 px-2">Última actividad</th>
                <th className="text-center py-2 px-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {grouped.map(({ user, sessionIds, count, lastActivity }) => {
                const badge = roleBadge[user.role] || roleBadge.user;
                const isClosing = sessionIds.some(id => id === closingId);
                return (
                  <tr key={user.user_id} className="border-b border-slate-800 hover:bg-slate-800/50">
                    <td className="py-2 px-2 font-medium">
                      <span className="flex items-center gap-1.5">
                        {user.role === "sysadmin" && <Shield className="w-3.5 h-3.5 text-red-400" />}
                        {user.display_name || "Sin nombre"}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-slate-400 text-xs">{user.email}</td>
                    <td className="py-2 px-2 text-center">
                      <Badge variant="secondary" className={`text-[10px] ${badge.className}`}>
                        {badge.label}
                      </Badge>
                    </td>
                    <td className="py-2 px-2 text-center font-mono">
                      {count > 1 ? (
                        <span className="text-amber-400 font-bold">{count}</span>
                      ) : count}
                    </td>
                    <td className="py-2 px-2 text-right text-xs text-slate-400">
                      {new Date(lastActivity).toLocaleString()}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isClosing || user.role === "sysadmin"}
                        onClick={() => {
                          // Close all sessions for this user
                          sessionIds.forEach(id => closeSession(id));
                        }}
                        className="text-red-400 hover:text-red-300 hover:bg-red-950/40 h-7 px-2"
                        title={user.role === "sysadmin" ? "No se puede cerrar la sesión del sysadmin" : `Cerrar ${count} sesión(es)`}
                      >
                        <Trash2 className={`w-3.5 h-3.5 ${isClosing ? "animate-spin" : ""}`} />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
