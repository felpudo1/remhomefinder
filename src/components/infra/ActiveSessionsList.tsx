import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Users, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface SessionRow {
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

export function ActiveSessionsList() {
  const [sessions, setSessions] = useState<SessionRow[] | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) { toast.error("No hay sesión activa"); return; }

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/get-system-metrics?action=list_sessions`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const result = await res.json();
      if (res.ok && result.sessions) {
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

  // Group by user_id to count sessions per user
  const grouped = sessions
    ? Object.values(
        sessions.reduce<Record<string, { user: SessionRow; count: number; lastActivity: string }>>((acc, s) => {
          if (!acc[s.user_id]) {
            acc[s.user_id] = { user: s, count: 0, lastActivity: s.updated_at };
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-400" />
          <h2 className="font-bold text-lg">Sesiones Activas</h2>
          {grouped && (
            <span className="text-xs text-slate-400">
              {sessions!.length} sesiones · {grouped.length} usuarios
            </span>
          )}
        </div>
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
              </tr>
            </thead>
            <tbody>
              {grouped.map(({ user, count, lastActivity }) => {
                const badge = roleBadge[user.role] || roleBadge.user;
                return (
                  <tr key={user.user_id} className="border-b border-slate-800 hover:bg-slate-800/50">
                    <td className="py-2 px-2 font-medium flex items-center gap-1.5">
                      {user.role === "sysadmin" && <Shield className="w-3.5 h-3.5 text-red-400" />}
                      {user.display_name}
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
