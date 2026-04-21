import { BarChart3, CalendarPlus, Check, Clock3, Phone, Sparkles, Star, User, Users, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStatusFeedbackConfig } from "@/hooks/useStatusFeedbackConfig";
import { generateSentimentInsight } from "@/lib/sentimentInsight";
import type {
  PropertyInsight,
  StatusFilter,
  UserInsight,
} from "./agentPropertyListingTypes";

// Flag para reactivar fácilmente la visualización de ratings (estrellas) en cada tarjeta de estado
const SHOW_RAW_RATINGS = false;

const ALL_STAGES = [
  "contactado",
  "visita_coordinada",
  "firme_candidato",
  "posible_interes",
  "meta_conseguida",
  "descartado",
];

function buildGoogleCalendarUrl(title: string, startIso: string, details?: string) {
  const startDate = new Date(startIso);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
  const formatDate = (date: Date) =>
    `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(
      date.getDate()
    ).padStart(2, "0")}T${String(date.getHours()).padStart(2, "0")}${String(
      date.getMinutes()
    ).padStart(2, "0")}${String(date.getSeconds()).padStart(2, "0")}`;

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${formatDate(startDate)}/${formatDate(endDate)}`,
  });

  if (details) {
    params.set("details", details);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function renderStars(value: number) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((starValue) => (
        <Star
          key={starValue}
          className={`h-3.5 w-3.5 ${
            starValue <= value
              ? "fill-yellow-400 text-yellow-400"
              : "text-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );
}

function RatingRow({ label, value }: { label: string; value: number }) {
  if (!value) return null;

  return (
    <div>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      {renderStars(value)}
    </div>
  );
}

/**
 * Renderiza una fila para campos booleanos (Sí/No)
 */
function BooleanRow({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      {value ? (
        <Check className="h-3.5 w-3.5 text-emerald-500" />
      ) : (
        <X className="h-3.5 w-3.5 text-red-500" />
      )}
    </div>
  );
}

/**
 * Renderiza una fila para campos de texto (como el motivo de descarte)
 */
function TextRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;

  return (
    <div className="space-y-0.5 rounded-md bg-muted/30 p-2 border border-border/50">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">{label}</p>
      <p className="text-xs text-foreground leading-relaxed italic">"{value}"</p>
    </div>
  );
}

function StatusRatingCard({ status, user }: { status: string; user: UserInsight }) {
  const { data: fields } = useStatusFeedbackConfig(status);
  const metadata = user.ratingsByStatus[status];

  if (!metadata || !fields || fields.length === 0) return null;

  // Filtrar campos de tipo rating
  const ratingRows = fields
    .filter((field) => field.field_type === "rating")
    .map((field) => ({
      label: field.field_label,
      value: Number(metadata[field.field_id] || 0),
    }))
    .filter((row) => row.value > 0);

  // Filtrar campos de tipo boolean
  const booleanRows = fields
    .filter((field) => field.field_type === "boolean")
    .map((field) => ({
      label: field.field_label,
      value: Boolean(metadata[field.field_id]),
    }));

  // Filtrar campos de tipo text (incluyendo motivo de descarte)
  const textRows = fields
    .filter((field) => field.field_type === "text")
    .map((field) => ({
      label: field.field_label,
      value: String(metadata[field.field_id] || ""),
    }))
    .filter((row) => row.value.trim() !== "");

  // Si no hay datos de ningún tipo, no mostrar la tarjeta
  const quickReasonLabel = metadata?.quick_reason_label as string | undefined;
  if (ratingRows.length === 0 && booleanRows.length === 0 && textRows.length === 0 && !quickReasonLabel) return null;

  // Generar insight IA (heurística local — el prompt global queda definido en Admin para futura integración)
  const insight = generateSentimentInsight(status, metadata);

  return (
    <div className="min-w-[240px] shrink-0 space-y-3 rounded-lg border border-border bg-card p-3 shadow-sm lg:min-w-[280px]">
      <div className="flex items-center justify-between border-b border-border/50 pb-2">
        <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-bold uppercase tracking-tight">
          {status.replace(/_/g, " ")}
        </Badge>
      </div>

      {/* ✨ IA Insight — sección principal */}
      {insight && (
        <div className="space-y-2 rounded-md border border-primary/30 bg-primary/5 p-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-primary">IA Insight</p>
            </div>
            <Badge
              variant="outline"
              className={`px-1.5 py-0 text-[10px] font-bold ${
                insight.matchPercent >= 75
                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600"
                  : insight.matchPercent >= 45
                  ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-600"
                  : "border-red-500/50 bg-red-500/10 text-red-600"
              }`}
            >
              {insight.matchPercent}% Match
            </Badge>
          </div>
          <p className="text-xs leading-snug text-foreground">{insight.summary}</p>
        </div>
      )}

      {/* Ratings crudos — ocultos por defecto vía SHOW_RAW_RATINGS, reactivables fácilmente */}
      {SHOW_RAW_RATINGS && (ratingRows.length > 0 || booleanRows.length > 0) && (
        <div className="space-y-2">
          {ratingRows.map((row) => (
            <RatingRow key={row.label} label={row.label} value={row.value} />
          ))}
          {booleanRows.map((row) => (
            <BooleanRow key={row.label} label={row.label} value={row.value} />
          ))}
        </div>
      )}

      {textRows.length > 0 && (
        <div className="space-y-2 pt-1">
          {textRows.map((row) => (
            <TextRow key={row.label} label={row.label} value={row.value} />
          ))}
        </div>
      )}

      {quickReasonLabel && (
        <div className="rounded-md bg-amber-50 border border-amber-200 p-2 space-y-0.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-700/70">⚡ Motivo rápido</p>
          <p className="text-xs font-medium text-amber-900">{quickReasonLabel}</p>
        </div>
      )}
    </div>
  );
}

