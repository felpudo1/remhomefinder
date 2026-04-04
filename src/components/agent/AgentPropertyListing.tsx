import { Loader2, Building2 } from "lucide-react";
import { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAgentPropertyInsights } from "@/hooks/useAgentPropertyInsights";
import { useStatusFeedbackConfig } from "@/hooks/useStatusFeedbackConfig";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Agency } from "./AgentProfile";
import { AgentPropertyCards } from "./property-listing/AgentPropertyCards";
import { AgentPropertyChartsPanel } from "./property-listing/AgentPropertyChartsPanel";
import { AgentPropertyUsersPanel } from "./property-listing/AgentPropertyUsersPanel";
import { useAgentPropertyListingController } from "./property-listing/useAgentPropertyListingController";

interface AgentPropertyListingProps {
  agency: Agency;
}

export function AgentPropertyListing({ agency }: AgentPropertyListingProps) {
  const { data: insights = [], isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useAgentPropertyInsights(agency.id);
  const { data: discardFields } = useStatusFeedbackConfig("descartado");
  const controller = useAgentPropertyListingController(insights);
  const queryClient = useQueryClient();

  // Realtime: invalidar cache cuando llega un nuevo status_history_log
  useEffect(() => {
    if (!agency.id) return;

    const channelName = `agent_insights_rt_${agency.id}`;
    // Limpieza pre-emptiva
    supabase.removeChannel(supabase.channel(channelName));

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "status_history_log" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["agent-property-insights", agency.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agency.id, queryClient]);

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
  const discardedUsers =
    controller.selectedProperty?.users.filter((user) => user.ratingsByStatus?.descartado) || [];

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
            value={controller.query}
            onChange={(e) => controller.setQuery(e.target.value)}
          />
        </div>
      </div>

      <AgentPropertyCards
        properties={controller.filteredProperties}
        selectedPropertyId={controller.selectedProperty?.publicationId || null}
        onSelectProperty={controller.selectProperty}
      />

      {/* Botón "Cargar más" para paginación */}
      {hasNextPage && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="gap-2"
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Cargando...
              </>
            ) : (
              "Cargar más propiedades"
            )}
          </Button>
        </div>
      )}

      {controller.selectedProperty && (
        <div className="space-y-4">
          {controller.showCharts && (
            <AgentPropertyChartsPanel
              totalUsers={controller.statusCounts.todos}
              statusCounts={controller.statusCounts}
              statusLabel={statusLabel}
              discardedUsers={discardedUsers}
              discardFields={discardFields}
            />
          )}

          <AgentPropertyUsersPanel
            property={controller.selectedProperty}
            users={controller.usersByStatus}
            selectedUser={controller.selectedUser}
            selectedUserId={controller.selectedUserId}
            onSelectUser={controller.setSelectedUserId}
            activeStatusTab={controller.activeStatusTab}
            visibleTabs={controller.visibleTabs}
            statusCounts={controller.statusCounts}
            statusLabel={statusLabel}
            onChangeStatusTab={controller.selectStatusTab}
            showCharts={controller.showCharts}
            onToggleCharts={() => controller.setShowCharts(!controller.showCharts)}
          />
        </div>
      )}
    </div>
  );
}
