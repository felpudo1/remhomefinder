import { useMemo, useState } from "react";
import type { PropertyInsight, StatusFilter } from "./agentPropertyListingTypes";

/**
 * Mantiene el estado visual y derivado del listado de propiedades del agente.
 */
export function useAgentPropertyListingController(insights: PropertyInsight[]) {
  const [query, setQuery] = useState("");
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [activeStatusTab, setActiveStatusTab] = useState<StatusFilter>("todos");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showCharts, setShowCharts] = useState(false);

  const effectiveSelectedId = selectedPropertyId || insights[0]?.publicationId || null;

  const filteredProperties = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return insights;

    return insights.filter(
      (property) =>
        property.title.toLowerCase().includes(normalizedQuery) ||
        property.neighborhood.toLowerCase().includes(normalizedQuery)
    );
  }, [insights, query]);

  const selectedProperty = useMemo(
    () => insights.find((property) => property.publicationId === effectiveSelectedId) || null,
    [effectiveSelectedId, insights]
  );

  const selectedUsers = selectedProperty?.users || [];

  const usersByStatus = useMemo(
    () =>
      selectedUsers.filter((user) =>
        activeStatusTab === "todos" ? true : user.currentStatus === activeStatusTab
      ),
    [activeStatusTab, selectedUsers]
  );

  const selectedUser = useMemo(() => {
    if (selectedUserId) {
      const found = usersByStatus.find((user) => user.userId === selectedUserId);
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

    selectedUsers.forEach((user) => {
      if (user.currentStatus in base) {
        base[user.currentStatus as StatusFilter] += 1;
      }
    });

    return base;
  }, [selectedUsers]);

  const visibleTabs: StatusFilter[] = useMemo(() => {
    const tabs: StatusFilter[] = ["todos"];
    const order: StatusFilter[] = [
      "ingresado",
      "contactado",
      "visita_coordinada",
      "firme_candidato",
      "posible_interes",
      "meta_conseguida",
      "descartado",
    ];

    order.forEach((status) => {
      if (statusCounts[status] > 0) {
        tabs.push(status);
      }
    });

    return tabs;
  }, [statusCounts]);

  const selectProperty = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    setSelectedUserId(null);
    setActiveStatusTab("todos");
  };

  const selectStatusTab = (value: StatusFilter) => {
    setActiveStatusTab(value);
    setSelectedUserId(null);
  };

  return {
    query,
    setQuery,
    showCharts,
    setShowCharts,
    filteredProperties,
    selectedProperty,
    usersByStatus,
    selectedUser,
    selectedUserId,
    setSelectedUserId,
    statusCounts,
    visibleTabs,
    activeStatusTab,
    selectProperty,
    selectStatusTab,
  };
}
