import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Property, PropertyStatus, PropertyComment, STATUS_CONFIG } from "@/types/property";
import { useProperties } from "@/hooks/useProperties";
import { supabase } from "@/integrations/supabase/client";
import { PropertyCard } from "@/components/PropertyCard";
import { FilterSidebar } from "@/components/FilterSidebar";
import { PropertyDetailModal } from "@/components/PropertyDetailModal";
import { AddPropertyModal } from "@/components/AddPropertyModal";
import { Home, Plus, Search, Loader2, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

type SortOption = "total-asc" | "total-desc" | "newest" | "oldest";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { properties, loading, addProperty, updateStatus, addComment } = useProperties();
  const [selectedStatuses, setSelectedStatuses] = useState<PropertyStatus[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Redirect to auth if not logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/auth");
      else setUserEmail(session.user.email ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate("/auth");
      else setUserEmail(session.user.email ?? null);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleStatusChange = async (id: string, status: PropertyStatus) => {
    try {
      await updateStatus(id, status);
      if (selectedProperty?.id === id) {
        setSelectedProperty((prev) => prev ? { ...prev, status } : null);
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleAddComment = async (id: string, comment: Omit<PropertyComment, "id" | "createdAt">) => {
    try {
      await addComment(id, comment);
      // Refresh selected property comments
      const updated = properties.find((p) => p.id === id);
      if (updated) setSelectedProperty(updated);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleAddProperty = async (form: {
    url: string;
    title: string;
    priceRent: number;
    priceExpenses: number;
    currency: string;
    neighborhood: string;
    sqMeters: number;
    rooms: number;
    aiSummary: string;
  }) => {
    try {
      await addProperty(form);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
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

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.neighborhood.toLowerCase().includes(q) ||
          p.aiSummary.toLowerCase().includes(q)
      );
    }

    if (selectedStatuses.length > 0) {
      result = result.filter((p) => selectedStatuses.includes(p.status));
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

    return result;
  }, [properties, selectedStatuses, sortBy, searchQuery]);

  const statusCounts = useMemo(() => {
    const counts: Record<PropertyStatus, number> = {
      contacted: 0, coordinated: 0, visited: 0, discarded: 0
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
            <span className="font-bold text-foreground text-base tracking-tight">BuscandoMiCasaPerfecta</span>
          </div>

          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título, barrio..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 rounded-xl bg-muted border-0 text-sm"
            />
          </div>

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

          {/* User info & logout */}
          <div className="hidden md:flex items-center gap-2 ml-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <User className="w-3.5 h-3.5" />
              <span className="max-w-[120px] truncate">{userEmail}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleLogout}
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main layout */}
      <div className="max-w-7xl mx-auto px-6 py-8 flex gap-8">
        <FilterSidebar
          selectedStatuses={selectedStatuses}
          onStatusToggle={handleStatusToggle}
          sortBy={sortBy}
          onSortChange={setSortBy}
          onClearFilters={handleClearFilters}
          totalCount={properties.length}
          filteredCount={filteredAndSorted.length}
        />

        <main className="flex-1 min-w-0">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Tus Propiedades</h1>
            <p className="text-muted-foreground text-sm mt-1">Seguí, compará y colaborá en tu búsqueda inmobiliaria</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredAndSorted.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Home className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="font-medium">No se encontraron propiedades</p>
              <p className="text-sm mt-1">Ajustá los filtros o agregá una nueva propiedad.</p>
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

      <button
        onClick={() => setIsAddOpen(true)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center card-shadow-hover hover:scale-105 transition-all duration-200 z-30"
        aria-label="Add property"
      >
        <Plus className="w-6 h-6" />
      </button>

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
