import { useMemo, useState } from "react";
import type { StatProperty } from "@/types/admin-publications";

/**
 * Centraliza el estado visual de la tabla de auditoria del agente.
 */
export function useAgentEstadisticasController(statProps: StatProperty[]) {
  const [sortConfig, setSortConfig] = useState<{
    key: keyof StatProperty;
    direction: "asc" | "desc";
  }>({
    key: "created_at",
    direction: "desc",
  });

  const sortedStats = useMemo(() => {
    return [...statProps].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortConfig.direction === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return 0;
    });
  }, [sortConfig, statProps]);

  const handleSort = (key: keyof StatProperty) => {
    setSortConfig((previousValue) => ({
      key,
      direction:
        previousValue.key === key && previousValue.direction === "desc"
          ? "asc"
          : "desc",
    }));
  };

  return {
    sortConfig,
    sortedStats,
    handleSort,
  };
}
