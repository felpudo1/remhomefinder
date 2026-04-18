import { useState } from "react";
import { useAgenciesDirectory, DirectoryAgency } from "@/hooks/useAgenciesDirectory";
import { useGeography } from "@/hooks/useGeography";
import { Heart, Crown, ExternalLink, Search, Loader2, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

function AgencyCard({
  agency,
  onToggleFavorite,
  isToggling,
}: {
  agency: DirectoryAgency;
  onToggleFavorite: () => void;
  isToggling: boolean;
}) {
  const isFeatured = agency.isFeatured;
  return (
    <div
      className={`relative rounded-xl border p-4 flex flex-col gap-2 transition-all ${
        isFeatured
          ? "border-amber-400/60 bg-gradient-to-br from-amber-50/40 to-amber-100/20 dark:from-amber-950/20 dark:to-amber-900/10 shadow-md"
          : "border-border bg-card"
      }`}
    >
      {isFeatured && (
        <Badge className="absolute -top-2.5 right-3 bg-amber-500 text-white text-[10px] gap-1 px-2">
          <Crown className="w-3 h-3" /> Destacada
        </Badge>
      )}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-sm leading-tight flex-1 break-words line-clamp-3">{agency.name}</h3>
        <button
          onClick={onToggleFavorite}
          disabled={isToggling}
          className="shrink-0 p-1 rounded-full hover:bg-muted transition-colors"
          title={agency.isFavorite ? "Quitar de mis agencias" : "Guardar en mis agencias"}
        >
          <Heart
            className={`w-5 h-5 transition-colors ${
              agency.isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground"
            }`}
          />
        </button>
      </div>

      {agency.followerCount > 0 && (
        <span className="text-xs text-muted-foreground">
          {agency.followerCount} publicaciones activas
        </span>
      )}

      {agency.websiteUrl && (
        <a
          href={agency.websiteUrl.startsWith("http") ? agency.websiteUrl : `https://${agency.websiteUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-auto"
        >
          <ExternalLink className="w-3 h-3" /> Visitar Web
        </a>
      )}
    </div>
  );
}

export function AgenciesDirectoryPanel() {
  const { agencies, favoriteAgencies, isLoading, toggleFavorite, maxFavorites, favoriteCount } = useAgenciesDirectory();
  const { departments } = useGeography();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState<string>("all");

  const handleToggle = (agency: DirectoryAgency) => {
    toggleFavorite.mutate(
      { agencyId: agency.id, agencyType: agency.type, isFavorite: agency.isFavorite },
      {
        onError: (err: any) => {
          toast({ title: "Error", description: err.message, variant: "destructive" });
        },
      }
    );
  };

  // Filter
  const filtered = agencies.filter((a) => {
    if (searchQuery && !a.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (selectedDept !== "all" && a.departmentId !== selectedDept) return false;
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Mis Agencias */}
      {favoriteAgencies.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Heart className="w-4 h-4 text-red-500 fill-red-500" />
            Mis Agencias ({favoriteCount}/{maxFavorites})
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {favoriteAgencies.map((a) => (
              <AgencyCard
                key={`${a.type}:${a.id}`}
                agency={a}
                onToggleFavorite={() => handleToggle(a)}
                isToggling={toggleFavorite.isPending}
              />
            ))}
          </div>
        </section>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar agencia..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={selectedDept} onValueChange={setSelectedDept}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Departamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {(departments || []).map((d: any) => (
              <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Listado General */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <Building2 className="w-10 h-10 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">No se encontraron agencias.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((a) => (
            <AgencyCard
              key={`${a.type}:${a.id}`}
              agency={a}
              onToggleFavorite={() => handleToggle(a)}
              isToggling={toggleFavorite.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}
