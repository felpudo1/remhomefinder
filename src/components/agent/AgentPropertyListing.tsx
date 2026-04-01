import { Loader2, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAgentPropertyInsights } from "@/hooks/useAgentPropertyInsights";
import { useStatusFeedbackConfig } from "@/hooks/useStatusFeedbackConfig";
import { Agency } from "./AgentProfile";
import { AgentPropertyCards } from "./property-listing/AgentPropertyCards";
import { AgentPropertyChartsPanel } from "./property-listing/AgentPropertyChartsPanel";
import { AgentPropertyUsersPanel } from "./property-listing/AgentPropertyUsersPanel";
import { useAgentPropertyListingController } from "./property-listing/useAgentPropertyListingController";

interface AgentPropertyListingProps {
  agency: Agency;
}

export function AgentPropertyListing({ agency }: AgentPropertyListingProps) {
  const { data: insights = [], isLoading } = useAgentPropertyInsights(agency.id);
  const { data: discardFields } = useStatusFeedbackConfig("descartado");
  const controller = useAgentPropertyListingController(insights);

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
