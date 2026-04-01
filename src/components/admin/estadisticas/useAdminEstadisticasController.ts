import { useMemo, useState } from "react";
import type { StatProperty } from "@/types/admin-publications";
import type { StatsSortConfig } from "./adminEstadisticasTypes";

/**
 * Mantiene el estado visual y derivado del dashboard de estadísticas.
 * No toca fetch; solo tabs, páginas y orden local.
 */
export function useAdminEstadisticasController(
  marketProps: StatProperty[],
  personalProps: StatProperty[]
) {
  const [pageMarket, setPageMarket] = useState(0);
  const [pagePersonal, setPagePersonal] = useState(0);
  const [statsSubTab, setStatsSubTab] = useState<"marketplace" | "personal">("marketplace");
  const [mainTab, setMainTab] = useState<"interes" | "scraping">("interes");
  const [sortConfig, setSortConfig] = useState<StatsSortConfig>({
    key: "created_at",
    direction: "desc",
  });

  const handleSort = (key: keyof StatProperty) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const currentProps = statsSubTab === "marketplace" ? marketProps : personalProps;

  const sortedStats = useMemo(() => {
    return [...currentProps].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (sortConfig.key === "discardReasons") {
        const sum = (items: { count: number }[] | undefined) =>
          (items || []).reduce((accumulator, item) => accumulator + item.count, 0);
        aValue = sum(a.discardReasons);
        bValue = sum(b.discardReasons);
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortConfig.direction === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });
  }, [currentProps, sortConfig]);

  return {
    pageMarket,
    setPageMarket,
    pagePersonal,
    setPagePersonal,
    statsSubTab,
    setStatsSubTab,
    mainTab,
    setMainTab,
    sortConfig,
    sortedStats,
    handleSort,
  };
}
