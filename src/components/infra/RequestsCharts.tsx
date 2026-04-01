import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Globe, Shield, Radio, Database } from "lucide-react";
import type { DiskIoHistoryPoint } from "@/hooks/useSystemMetrics";

type Period = "all" | "month" | "week" | "48h" | "24h" | "1h";

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "all", label: "Acumulado" },
  { value: "month", label: "Último mes" },
  { value: "week", label: "Última semana" },
  { value: "48h", label: "48 horas" },
  { value: "24h", label: "24 horas" },
  { value: "1h", label: "Última hora" },
];

function getPeriodCutoff(period: Period): Date | null {
  if (period === "all") return null;
  const now = new Date();
  switch (period) {
    case "month": return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "week": return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "48h": return new Date(now.getTime() - 48 * 60 * 60 * 1000);
    case "24h": return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    default: return null;
  }
}

interface RequestsChartsProps {
  restRequests: number | null;
  authRequests: number | null;
  realtimeRequests: number | null;
  storageRequests: number | null;
  history?: DiskIoHistoryPoint[];
}

function MetricBar({ label, value, icon: Icon, color, subtitle }: { label: string; value: number | null; icon: React.ElementType; color: string; subtitle: string }) {
  return (
    <Card className="bg-slate-900/80 backdrop-blur border-slate-700/50">
      <CardHeader className="pb-1">
        <CardTitle className="text-slate-300 flex items-center gap-2 text-sm">
          <Icon className="w-4 h-4" />
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className={`text-2xl font-bold ${color}`}>
          {typeof value === "number" ? value.toLocaleString() : "N/A"}
        </p>
        <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

export function RequestsCharts({ restRequests, authRequests, realtimeRequests, storageRequests, history }: RequestsChartsProps) {
  const [period, setPeriod] = useState<Period>("all");

  const computed = useMemo(() => {
    if (period === "all" || !history || history.length < 2) {
      return {
        rest: restRequests,
        auth: authRequests,
        realtime: realtimeRequests,
        storage: storageRequests,
      };
    }

    const cutoff = getPeriodCutoff(period);
    if (!cutoff) {
      return { rest: restRequests, auth: authRequests, realtime: realtimeRequests, storage: storageRequests };
    }

    // Sort ascending by time
    const sorted = [...history]
      .filter(h => h.rest_requests !== undefined)
      .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime());

    if (sorted.length < 2) {
      return { rest: restRequests, auth: authRequests, realtime: realtimeRequests, storage: storageRequests };
    }

    // Find the earliest point at or after cutoff
    const cutoffTime = cutoff.getTime();
    const inRange = sorted.filter(h => new Date(h.recorded_at).getTime() >= cutoffTime);
    
    // If we have points in range, delta = latest - earliest in range
    // If no points in range, use all available and show what we have
    const pointsToUse = inRange.length >= 2 ? inRange : sorted;
    const oldest = pointsToUse[0];
    const newest = pointsToUse[pointsToUse.length - 1];

    return {
      rest: Math.max(0, (newest.rest_requests ?? 0) - (oldest.rest_requests ?? 0)),
      auth: Math.max(0, (newest.auth_requests ?? 0) - (oldest.auth_requests ?? 0)),
      realtime: Math.max(0, (newest.realtime_requests ?? 0) - (oldest.realtime_requests ?? 0)),
      storage: Math.max(0, (newest.storage_requests ?? 0) - (oldest.storage_requests ?? 0)),
    };
  }, [period, history, restRequests, authRequests, realtimeRequests, storageRequests]);

  const subtitle = period === "all" ? "Total acumulado" : PERIOD_OPTIONS.find(p => p.value === period)?.label ?? "";

  const chartData = [
    { name: "REST", value: computed.rest ?? 0, fill: "#60a5fa" },
    { name: "Auth", value: computed.auth ?? 0, fill: "#f472b6" },
    { name: "Realtime", value: computed.realtime ?? 0, fill: "#a78bfa" },
    { name: "Storage", value: computed.storage ?? 0, fill: "#34d399" },
  ];

  return (
    <>
      {/* Period Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-slate-400 font-medium">Período:</span>
        {PERIOD_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setPeriod(opt.value)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              period === opt.value
                ? "bg-emerald-600 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
            }`}
          >
            {opt.label}
          </button>
        ))}
        {period !== "all" && (!history || history.filter(h => h.rest_requests !== undefined).length < 2) && (
          <span className="text-[10px] text-amber-400 ml-2">
            ⚠ Sin datos históricos suficientes — mostrando acumulado
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricBar label="REST" value={computed.rest} icon={Globe} color="text-blue-400" subtitle={subtitle} />
        <MetricBar label="Auth" value={computed.auth} icon={Shield} color="text-pink-400" subtitle={subtitle} />
        <MetricBar label="Realtime" value={computed.realtime} icon={Radio} color="text-violet-400" subtitle={subtitle} />
        <MetricBar label="Storage" value={computed.storage} icon={Database} color="text-emerald-400" subtitle={subtitle} />
      </div>

      <Card className="bg-slate-900/80 backdrop-blur border-slate-700/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-slate-200 text-sm">
            Desglose de Requests {period !== "all" && `— ${PERIOD_OPTIONS.find(p => p.value === period)?.label}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: 8 }}
                labelStyle={{ color: "#e2e8f0" }}
                itemStyle={{ color: "#e2e8f0" }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </>
  );
}
