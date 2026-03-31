import { useMemo, useState } from "react";
import { Building2, CalendarPlus, Clock3, Loader2, Phone, Star, Users, User, PieChartIcon, BarChart3 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import {
  useAgentPropertyInsights,
  type AgentPropertyInsight,
  type AgentUserInsight,
} from "@/hooks/useAgentPropertyInsights";
import { useStatusFeedbackConfig } from "@/hooks/useStatusFeedbackConfig";
import { Agency } from "./AgentProfile";

type StatusFilter = "todos" | "ingresado" | "contactado" | "visita_coordinada" | "descartado" | "firme_candidato" | "posible_interes" | "meta_conseguida";

interface AgentPropertyListingProps {
  agency: Agency;
}

function stars(value: number) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-3.5 h-3.5 ${s <= value ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

function buildGoogleCalendarUrl(title: string, startIso: string, details?: string) {
  const startDate = new Date(startIso);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
  const fmt = (d: Date) =>
    `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}${String(d.getSeconds()).padStart(2, "0")}`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${fmt(startDate)}/${fmt(endDate)}`,
  });
  if (details) params.set("details", details);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Renders a single rating row */
function RatingRow({ label, value }: { label: string; value: number }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      {stars(value)}
    </div>
  );
}

/** Renders ratings card for a given status */
function StatusRatingCard({ status, user }: { status: string; user: AgentUserInsight }) {
  // Leer configuración dinámica para este estado
  const { data: fields } = useStatusFeedbackConfig(status);
  const meta = user.ratingsByStatus[status];
  
  if (!meta || !fields || fields.length === 0) return null;

  // Filtrar solo campos de tipo rating que tengan valor
  const rows = fields
    .filter((f) => f.field_type === "rating")
    .map((field) => ({
      label: field.field_label,
      value: Number(meta[field.field_id] || 0),
    }))
    .filter((row) => row.value > 0);

  if (rows.length === 0) return null;

  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-2 min-w-[200px] shrink-0">
      <Badge variant="secondary" className="capitalize text-xs">
        {status.replace(/_/g, " ")}
      </Badge>
      <div className="space-y-1.5">
        {rows.map((row) => (
          <RatingRow key={row.label} label={row.label} value={row.value} />
        ))}
      </div>
    </div>
  );
}

const PIE_COLORS = ["#f97316", "#eab308", "#22c55e", "#3b82f6", "#a855f7", "#ec4899", "#14b8a6", "#f43f5e"];

/** Converts a field_id like "discarded_overall_condition" to "Calidad estructural" */
function fieldIdToLabel(fieldId: string): string {
  return fieldId
    .replace(/^discarded_/, "")
    .replace(/_/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());
}

/** Aggregated discard impact pie chart across all users of a property */
function DiscardImpactChart({
  users,
  feedbackFields,
}: {
  users: AgentUserInsight[];
  feedbackFields?: Array<{ field_id: string; field_label: string; field_type: string }> | null;
}) {
  const chartData = useMemo(() => {
    // Accumulate all numeric rating values from descartado metadata across users
    const acc: Record<string, { sum: number; count: number; label: string }> = {};

    users.forEach((user) => {
      const meta = user.ratingsByStatus?.descartado;
      if (!meta) return;

      Object.entries(meta).forEach(([key, rawVal]) => {
        // Skip non-numeric fields (reason, text fields, etc.)
        const val = Number(rawVal);
        if (!Number.isFinite(val) || val <= 0) return;
        // Skip known text keys
        if (key === "reason" || key === "notes" || key === "comment") return;

        if (!acc[key]) {
          // Try to find a human-readable label from feedback config
          const configField = feedbackFields?.find((f) => f.field_id === key);
          const label = configField
            ? configField.field_label.replace(/^[^\w]*/, "").trim() // Remove leading emoji
            : fieldIdToLabel(key);
          acc[key] = { sum: 0, count: 0, label };
        }
        acc[key].sum += val;
        acc[key].count += 1;
      });
    });

    return Object.entries(acc)
      .map(([key, { sum, count, label }]) => ({
        name: label,
        value: Math.round((sum / count) * 10) / 10, // average rating
        total: sum,
        count,
      }))
      .sort((a, b) => b.value - a.value);
  }, [users, feedbackFields]);

  if (chartData.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic text-center py-4">
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
            {chartData.map((_, idx) => (
              <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
            formatter={(value: number, name: string) => [`${value.toFixed(1)} ★ prom.`, name]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="grid grid-cols-1 gap-1">
        {chartData.map((entry, idx) => (
          <div key={entry.name} className="flex items-center gap-2 text-xs">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
            />
            <span className="text-muted-foreground truncate flex-1">{entry.name}</span>
            <span className="font-medium text-foreground">{entry.value.toFixed(1)} ★</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AgentPropertyListing({ agency }: AgentPropertyListingProps) {
  const { data: insights = [], isLoading } = useAgentPropertyInsights(agency.id);
  const [query, setQuery] = useState("");
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [activeStatusTab, setActiveStatusTab] = useState<StatusFilter>("todos");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showCharts, setShowCharts] = useState(false);
  const { data: discardFields } = useStatusFeedbackConfig("descartado");

  // Auto-select first property
  const effectiveSelectedId = selectedPropertyId || insights[0]?.publicationId || null;

  const filteredProperties = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return insights;
    return insights.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.neighborhood.toLowerCase().includes(q)
    );
  }, [query, insights]);

  const selectedProperty = useMemo(
    () => insights.find((p) => p.publicationId === effectiveSelectedId) || null,
    [effectiveSelectedId, insights]
  );

  const selectedUsers = selectedProperty?.users || [];
  const usersByStatus = selectedUsers.filter((user) =>
    activeStatusTab === "todos" ? true : user.currentStatus === activeStatusTab
  );

  const selectedUser = useMemo(() => {
    if (selectedUserId) {
      const found = usersByStatus.find((u) => u.userId === selectedUserId);
      if (found) return found;
    }
    return usersByStatus[0] || null;
  }, [selectedUserId, usersByStatus]);

  const statusCounts = useMemo(() => {
    const base: Record<StatusFilter, number> = {
      todos: selectedUsers.length,
      ingresado: 0,
      contactado: 0,
      visita_coordinada: 0,
      descartado: 0,
      firme_candidato: 0,
      posible_interes: 0,
      meta_conseguida: 0,
    };
    selectedUsers.forEach((u) => {
      if (u.currentStatus in base) {
        base[u.currentStatus as StatusFilter] += 1;
      }
    });
    return base;
  }, [selectedUsers]);

  // Status tabs to show (only those with count > 0, plus "todos")
  const visibleTabs: StatusFilter[] = useMemo(() => {
    const tabs: StatusFilter[] = ["todos"];
    const order: StatusFilter[] = ["ingresado", "contactado", "visita_coordinada", "firme_candidato", "posible_interes", "meta_conseguida", "descartado"];
    order.forEach((s) => {
      if (statusCounts[s] > 0) tabs.push(s);
    });
    return tabs;
  }, [statusCounts]);

  const statusLabel: Record<string, string> = {
    todos: "Todos",
    ingresado: "Ingresado",
    contactado: "Contactado",
    visita_coordinada: "Visita",
    firme_candidato: "Alta prioridad",
    posible_interes: "Interesado",
    meta_conseguida: "Meta",
    descartado: "Descartado",
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!insights.length) {
    return (
      <div className="border border-border rounded-2xl bg-card p-8 text-center">
        <p className="text-muted-foreground text-sm">
          No hay publicaciones con usuarios vinculados todavía.
        </p>
      </div>
    );
  }

  // Determine which status stages to show for selected user
  const allStages = ["contactado", "visita_coordinada", "firme_candidato", "posible_interes", "meta_conseguida", "descartado"];

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Building2 className="w-5 h-5" /> Listado de propiedades
          </h3>
          <p className="text-sm text-muted-foreground">
            Vista gráfica para comparar una propiedad y sus usuarios asociados.
          </p>
        </div>
        <div className="w-full md:w-80">
          <Input
            placeholder="Buscar por título o barrio..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Property cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filteredProperties.map((property) => {
          const isActive = property.publicationId === effectiveSelectedId;
          return (
            <button
              key={property.publicationId}
              type="button"
              onClick={() => {
                setSelectedPropertyId(property.publicationId);
                setSelectedUserId(null);
                setActiveStatusTab("todos");
              }}
              className={`text-left rounded-2xl border p-4 transition-all ${
                isActive
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border bg-card hover:border-primary/40"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-semibold text-sm text-foreground line-clamp-2">{property.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{property.neighborhood}</p>
                </div>
                <Badge variant="secondary" className="shrink-0">
                  <Users className="w-3 h-3 mr-1" /> {property.usersSaved}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <div>
                  <p className="text-[11px] text-muted-foreground">Interés inicial</p>
                  <p className="text-sm font-semibold">
                    {property.avgContactedInterest > 0
                      ? `${property.avgContactedInterest.toFixed(1)}/5`
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">Urgencia mudanza</p>
                  <p className="text-sm font-semibold">
                    {property.avgContactedUrgency > 0
                      ? `${property.avgContactedUrgency.toFixed(1)}/5`
                      : "—"}
                  </p>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground mt-3">
                {property.statusBreakdown || "Sin actividad todavía"}
              </p>
            </button>
          );
        })}
      </div>

      {/* Users table + detail sidebar */}
      {selectedProperty && (
        <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-semibold text-foreground">Usuarios en esta propiedad</h4>
            <div className="flex gap-2">
              <Button
                variant={showCharts ? "default" : "outline"}
                size="sm"
                className="text-xs gap-1.5"
                onClick={() => setShowCharts(!showCharts)}
              >
                <BarChart3 className="w-3.5 h-3.5" /> {showCharts ? "Ocultar Gráficas" : "Ver Gráficas"}
              </Button>
              <Button variant="outline" size="sm" className="text-xs">
                <Clock3 className="w-3.5 h-3.5 mr-1" /> Vista reciente
              </Button>
            </div>
          </div>

          <Tabs
            value={activeStatusTab}
            onValueChange={(value) => {
              setActiveStatusTab(value as StatusFilter);
              setSelectedUserId(null);
            }}
            className="w-full"
          >
            <TabsList className="h-auto flex-wrap justify-start gap-2 bg-transparent p-0">
              {visibleTabs.map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="rounded-full border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  {statusLabel[tab]} ({statusCounts[tab]})
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Discard Impact Pie Chart - shown when charts toggled */}
          {showCharts && selectedProperty && (() => {
            const discardedUsers = selectedProperty.users.filter(
              (u) => u.ratingsByStatus?.descartado
            );
            if (discardedUsers.length === 0) return (
              <div className="rounded-xl border border-border bg-card p-6 text-center">
                <p className="text-sm text-muted-foreground italic">
                  No hay usuarios que hayan descartado esta propiedad aún.
                </p>
              </div>
            );
            return (
              <div className="rounded-xl border border-border bg-card p-4 space-y-2">
                <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <PieChartIcon className="w-4 h-4" />
                  Impacto de Descarte ({discardedUsers.length} usuario{discardedUsers.length !== 1 ? "s" : ""})
                </p>
                <DiscardImpactChart
                  users={discardedUsers}
                  feedbackFields={discardFields}
                />
              </div>
            );
          })()}

          {usersByStatus.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No hay usuarios en este estado.
            </p>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-4">
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-left py-2 px-3 font-medium">Usuario</th>
                      <th className="text-left py-2 px-3 font-medium">Estado</th>
                      <th className="text-left py-2 px-3 font-medium">Rank</th>
                      <th className="text-left py-2 px-3 font-medium">Contacto</th>
                      <th className="text-left py-2 px-3 font-medium">Actualizado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersByStatus.map((user) => (
                      <tr
                        key={user.userListingId}
                        onClick={() => setSelectedUserId(user.userId)}
                        className={`border-b border-border/70 last:border-b-0 cursor-pointer ${
                          selectedUser?.userId === user.userId ? "bg-primary/5" : "hover:bg-muted/40"
                        }`}
                      >
                        <td className="py-3 px-3">
                          <p className="font-medium text-foreground">{user.displayName}</p>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="capitalize text-xs">
                              {user.currentStatus.replace(/_/g, " ")}
                            </Badge>
                            {user.currentStatus === "visita_coordinada" && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const refLabel = selectedProperty?.ref ? ` Ref ${selectedProperty.ref}` : "";
                                  const startAt = user.coordinatedDate ?? new Date();
                                  const url = buildGoogleCalendarUrl(
                                    `Visita: ${selectedProperty?.title || "Propiedad"}${refLabel} - ${user.displayName}`,
                                    startAt.toISOString(),
                                    `Usuario: ${user.displayName} (${user.emailMasked})${refLabel}`
                                  );
                                  window.open(url, "_blank", "noopener,noreferrer");
                                }}
                                className="inline-flex items-center rounded-md p-1 text-primary hover:bg-primary/10"
                                title="Agendar en Google Calendar"
                              >
                                <CalendarPlus className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-1.5" title="Calificación individual">
                              <User className="w-3 h-3 text-muted-foreground" />
                              {user.personalRating !== undefined ? (
                                stars(user.personalRating)
                              ) : (
                                <span className="text-xs text-muted-foreground italic">S/D</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5" title="Promedio familiar">
                              <Users className="w-3 h-3 text-muted-foreground" />
                              {user.familyRating !== undefined ? (
                                stars(user.familyRating)
                              ) : (
                                <span className="text-xs text-muted-foreground italic">S/D</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <p className="text-xs text-muted-foreground">{user.emailMasked}</p>
                          <p className="text-xs text-muted-foreground">{user.phone}</p>
                        </td>
                        <td className="py-3 px-3 text-muted-foreground text-xs">
                          {user.updatedAtRelative}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Detail sidebar */}
              <aside className="rounded-xl border border-border p-4 bg-muted/20">
                {!selectedUser ? (
                  <p className="text-sm text-muted-foreground">
                    No hay usuarios para este estado.
                  </p>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{selectedUser.displayName}</p>
                      <p className="text-xs text-muted-foreground">{selectedUser.emailMasked}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Phone className="w-3 h-3" /> {selectedUser.phone || "Sin teléfono"}
                      </p>
                    </div>

                    {selectedUser.ratingsByStatus.descartado?.reason && (
                      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                        <p className="text-xs font-medium text-destructive">Motivo de descarte</p>
                        <p className="text-xs text-foreground mt-1">{selectedUser.ratingsByStatus.descartado.reason}</p>
                      </div>
                    )}

                    <div className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Calificaciones por etapa
                      </p>
                      <div className="flex items-stretch gap-3 overflow-x-auto pb-1">
                        {allStages.map((stage) => (
                          <StatusRatingCard key={stage} status={stage} user={selectedUser} />
                        ))}
                      </div>
                      {allStages.every(
                        (stage) => !selectedUser.ratingsByStatus[stage as keyof typeof selectedUser.ratingsByStatus]
                      ) && (
                        <p className="text-xs text-muted-foreground italic">
                          Sin datos de calificación todavía.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </aside>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
