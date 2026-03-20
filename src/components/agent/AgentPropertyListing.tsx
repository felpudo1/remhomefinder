import { useMemo, useState } from "react";
import { Building2, CalendarPlus, Clock3, Loader2, Phone, Star, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useAgentPropertyInsights,
  type AgentPropertyInsight,
  type AgentUserInsight,
} from "@/hooks/useAgentPropertyInsights";
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
  const r = user.ratingsByStatus;

  const statusLabels: Record<string, string> = {
    contactado: "Contactado",
    visita_coordinada: "Visita Coordinada",
    firme_candidato: "Alta Prioridad",
    posible_interes: "Interesado",
    meta_conseguida: "Meta Conseguida",
    descartado: "Descartado",
  };

  let rows: Array<{ label: string; value: number }> = [];

  switch (status) {
    case "contactado":
      if (!r.contactado) return null;
      rows = [
        { label: "Interés inicial", value: r.contactado.contacted_interest },
        { label: "Urgencia de mudanza", value: r.contactado.contacted_urgency },
      ];
      break;
    case "visita_coordinada":
      if (!r.visita_coordinada) return null;
      rows = [
        { label: "Velocidad de respuesta", value: r.visita_coordinada.coordinated_agent_response_speed },
        { label: "Calidad de atención", value: r.visita_coordinada.coordinated_attention_quality },
      ];
      if (r.visita_coordinada.coordinated_app_help_score) {
        rows.push({ label: "Ayuda de la app", value: r.visita_coordinada.coordinated_app_help_score });
      }
      break;
    case "firme_candidato":
    case "posible_interes": {
      const closing = status === "firme_candidato" ? r.firme_candidato : r.posible_interes;
      if (!closing) return null;
      rows = [
        { label: "Precio", value: closing.close_price_score },
        { label: "Estado general", value: closing.close_condition_score },
        { label: "Seguridad", value: closing.close_security_score },
        { label: "Garantía", value: closing.close_guarantee_score },
        { label: "Mudanza", value: closing.close_moving_score },
      ];
      break;
    }
    case "meta_conseguida":
      if (!r.meta_conseguida) return null;
      rows = [
        { label: "Puntualidad agente", value: r.meta_conseguida.meta_agent_punctuality },
        { label: "Atención agente", value: r.meta_conseguida.meta_agent_attention },
        { label: "Funcionamiento app", value: r.meta_conseguida.meta_app_performance },
        { label: "Soporte app", value: r.meta_conseguida.meta_app_support },
        { label: "Precio app", value: r.meta_conseguida.meta_app_price },
      ];
      break;
    case "descartado":
      if (!r.descartado) return null;
      rows = [
        { label: "Estado general", value: r.descartado.discarded_overall_condition },
        { label: "Entorno", value: r.descartado.discarded_surroundings },
        { label: "Seguridad", value: r.descartado.discarded_house_security },
        { label: "Tamaño esperado", value: r.descartado.discarded_expected_size },
        { label: "Fotos vs realidad", value: r.descartado.discarded_photos_reality },
      ];
      break;
    default:
      return null;
  }

  const hasData = rows.some((r) => r.value > 0);
  if (!hasData) return null;

  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-2 min-w-[200px] shrink-0">
      <Badge variant="secondary" className="capitalize text-xs">
        {statusLabels[status] || status.replace("_", " ")}
      </Badge>
      <div className="space-y-1.5">
        {rows.map((row) => (
          <RatingRow key={row.label} label={row.label} value={row.value} />
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
            <Button variant="outline" size="sm" className="text-xs">
              <Clock3 className="w-3.5 h-3.5 mr-1" /> Vista reciente
            </Button>
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
                            {user.currentStatus === "visita_coordinada" && user.coordinatedDate && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const refLabel = selectedProperty?.ref ? ` Ref ${selectedProperty.ref}` : "";
                                  const url = buildGoogleCalendarUrl(
                                    `Visita: ${selectedProperty?.title || "Propiedad"}${refLabel} - ${user.displayName}`,
                                    user.coordinatedDate!,
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
