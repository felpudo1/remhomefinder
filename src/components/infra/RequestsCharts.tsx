import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Globe, Shield, Radio, Database } from "lucide-react";

interface RequestsChartsProps {
  restRequests: number | null;
  authRequests: number | null;
  realtimeRequests: number | null;
  storageRequests: number | null;
}

function MetricBar({ label, value, icon: Icon, color }: { label: string; value: number | null; icon: React.ElementType; color: string }) {
  const data = [{ name: label, value: value ?? 0 }];
  const displayValue = typeof value === "number" ? value : 0;
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
        <p className="text-xs text-slate-500 mt-1">Total acumulado</p>
      </CardContent>
    </Card>
  );
}

export function RequestsCharts({ restRequests, authRequests, realtimeRequests, storageRequests }: RequestsChartsProps) {
  const chartData = [
    { name: "REST", value: restRequests ?? 0, fill: "#60a5fa" },
    { name: "Auth", value: authRequests ?? 0, fill: "#f472b6" },
    { name: "Realtime", value: realtimeRequests ?? 0, fill: "#a78bfa" },
    { name: "Storage", value: storageRequests ?? 0, fill: "#34d399" },
  ];

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricBar label="REST" value={restRequests} icon={Globe} color="text-blue-400" />
        <MetricBar label="Auth" value={authRequests} icon={Shield} color="text-pink-400" />
        <MetricBar label="Realtime" value={realtimeRequests} icon={Radio} color="text-violet-400" />
        <MetricBar label="Storage" value={storageRequests} icon={Database} color="text-emerald-400" />
      </div>

      <Card className="bg-slate-900/80 backdrop-blur border-slate-700/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-slate-200 text-sm">Desglose de Requests</CardTitle>
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
