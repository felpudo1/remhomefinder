import { useEffect, useMemo, useState } from "react";
import type { Property, PropertyStatus } from "@/types/property";
import type { ListadoSortOption } from "@/types/index-page";

interface UseIndexListingControllerParams {
  properties: Property[];
  activeGroupId: string | null;
}

/**
 * Encapsula la lógica del listado principal: filtros, búsqueda, orden y conteos.
 * Deja a `Index.tsx` como orquestador y a `MiListadoTabPanel` como capa visual.
 */
export function useIndexListingController({
  properties,
  activeGroupId,
}: UseIndexListingControllerParams) {
  const [selectedStatuses, setSelectedStatuses] = useState<PropertyStatus[]>([]);
  const [sortBy, setSortBy] = useState<ListadoSortOption>("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [hideDiscarded, setHideDiscarded] = useState(true);
  const [expandPhotos, setExpandPhotos] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleStatusToggle = (status: PropertyStatus) => {
    setSelectedStatuses((prev) => {
      const isRemoving = prev.includes(status);
      const next = isRemoving ? prev.filter((item) => item !== status) : [...prev, status];

      if (status === "descartado" && !isRemoving) {
        setHideDiscarded(false);
      }

      return next;
    });
  };

  const handleClearFilters = () => {
    setSelectedStatuses([]);
    setSortBy("newest");
    setSearchQuery("");
  };

  const filteredAndSorted = useMemo(() => {
    let result = [...properties];

    if (activeGroupId) {
      result = result.filter((property) => property.groupId === activeGroupId);
    }

    result = result.filter((property) => property.status !== "eliminado");

    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      result = result.filter(
        (property) =>
          property.title.toLowerCase().includes(query) ||
          property.neighborhood.toLowerCase().includes(query) ||
          property.aiSummary.toLowerCase().includes(query)
      );
    }

    if (selectedStatuses.length > 0) {
      result = result.filter((property) => selectedStatuses.includes(property.status));
    }

    if (hideDiscarded) {
      result = result.filter((property) => property.status !== "descartado");
    }

    switch (sortBy) {
      case "total-asc":
        result.sort((a, b) => a.totalCost - b.totalCost);
        break;
      case "total-desc":
        result.sort((a, b) => b.totalCost - a.totalCost);
        break;
      case "newest":
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case "oldest":
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
    }

    result.sort(
      (a, b) => (a.status === "descartado" ? 1 : 0) - (b.status === "descartado" ? 1 : 0)
    );

    return result;
  }, [activeGroupId, debouncedSearchQuery, hideDiscarded, properties, selectedStatuses, sortBy]);

  const statusCounts = useMemo(() => {
    const counts: Record<PropertyStatus, number> = {
      ingresado: 0,
      contactado: 0,
      visita_coordinada: 0,
      visitado: 0,
      descartado: 0,
      a_analizar: 0,
      eliminado: 0,
      eliminado_agencia: 0,
      firme_candidato: 0,
      posible_interes: 0,
      meta_conseguida: 0,
    };

    properties.forEach((property) => {
      if (counts[property.status] !== undefined) {
        counts[property.status]++;
      }
    });

    return counts;
  }, [properties]);

  return {
    selectedStatuses,
    sortBy,
    searchQuery,
    hideDiscarded,
    expandPhotos,
    filteredAndSorted,
    statusCounts,
    setSortBy,
    setSearchQuery,
    setHideDiscarded,
    setExpandPhotos,
    handleStatusToggle,
    handleClearFilters,
  };
}
