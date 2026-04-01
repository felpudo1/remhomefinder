import { BarChart3, PieChartIcon } from "lucide-react";
import { useMemo } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import type {
  ListingFeedbackField,
  UserInsight,
} from "./agentPropertyListingTypes";

const PIE_COLORS = [
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#a855f7",
  "#ec4899",
  "#14b8a6",
  "#f43f5e",
];

/**
 * Convierte un field_id técnico en una etiqueta legible.
 */
function fieldIdToLabel(fieldId: string): string {
  return fieldId
    .replace(/^discarded_/, "")
    .replace(/_/g, " ")
    .replace(/^\w/, (char) => char.toUpperCase());
}

function DiscardImpactChart({
  users,
  feedbackFields,
}: {
  users: UserInsight[];
  feedbackFields: ListingFeedbackField;
}) {
  const chartData = useMemo(() => {
    const accumulator: Record<string, { sum: number; count: number; label: string }> = {};

    users.forEach((user) => {
      const metadata = user.ratingsByStatus?.descartado;
      if (!metadata) return;

      Object.entries(metadata).forEach(([key, rawValue]) => {
        const value = Number(rawValue);
        if (!Number.isFinite(value) || value <= 0) return;
        if (key === "reason" || key === "notes" || key === "comment") return;

        if (!accumulator[key]) {
          const configField = feedbackFields?.find((field) => field.field_id === key);
          const label = configField
            ? configField.field_label.replace(/^[^\w]*/, "").trim()
            : fieldIdToLabel(key);

          accumulator[key] = { sum: 0, count: 0, label };
        }

        accumulator[key].sum += value;
        accumulator[key].count += 1;
      });
    });

    return Object.values(accumulator)
      .map(({ sum, count, label }) => ({
        name: label,
        value: Math.round((sum / count) * 10) / 10,
      }))
      .sort((a, b) => b.value - a.value);
  }, [feedbackFields, users]);

  if (chartData.length === 0) {
    return (
      <p className="py-4 text-center text-xs italic text-muted-foreground">
        Sin datos de descarte para analizar.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={75}
            dataKey="value"
            nameKey="name"
            paddingAngle={2}
          >
            {chartData.map((entry, index) => (
              <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
            }}
            formatter={(value: number, name: string) => [`${value.toFixed(1)} ★ prom.`, name]}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-1 gap-1">
        {chartData.map((entry, index) => (
          <div key={entry.name} className="flex items-center gap-2 text-xs">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
            />
            <span className="flex-1 truncate text-muted-foreground">{entry.name}</span>
            <span className="font-medium text-foreground">{entry.value.toFixed(1)} ★</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusDistributionChart({
  statusCounts,
  statusLabel,
}: {
  statusCounts: Record<string, number>;
  statusLabel: Record<string, string>;
}) {
  const chartData = useMemo(
    () =>
      Object.entries(statusCounts)
        .filter(([status, count]) => status !== "todos" && count > 0)
        .map(([status, count]) => ({
          name: statusLabel[status] || status,
          value: count,
        }))
        .sort((a, b) => b.value - a.value),
    [statusCounts, statusLabel]
  );

  if (chartData.length === 0) return null;

  const totalUsers = chartData.reduce((accumulator, entry) => accumulator + entry.value, 0);

  return (
    <div className="space-y-2">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={75}
            dataKey="value"
            nameKey="name"
            paddingAngle={2}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={entry.name}
                fill={PIE_COLORS[(index * 2) % PIE_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
            }}
            formatter={(value: number, name: string) => [
              `${value} usuario(s) (${Math.round((value / totalUsers) * 100)}%)`,
              name,
            ]}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-1 gap-1">
        {chartData.map((entry, index) => (
          <div key={entry.name} className="flex items-center gap-2 text-xs">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: PIE_COLORS[(index * 2) % PIE_COLORS.length] }}
            />
            <span className="flex-1 truncate text-muted-foreground">{entry.name}</span>
            <span className="font-medium text-foreground">
              {entry.value} ({Math.round((entry.value / totalUsers) * 100)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface AgentPropertyChartsPanelProps {
  totalUsers: number;
  statusCounts: Record<string, number>;
  statusLabel: Record<string, string>;
  discardedUsers: UserInsight[];
  discardFields: ListingFeedbackField;
}

/**
 * Agrupa las visualizaciones para no recargar el componente principal.
 */
export function AgentPropertyChartsPanel({
  totalUsers,
  statusCounts,
  statusLabel,
  discardedUsers,
  discardFields,
}: AgentPropertyChartsPanelProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="space-y-2 rounded-xl border border-border bg-card p-4">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <PieChartIcon className="h-4 w-4" />
          Distribución de Estados ({totalUsers} en total)
        </p>
        <StatusDistributionChart
          statusCounts={statusCounts}
          statusLabel={statusLabel}
        />
      </div>

      <div className="space-y-2 rounded-xl border border-border bg-card p-4">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <BarChart3 className="h-4 w-4" />
          Impacto de Descarte ({discardedUsers.length} usuario{discardedUsers.length !== 1 ? "s" : ""})
        </p>
        {discardedUsers.length === 0 ? (
          <div className="flex h-[200px] items-center justify-center">
            <p className="px-4 text-center text-sm italic text-muted-foreground">
              No hay usuarios que hayan descartado esta propiedad aún.
            </p>
          </div>
        ) : (
          <DiscardImpactChart users={discardedUsers} feedbackFields={discardFields} />
        )}
      </div>
    </div>
  );
}
