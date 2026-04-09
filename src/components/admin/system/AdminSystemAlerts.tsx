import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Bell, CheckCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";

interface SystemAlert {
  id: string;
  alert_type: string;
  message: string;
  metadata: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export function AdminSystemAlerts() {
  const queryClient = useQueryClient();

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ["system-alerts"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("system_alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as SystemAlert[];
    },
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("system_alerts")
        .update({ is_read: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-alerts"] });
      toast.success("Alerta marcada como leída");
    },
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      const unreadIds = alerts.filter((a) => !a.is_read).map((a) => a.id);
      if (unreadIds.length === 0) return;
      const { error } = await (supabase as any)
        .from("system_alerts")
        .update({ is_read: true })
        .in("id", unreadIds);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-alerts"] });
      toast.success("Todas las alertas marcadas como leídas");
    },
  });

  const unreadCount = alerts.filter((a) => !a.is_read).length;

  const alertTypeLabel: Record<string, string> = {
    firecrawl_fallback: "Fallback API Key",
  };

  return (
    <Card className="border-amber-500/30 bg-amber-950/10">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bell className="w-4 h-4 text-amber-400" />
          Alertas del Sistema
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {unreadCount} nueva{unreadCount > 1 ? "s" : ""}
            </Badge>
          )}
        </CardTitle>
        {unreadCount > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="text-xs"
          >
            <CheckCircle className="w-3 h-3 mr-1" />
            Marcar todas como leídas
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando alertas...</p>
        ) : alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay alertas recientes. ✅</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`flex items-start gap-3 p-3 rounded-lg border text-sm transition-colors ${
                  alert.is_read
                    ? "border-border/50 bg-background/50 opacity-60"
                    : "border-amber-500/40 bg-amber-950/20"
                }`}
              >
                <AlertTriangle
                  className={`w-4 h-4 mt-0.5 shrink-0 ${
                    alert.is_read ? "text-muted-foreground" : "text-amber-400"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-[10px]">
                      {alertTypeLabel[alert.alert_type] || alert.alert_type}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(alert.created_at), "dd/MM/yyyy HH:mm")}
                    </span>
                  </div>
                  <p className="text-xs">{alert.message}</p>
                </div>
                {!alert.is_read && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-[10px]"
                    onClick={() => markRead.mutate(alert.id)}
                    disabled={markRead.isPending}
                  >
                    ✓
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