interface AgentPropertyUsersPanelProps {
  property: PropertyInsight;
  users: UserInsight[];
  selectedUser: UserInsight | null;
  selectedUserId: string | null;
  onSelectUser: (userId: string) => void;
  activeStatusTab: StatusFilter;
  visibleTabs: StatusFilter[];
  statusCounts: Record<StatusFilter, number>;
  statusLabel: Record<string, string>;
  onChangeStatusTab: (value: StatusFilter) => void;
  showCharts: boolean;
  onToggleCharts: () => void;
}

/**
 * Renderiza tabs, tabla y panel de detalle del listado seleccionado.
 */
export function AgentPropertyUsersPanel({
  property,
  users,
  selectedUser,
  selectedUserId,
  onSelectUser,
  activeStatusTab,
  visibleTabs,
  statusCounts,
  statusLabel,
  onChangeStatusTab,
  showCharts,
  onToggleCharts,
}: AgentPropertyUsersPanelProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <h4 className="font-semibold text-foreground">Usuarios en esta propiedad</h4>
        <div className="flex gap-2">
          <Button
            variant={showCharts ? "default" : "outline"}
            size="sm"
            className="gap-1.5 text-xs"
            onClick={onToggleCharts}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            {showCharts ? "Ocultar Gráficas" : "Ver Gráficas"}
          </Button>
          <Button variant="outline" size="sm" className="text-xs">
            <Clock3 className="mr-1 h-3.5 w-3.5" /> Vista reciente
          </Button>
        </div>
      </div>

      <Tabs
        value={activeStatusTab}
        onValueChange={(value) => onChangeStatusTab(value as StatusFilter)}
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

      {users.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          No hay usuarios en este estado.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.5fr_1fr]">
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="px-3 py-2 text-left font-medium">Usuario</th>
                  <th className="px-3 py-2 text-left font-medium">Estado</th>
                  <th className="px-3 py-2 text-center font-medium">Match</th>
                  <th className="px-3 py-2 text-left font-medium">Rank</th>
                  <th className="px-3 py-2 text-left font-medium">Contacto</th>
                  <th className="px-3 py-2 text-left font-medium">Actualizado</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.userListingId}
                    onClick={() => onSelectUser(user.userId)}
                    className={`cursor-pointer border-b border-border/70 last:border-b-0 ${
                      selectedUserId === user.userId ? "bg-primary/5" : "hover:bg-muted/40"
                    }`}
                  >
                    <td className="px-3 py-3">
                      <p className="font-medium text-foreground">{user.displayName}</p>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs capitalize">
                          {user.currentStatus.replace(/_/g, " ")}
                        </Badge>
                        {user.currentStatus === "visita_coordinada" && (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              const refLabel = property.ref ? ` Ref ${property.ref}` : "";
                              const startAt = user.coordinatedDate ?? new Date();
                              const url = buildGoogleCalendarUrl(
                                `Visita: ${property.title || "Propiedad"}${refLabel} - ${user.displayName}`,
                                startAt.toISOString(),
                                `Usuario: ${user.displayName} (${user.emailMasked})${refLabel}`
                              );

                              window.open(url, "_blank", "noopener,noreferrer");
                            }}
                            className="inline-flex items-center rounded-md p-1 text-primary hover:bg-primary/10"
                            title="Agendar en Google Calendar"
                          >
                            <CalendarPlus className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      {user.matchScore !== undefined ? (
                        <Badge
                          variant="outline"
                          className={`px-1.5 py-0 text-[10px] ${
                            user.matchScore >= 80
                              ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-500"
                              : user.matchScore >= 40
                              ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-500"
                              : "border-red-500/50 bg-red-500/10 text-red-500"
                          }`}
                        >
                          {user.matchScore}%
                        </Badge>
                      ) : (
                        <span className="text-xs italic text-muted-foreground">S/D</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5" title="Calificación individual">
                          <User className="h-3 w-3 text-muted-foreground" />
                          {user.personalRating !== undefined ? (
                            renderStars(user.personalRating)
                          ) : (
                            <span className="text-xs italic text-muted-foreground">S/D</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5" title="Promedio familiar">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          {user.familyRating !== undefined ? (
                            renderStars(user.familyRating)
                          ) : (
                            <span className="text-xs italic text-muted-foreground">S/D</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <p className="text-xs text-muted-foreground">{user.emailMasked}</p>
                      <p className="text-xs text-muted-foreground">{user.phone}</p>
                    </td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">
                      {user.updatedAtRelative}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <aside className="rounded-xl border border-border bg-muted/20 p-4">
            {!selectedUser ? (
              <p className="text-sm text-muted-foreground">
                No hay usuarios para este estado.
              </p>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {selectedUser.displayName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedUser.emailMasked}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Phone className="h-3 w-3" /> {selectedUser.phone || "Sin teléfono"}
                  </p>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Calificaciones por etapa
                  </p>
                  <div className="flex items-stretch gap-3 overflow-x-auto pb-1">
                    {ALL_STAGES.map((stage) => (
                      <StatusRatingCard key={stage} status={stage} user={selectedUser} />
                    ))}
                  </div>
                  {ALL_STAGES.every(
                    (stage) =>
                      !selectedUser.ratingsByStatus[
                        stage as keyof typeof selectedUser.ratingsByStatus
                      ]
                  ) && (
                    <p className="text-xs italic text-muted-foreground">
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
  );
}
