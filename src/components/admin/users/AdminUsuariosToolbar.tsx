import { RefreshCw, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface AdminUsuariosToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => Promise<void>;
  isRefreshing: boolean;
  isFetching: boolean;
  staleMs: number;
}

/**
 * Barra superior del módulo: explicación corta, búsqueda y refresco manual.
 */
export function AdminUsuariosToolbar({
  searchQuery,
  onSearchChange,
  onRefresh,
  isRefreshing,
  isFetching,
  staleMs,
}: AdminUsuariosToolbarProps) {
  return (
    <>
      <p className="text-[10px] text-muted-foreground">
        Rol, Props y Refs: orden <strong>solo en esta página</strong> (sin nueva petición).
        Otras columnas ordenan en servidor. Lista cacheada {staleMs / 1000}s; usá refrescar para forzar.
      </p>

      <div className="flex items-center gap-2 justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o email..."
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            className="pl-9 h-9 rounded-xl text-sm"
          />
        </div>

        <button
          title="Refrescar datos"
          onClick={onRefresh}
          className="p-2 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing || isFetching ? "animate-spin" : ""}`} />
        </button>
      </div>
    </>
  );
}
