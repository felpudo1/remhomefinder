import { PropertyStatus, STATUS_CONFIG } from "@/types/property";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, X } from "lucide-react";

type SortOption = "total-asc" | "total-desc" | "newest" | "oldest";

interface FilterSidebarProps {
  selectedStatuses: PropertyStatus[];
  onStatusToggle: (status: PropertyStatus) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  onClearFilters: () => void;
  totalCount: number;
  filteredCount: number;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "total-asc", label: "Price: Low to High" },
  { value: "total-desc", label: "Price: High to Low" },
];

export function FilterSidebar({
  selectedStatuses,
  onStatusToggle,
  sortBy,
  onSortChange,
  onClearFilters,
  totalCount,
  filteredCount,
}: FilterSidebarProps) {
  const hasActiveFilters = selectedStatuses.length > 0 || sortBy !== "newest";

  return (
    <aside className="w-64 shrink-0">
      <div className="bg-card rounded-2xl p-5 card-shadow sticky top-24 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
            <span className="font-semibold text-sm text-foreground">Filters</span>
          </div>
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <X className="w-3 h-3" />
              Clear
            </button>
          )}
        </div>

        {/* Results count */}
        <div className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2">
          Showing{" "}
          <span className="font-semibold text-foreground">{filteredCount}</span> of{" "}
          <span className="font-semibold text-foreground">{totalCount}</span> properties
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Status
          </p>
          <div className="space-y-1.5">
            {(Object.entries(STATUS_CONFIG) as [PropertyStatus, typeof STATUS_CONFIG[PropertyStatus]][]).map(
              ([key, cfg]) => {
                const isSelected = selectedStatuses.includes(key);
                return (
                  <button
                    key={key}
                    onClick={() => onStatusToggle(key)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                      isSelected
                        ? `${cfg.bg} ${cfg.color} font-medium`
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                    {cfg.label}
                  </button>
                );
              }
            )}
          </div>
        </div>

        {/* Sort */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Sort by
          </p>
          <div className="space-y-1.5">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onSortChange(opt.value)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                  sortBy === opt.value
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
