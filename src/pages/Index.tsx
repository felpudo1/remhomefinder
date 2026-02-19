import { useState, useMemo } from "react";
import { Property, PropertyStatus, PropertyComment, STATUS_CONFIG } from "@/types/property";
import { MOCK_PROPERTIES } from "@/data/mockProperties";
import { PropertyCard } from "@/components/PropertyCard";
import { FilterSidebar } from "@/components/FilterSidebar";
import { PropertyDetailModal } from "@/components/PropertyDetailModal";
import { AddPropertyModal } from "@/components/AddPropertyModal";
import { Home, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

type SortOption = "total-asc" | "total-desc" | "newest" | "oldest";

const Index = () => {
  const [properties, setProperties] = useState<Property[]>(MOCK_PROPERTIES);
  const [selectedStatuses, setSelectedStatuses] = useState<PropertyStatus[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const handleStatusChange = (id: string, status: PropertyStatus) => {
    setProperties((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status } : p))
    );
    if (selectedProperty?.id === id) {
      setSelectedProperty((prev) => prev ? { ...prev, status } : null);
    }
  };

  const handleAddComment = (id: string, comment: Omit<PropertyComment, "id" | "createdAt">) => {
    const newComment: PropertyComment = {
      ...comment,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    setProperties((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, comments: [...p.comments, newComment] } : p
      )
    );
    if (selectedProperty?.id === id) {
      setSelectedProperty((prev) =>
        prev ? { ...prev, comments: [...prev.comments, newComment] } : null
      );
    }
  };

  const handleAddProperty = (property: Property) => {
    setProperties((prev) => [property, ...prev]);
  };

  const handleStatusToggle = (status: PropertyStatus) => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const handleClearFilters = () => {
    setSelectedStatuses([]);
    setSortBy("newest");
    setSearchQuery("");
  };

  const handleCardClick = (property: Property) => {
    setSelectedProperty(property);
    setIsDetailOpen(true);
  };

  const filteredAndSorted = useMemo(() => {
    let result = [...properties];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.neighborhood.toLowerCase().includes(q) ||
          p.aiSummary.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (selectedStatuses.length > 0) {
      result = result.filter((p) => selectedStatuses.includes(p.status));
    }

    // Sort
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

    return result;
  }, [properties, selectedStatuses, sortBy, searchQuery]);

  // Status counts for header pills
  const statusCounts = useMemo(() => {
    const counts: Record<PropertyStatus, number> = {
      contacted: 0,
      coordinated: 0,
      visited: 0,
      discarded: 0,
    };
    properties.forEach((p) => counts[p.status]++);
    return counts;
  }, [properties]);

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="bg-card border-b border-border sticky top-0 z-40 card-shadow">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center">
              <Home className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <span className="font-bold text-foreground text-base tracking-tight">HomeFinder</span>
              <span className="text-primary font-bold text-base"> AI</span>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, neighborhood..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 rounded-xl bg-muted border-0 text-sm"
            />
          </div>

          {/* Status pills */}
          <div className="hidden md:flex items-center gap-2">
            {(Object.entries(STATUS_CONFIG) as [PropertyStatus, typeof STATUS_CONFIG[PropertyStatus]][]).map(
              ([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => handleStatusToggle(key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    selectedStatuses.includes(key)
                      ? `${cfg.bg} ${cfg.color}`
                      : "bg-muted text-muted-foreground hover:bg-accent"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                  {statusCounts[key]}
                </button>
              )
            )}
          </div>
        </div>
      </header>

      {/* Main layout */}
      <div className="max-w-7xl mx-auto px-6 py-8 flex gap-8">
        {/* Filter sidebar */}
        <FilterSidebar
          selectedStatuses={selectedStatuses}
          onStatusToggle={handleStatusToggle}
          sortBy={sortBy}
          onSortChange={setSortBy}
          onClearFilters={handleClearFilters}
          totalCount={properties.length}
          filteredCount={filteredAndSorted.length}
        />

        {/* Dashboard */}
        <main className="flex-1 min-w-0">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Your Properties
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Track, compare and collaborate on your real estate search
            </p>
          </div>

          {filteredAndSorted.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Home className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="font-medium">No properties found</p>
              <p className="text-sm mt-1">Try adjusting your filters or add a new property.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredAndSorted.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onStatusChange={handleStatusChange}
                  onClick={() => handleCardClick(property)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setIsAddOpen(true)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center card-shadow-hover hover:scale-105 transition-all duration-200 z-30"
        aria-label="Add property"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Modals */}
      <PropertyDetailModal
        property={selectedProperty}
        open={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onStatusChange={handleStatusChange}
        onAddComment={handleAddComment}
      />

      <AddPropertyModal
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAdd={handleAddProperty}
      />
    </div>
  );
};

export default Index;
