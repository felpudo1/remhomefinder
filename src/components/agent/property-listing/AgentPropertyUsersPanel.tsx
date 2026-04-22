import { useState } from "react";
import { BarChart3, CalendarPlus, Check, Clock3, Phone, ShieldCheck, Sparkles, Star, Target, User, Users, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStatusFeedbackConfig } from "@/hooks/useStatusFeedbackConfig";
import { generateSentimentInsight } from "@/lib/sentimentInsight";
import type {
  PropertyInsight,
  StatusFilter,
  UserInsight,
} from "./agentPropertyListingTypes";


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
  const [showRatings, setShowRatings] = useState(false);

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
  const hasIndicators = ratingRows.length > 0 || booleanRows.length > 0;
  
  if (ratingRows.length === 0 && booleanRows.length === 0 && textRows.length === 0 && !quickReasonLabel) return null;

  // Generar insight IA (heurística local)
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
            {/* Badge clickeable que abre popover con el desglose del Match */}
            <Popover>
              <PopoverTrigger asChild>
                <Badge
                  variant="outline"
                  className={`cursor-pointer px-1.5 py-0 text-[10px] font-bold hover:opacity-80 transition-opacity ${
                    insight.matchPercent >= 75
                       ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600"
                       : insight.matchPercent >= 45
                       ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-600"
                       : "border-red-500/50 bg-red-500/10 text-red-600"
                  }`}
                >
                  {insight.matchPercent}% Match ↗
                </Badge>
              </PopoverTrigger>

              <PopoverContent className="w-64 p-3 space-y-2.5" side="top">
                {/* Encabezado */}
                <div className="flex items-center gap-1.5 border-b border-border/50 pb-2">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">¿Cómo se calcula el Match?</p>
                </div>

                {/* Estado */}
                <div className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground">Estado</span>
                  <span className="font-medium capitalize">{status.replace(/_/g, " ")}</span>
                </div>

                {insight.breakdown && (
                  <>
                    {/* Ratings individuales del usuario para este estado */}
                    {ratingRows.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-[10px] font-semibold uppercase text-muted-foreground">Ratings del usuario</p>
                        {ratingRows.map((row) => (
                          <div key={row.label} className="flex justify-between text-[11px]">
                            <span className="text-muted-foreground truncate max-w-[140px]" title={row.label}>{row.label}</span>
                            <span className="font-medium ml-2 shrink-0">{row.value}/5</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Promedio + barra visual */}
                    <div className="space-y-1 border-t border-border/40 pt-2">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-muted-foreground">
                          Promedio ({insight.breakdown.ratingsCount} rating{insight.breakdown.ratingsCount !== 1 ? "s" : ""})
                        </span>
                        <span className="font-medium">
                          {insight.breakdown.avgRating > 0 ? insight.breakdown.avgRating.toFixed(1) : "S/D"}/5 → {insight.breakdown.basePercent}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary/60 transition-all"
                          style={{ width: `${insight.breakdown.basePercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Fórmula y ajuste aplicado */}
                    <div className="space-y-0.5 text-[10px] text-muted-foreground border-t border-border/40 pt-2">
                      <p>Fórmula: <span className="font-medium text-foreground">{insight.breakdown.formulaLabel}</span></p>
                      <p>Ajuste: <span className="font-medium text-foreground">{insight.breakdown.adjustmentLabel}</span></p>
                    </div>

                    {/* Match final resaltado */}
                    <div className={`flex justify-between text-[11px] font-bold border-t border-border/40 pt-2 ${
                      insight.matchPercent >= 75 ? "text-emerald-600" : insight.matchPercent >= 45 ? "text-yellow-600" : "text-red-600"
                    }`}>
                      <span>Match final</span>
                      <span>{insight.matchPercent}%</span>
                    </div>
                  </>
                )}
              </PopoverContent>
            </Popover>
          </div>
          <p className="text-xs leading-snug text-foreground">{insight.summary}</p>
        </div>
      )}

      {/* Botón para expandir indicadores si existen ratings o booleanos */}
      {hasIndicators && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full h-7 text-[10px] font-bold uppercase tracking-widest gap-2 bg-muted/50 hover:bg-muted text-muted-foreground"
          onClick={() => setShowRatings(!showRatings)}
        >
          <BarChart3 className="h-3 w-3" />
          {showRatings ? "Ocultar Indicadores" : "Ver Indicadores"}
        </Button>
      )}

      {/* Ratings crudos — Se muestran solo si showRatings es true */}
      {showRatings && hasIndicators && (
        <div className="space-y-3 pt-2 animate-in fade-in slide-in-from-top-1 duration-200">
          {ratingRows.map((row) => (
            <RatingRow key={row.label} label={row.label} value={row.value} />
          ))}
          {booleanRows.map((row) => (
            <BooleanRow key={row.label} label={row.label} value={row.value} />
          ))}
        </div>
      )}

      {textRows.length > 0 && (
        <div className="space-y-2 pt-1 border-t border-border/50">
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
                  <th className="px-3 py-2 text-left font-medium">Credibilidad</th>
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
                    {/* Match Score — clickeable, abre popover con desglose vs perfil del usuario */}
                    <td className="px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      {user.matchScore !== undefined ? (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Badge
                              variant="outline"
                              className={`cursor-pointer px-1.5 py-0 text-[10px] hover:opacity-80 transition-opacity ${
                                user.matchScore >= 80
                                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-500"
                                  : user.matchScore >= 40
                                  ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-500"
                                  : "border-red-500/50 bg-red-500/10 text-red-500"
                              }`}
                            >
                              {user.matchScore}% ↗
                            </Badge>
                          </PopoverTrigger>

                          <PopoverContent className="w-80 p-0 overflow-hidden" side="left" align="start">
                            {/* Header del popover */}
                            <div className="bg-primary/5 border-b border-border px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Target className="h-4 w-4 text-primary" />
                                <p className="text-xs font-bold uppercase tracking-wider text-primary">Match de Perfil</p>
                              </div>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                Propiedad vs. perfil de búsqueda declarado por el usuario
                              </p>
                            </div>

                            <div className="p-3 space-y-3">
                              {user.matchScoreBreakdown ? (
                                <>
                                  {/* — Operación — */}
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between text-[11px]">
                                      <span className="font-medium flex items-center gap-1">
                                        {user.matchScoreBreakdown.operationMatch ? "✅" : "❌"} Operación
                                      </span>
                                      <span className="text-muted-foreground tabular-nums">
                                        {user.matchScoreBreakdown.operationScore}/{user.matchScoreBreakdown.operationMax}
                                      </span>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                      <div className="h-full rounded-full bg-primary/60" style={{ width: `${(user.matchScoreBreakdown.operationScore / user.matchScoreBreakdown.operationMax) * 100}%` }} />
                                    </div>
                                    <div className="flex justify-between text-[10px] text-muted-foreground">
                                      <span>Propiedad: {user.matchScoreBreakdown.propertyOperationLabel}</span>
                                      <span>Busca: {user.matchScoreBreakdown.userOperationLabel}</span>
                                    </div>
                                  </div>

                                  {/* — Presupuesto — */}
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between text-[11px]">
                                      <span className="font-medium flex items-center gap-1">
                                        {user.matchScoreBreakdown.budgetMatch === 'full' ? "✅" : user.matchScoreBreakdown.budgetMatch === 'partial' ? "🟡" : "❌"} Presupuesto
                                        {user.matchScoreBreakdown.budgetMatch === 'partial' && <span className="text-[9px] bg-yellow-100 text-yellow-700 rounded px-1">parcial</span>}
                                      </span>
                                      <span className="text-muted-foreground tabular-nums">
                                        {user.matchScoreBreakdown.budgetScore}/{user.matchScoreBreakdown.budgetMax}
                                      </span>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                      <div className="h-full rounded-full bg-primary/60" style={{ width: `${(user.matchScoreBreakdown.budgetScore / user.matchScoreBreakdown.budgetMax) * 100}%` }} />
                                    </div>
                                    <div className="flex justify-between text-[10px] text-muted-foreground">
                                      <span>Propiedad: {user.matchScoreBreakdown.propertyPriceLabel}</span>
                                      <span>Rango: {user.matchScoreBreakdown.userBudgetLabel}</span>
                                    </div>
                                  </div>

                                  {/* — Barrio — */}
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between text-[11px]">
                                      <span className="font-medium flex items-center gap-1">
                                        {user.matchScoreBreakdown.neighborhoodMatch ? "✅" : "❌"} Barrio
                                      </span>
                                      <span className="text-muted-foreground tabular-nums">
                                        {user.matchScoreBreakdown.neighborhoodScore}/{user.matchScoreBreakdown.neighborhoodMax}
                                      </span>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                      <div className="h-full rounded-full bg-primary/60" style={{ width: `${(user.matchScoreBreakdown.neighborhoodScore / user.matchScoreBreakdown.neighborhoodMax) * 100}%` }} />
                                    </div>
                                    <div className="flex justify-between text-[10px] text-muted-foreground">
                                      <span>Propiedad: {user.matchScoreBreakdown.propertyNeighborhoodLabel}</span>
                                      <span className="text-right max-w-[140px] truncate" title={user.matchScoreBreakdown.userNeighborhoodsLabel}>Busca: {user.matchScoreBreakdown.userNeighborhoodsLabel}</span>
                                    </div>
                                  </div>

                                  {/* — Ambientes — */}
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between text-[11px]">
                                      <span className="font-medium flex items-center gap-1">
                                        {user.matchScoreBreakdown.roomsMatch ? "✅" : "❌"} Ambientes
                                      </span>
                                      <span className="text-muted-foreground tabular-nums">
                                        {user.matchScoreBreakdown.roomsScore}/{user.matchScoreBreakdown.roomsMax}
                                      </span>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                      <div className="h-full rounded-full bg-primary/60" style={{ width: `${(user.matchScoreBreakdown.roomsScore / user.matchScoreBreakdown.roomsMax) * 100}%` }} />
                                    </div>
                                    <div className="flex justify-between text-[10px] text-muted-foreground">
                                      <span>Propiedad: {user.matchScoreBreakdown.propertyRoomsLabel}</span>
                                      <span>Busca: {user.matchScoreBreakdown.userRoomsLabel}</span>
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <p className="text-xs italic text-muted-foreground">
                                  Sin perfil de búsqueda configurado
                                </p>
                              )}

                              {/* Total */}
                              <div className={`flex justify-between items-center border-t border-border/50 pt-2 font-bold ${
                                user.matchScore >= 80 ? "text-emerald-600" : user.matchScore >= 40 ? "text-yellow-600" : "text-red-600"
                              }`}>
                                <span className="text-xs">Match total</span>
                                <span className="text-sm">{user.matchScore}%</span>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
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
                    {/* Credibilidad — badge clickeable que abre popover con desglose */}
                    <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                      {user.credibilityScore ? (
                        <Popover>
                          <PopoverTrigger asChild>
                            {/* Badge clickeable — stopPropagation para no seleccionar la fila */}
                            <div className="flex flex-col gap-0.5 cursor-pointer">
                              <Badge
                                variant="outline"
                                className={`w-fit px-1.5 py-0 text-[10px] font-bold hover:opacity-80 transition-opacity ${user.credibilityScore.colorClass}`}
                              >
                                {user.credibilityScore.emoji} {user.credibilityScore.label}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground underline decoration-dotted">
                                {user.credibilityScore.score}/100 ↗
                              </span>
                            </div>
                          </PopoverTrigger>

                          {/* Contenido del popover: explicación del score */}
                          <PopoverContent className="w-72 p-4 space-y-3" side="left" align="start">
                            {/* Encabezado */}
                            <div className="flex items-center gap-2 border-b border-border/50 pb-2">
                              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Coeficiente de Credibilidad</p>
                            </div>

                            {/* Score principal */}
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className={`px-2 py-0.5 text-sm font-bold ${user.credibilityScore.colorClass}`}
                              >
                                {user.credibilityScore.emoji} {user.credibilityScore.label}
                              </Badge>
                              <span className="text-lg font-bold text-foreground">
                                {user.credibilityScore.score}
                                <span className="text-xs text-muted-foreground font-normal">/100</span>
                              </span>
                            </div>

                            {/* Comentario IA */}
                            <p className="text-[11px] text-muted-foreground leading-snug italic border-l-2 border-primary/30 pl-2">
                              {user.credibilityScore.comment}
                            </p>

                            {/* Desglose por componente con barra de progreso visual */}
                            <div className="space-y-2">
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">¿Cómo se calcula?</p>

                              {/* Consistencia */}
                              <div className="space-y-0.5">
                                <div className="flex justify-between text-[11px]">
                                  <span className="text-foreground font-medium">Consistencia de respuestas</span>
                                  <span className="text-muted-foreground">{user.credibilityScore.details.consistencyScore}/40</span>
                                </div>
                                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-primary/60 transition-all"
                                    style={{ width: `${(user.credibilityScore.details.consistencyScore / 40) * 100}%` }}
                                  />
                                </div>
                                <p className="text-[10px] text-muted-foreground">Campos estables (urgencia, garantía) entre propiedades</p>
                              </div>

                              {/* Interacciones */}
                              <div className="space-y-0.5">
                                <div className="flex justify-between text-[11px]">
                                  <span className="text-foreground font-medium">Calidad de interacciones</span>
                                  <span className="text-muted-foreground">{user.credibilityScore.details.interactionScore}/25</span>
                                </div>
                                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-primary/60 transition-all"
                                    style={{ width: `${(user.credibilityScore.details.interactionScore / 25) * 100}%` }}
                                  />
                                </div>
                                <p className="text-[10px] text-muted-foreground">Justifica sus descartes de propiedades</p>
                              </div>

                              {/* Perfil */}
                              <div className="space-y-0.5">
                                <div className="flex justify-between text-[11px]">
                                  <span className="text-foreground font-medium">Perfil completo</span>
                                  <span className="text-muted-foreground">{user.credibilityScore.details.profileScore}/20</span>
                                </div>
                                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-primary/60 transition-all"
                                    style={{ width: `${(user.credibilityScore.details.profileScore / 20) * 100}%` }}
                                  />
                                </div>
                                <p className="text-[10px] text-muted-foreground">Teléfono registrado y perfil de búsqueda configurado</p>
                              </div>

                              {/* Funnel */}
                              <div className="space-y-0.5">
                                <div className="flex justify-between text-[11px]">
                                  <span className="text-foreground font-medium">Profundidad en el proceso</span>
                                  <span className="text-muted-foreground">{user.credibilityScore.details.funnelScore}/15</span>
                                </div>
                                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-primary/60 transition-all"
                                    style={{ width: `${(user.credibilityScore.details.funnelScore / 15) * 100}%` }}
                                  />
                                </div>
                                <p className="text-[10px] text-muted-foreground">Qué tan lejos avanzó en el funnel de búsqueda</p>
                              </div>
                            </div>

                            {/* Pie: cantidad de propiedades usadas */}
                            <p className="text-[9px] text-muted-foreground/60 border-t border-border/40 pt-2">
                              Calculado en base a {user.credibilityScore.interactionsCount} propiedad(es) del usuario
                            </p>
                          </PopoverContent>
                        </Popover>
                      ) : (
                        <span className="text-xs italic text-muted-foreground">S/D</span>
                      )}
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

                {/* Sección de Credibilidad */}
                {selectedUser.credibilityScore && (
                  <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Credibilidad</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`px-2 py-0.5 text-xs font-bold ${selectedUser.credibilityScore.colorClass}`}
                      >
                        {selectedUser.credibilityScore.emoji} {selectedUser.credibilityScore.label}
                      </Badge>
                      <span className="text-sm font-bold text-foreground">
                        {selectedUser.credibilityScore.score}<span className="text-xs text-muted-foreground">/100</span>
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-snug italic">
                      {selectedUser.credibilityScore.comment}
                    </p>
                    {/* Desglose del score por componente */}
                    <div className="grid grid-cols-2 gap-1 pt-1 border-t border-border/50">
                      <div className="text-[10px] text-muted-foreground">Consistencia
                        <span className="ml-1 font-semibold text-foreground">{selectedUser.credibilityScore.details.consistencyScore}/40</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground">Interacciones
                        <span className="ml-1 font-semibold text-foreground">{selectedUser.credibilityScore.details.interactionScore}/25</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground">Perfil
                        <span className="ml-1 font-semibold text-foreground">{selectedUser.credibilityScore.details.profileScore}/20</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground">Funnel
                        <span className="ml-1 font-semibold text-foreground">{selectedUser.credibilityScore.details.funnelScore}/15</span>
                      </div>
                    </div>
                    <p className="text-[9px] text-muted-foreground/60">
                      Basado en {selectedUser.credibilityScore.interactionsCount} propiedad(es)
                    </p>
                  </div>
                )}

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
