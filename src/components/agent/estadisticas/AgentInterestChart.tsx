import { Loader2, TrendingUp } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AgentInterestChartProps {
  chartData: Array<{
    dateLabel: string;
    saves: number;
    views: number;
  }>;
  isLoading: boolean;
}

/**
 * Muestra la evolucion historica del interes por las propiedades del agente.
 */
export function AgentInterestChart({
  chartData,
  isLoading,
}: AgentInterestChartProps) {
  return (
    <Card className="overflow-hidden border-border bg-white/50 shadow-md backdrop-blur-sm">
      <CardHeader className="mb-4 flex flex-row items-center justify-between border-b border-border/50 pb-2">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-primary" />
            Evolucion de Interes (Ultimos 14 dias)
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {isLoading ? (
          <div className="flex h-[300px] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="hsl(var(--primary))"
                      stopOpacity={0.1}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(var(--primary))"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="dateLabel"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    borderRadius: "12px",
                    border: "1px solid hsl(var(--border))",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="views"
                  name="Visitas"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorViews)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
