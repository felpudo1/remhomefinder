import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, TrendingUp, Clock } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface HistoryPoint {
  disk_io_budget: number;
  recorded_at: string;
}

interface DiskIoTrendChartProps {
  history: HistoryPoint[];
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString([], { day: "2-digit", month: "2-digit" });
}

function computeTrend(data: HistoryPoint[]): { direction: "up" | "down" | "stable"; delta: number } {
  if (data.length < 2) return { direction: "stable", delta: 0 };
  const recent = data.slice(-5);
  const oldest = recent[0].disk_io_budget;
  const newest = recent[recent.length - 1].disk_io_budget;
  const delta = Math.round(newest - oldest);
  if (delta > 2) return { direction: "up", delta };
  if (delta < -2) return { direction: "down", delta };
  return { direction: "stable", delta: 0 };
}

export function DiskIoTrendChart({ history }: DiskIoTrendChartProps) {
  const [range, setRange] = useState<"24h" | "48h">("24h");

  const cutoff = range === "24h"
    ? new Date(Date.now() - 24 * 60 * 60 * 1000)
    : new Date(Date.now() - 48 * 60 * 60 * 1000);

  const filtered = history.filter(p => new Date(p.recorded_at) >= cutoff);

  const chartData = filtered.map(p => ({
    time: formatTime(p.recorded_at),
    date: formatDate(p.recorded_at),
    value: Math.round(p.disk_io_budget),
    raw: p.recorded_at,
  }));

  const trend = computeTrend(filtered);

  const trendIcon = trend.direction === "up"
    ? <TrendingUp className="w-4 h-4 text-emerald-400" />
    : trend.direction === "down"
      ? <TrendingDown className="w-4 h-4 text-red-400" />
      : <Clock className="w-4 h-4 text-slate-400" />;

  const trendLabel = trend.direction === "up"
    ? `+${trend.delta}% ↑ Recuperando`
    : trend.direction === "down"
      ? `${trend.delta}% ↓ Consumiendo`
      : "Estable";

  const trendColor = trend.direction === "up"
    ? "text-emerald-400"
    : trend.direction === "down"
      ? "text-red-400"
      : "text-slate-400";

  return (
    <Card className="bg-slate-900/80 backdrop-blur border-slate-700/50 col-span-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-slate-200 flex items-center gap-2 text-lg">
            {trendIcon}
            Tendencia Disk IO
            <Badge variant="outline" className={`ml-2 border-slate-600 ${trendColor}`}>
              {trendLabel}
            </Badge>
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant={range === "24h" ? "default" : "ghost"}
              size="sm"
              onClick={() => setRange("24h")}
              className={range === "24h"
                ? "bg-slate-700 text-slate-100 h-7 text-xs"
                : "text-slate-400 hover:text-slate-100 h-7 text-xs"}
            >
              24h
            </Button>
            <Button
              variant={range === "48h" ? "default" : "ghost"}
              size="sm"
              onClick={() => setRange("48h")}
              className={range === "48h"
                ? "bg-slate-700 text-slate-100 h-7 text-xs"
                : "text-slate-400 hover:text-slate-100 h-7 text-xs"}
            >
              48h
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length < 2 ? (
          <div className="h-48 flex items-center justify-center text-slate-500 text-sm">
            Se necesitan al menos 2 lecturas para mostrar la tendencia.
            <br />
            Los datos se acumulan cada 60 segundos.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="diskIoGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="time"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[0, 100]}
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                tickFormatter={(v: number) => `${v}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #475569",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "#94a3b8" }}
                formatter={(value: number) => [`${value}%`, "Burst Balance"]}
              />
              <ReferenceLine y={50} stroke="#22c55e" strokeDasharray="4 4" strokeOpacity={0.5} />
              <ReferenceLine y={20} stroke="#ef4444" strokeDasharray="4 4" strokeOpacity={0.5} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#34d399"
                strokeWidth={2}
                fill="url(#diskIoGradient)"
                dot={false}
                activeDot={{ r: 4, fill: "#34d399" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
        <div className="flex gap-4 mt-2 text-xs text-slate-500 justify-center">
          <span>— — <span className="text-emerald-500">50%</span> Zona sana</span>
          <span>— — <span className="text-red-500">20%</span> Zona peligro</span>
        </div>
      </CardContent>
    </Card>
  );
}
