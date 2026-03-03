import { Home, Search, User, Users, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PropertyStatus, STATUS_CONFIG } from "@/types/property";

interface HeaderProps {
    userEmail: string | null;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    selectedStatuses: PropertyStatus[];
    handleStatusToggle: (status: PropertyStatus) => void;
    statusCounts: Record<PropertyStatus, number>;
    activeGroupId: string | null;
    setIsGroupsOpen: (open: boolean) => void;
    handleLogout: () => void;
}

export const UserHeader = ({
    userEmail,
    searchQuery,
    setSearchQuery,
    selectedStatuses,
    handleStatusToggle,
    statusCounts,
    activeGroupId,
    setIsGroupsOpen,
    handleLogout,
}: HeaderProps) => {
    return (
        <header className="bg-card border-b border-border sticky top-0 z-40 card-shadow">
            <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 md:h-16 flex items-center justify-between gap-2 md:gap-3">
                {/* Logo + email en mobile debajo del nombre */}
                <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 md:w-8 md:h-8 bg-primary rounded-xl flex items-center justify-center shrink-0">
                        <Home className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary-foreground" />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="font-bold text-foreground text-sm tracking-tight leading-tight">HomeFinder</span>
                        {/* Email del usuario visible solo en mobile, como subtexto bajo el nombre */}
                        {userEmail && (
                            <span className="text-[11px] text-muted-foreground truncate max-w-[120px] md:hidden leading-tight">
                                {userEmail}
                            </span>
                        )}
                    </div>
                </div>

                {/* Buscador — se achica en mobile */}
                <div className="flex-1 max-w-xs md:max-w-md relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-9 rounded-xl bg-muted border-0 text-sm"
                    />
                </div>

                {/* Filtros de estado rápidos — solo desktop */}
                <div className="hidden md:flex items-center gap-2">
                    {(Object.entries(STATUS_CONFIG) as [PropertyStatus, typeof STATUS_CONFIG[PropertyStatus]][]).map(
                        ([key, cfg]) => (
                            <button
                                key={key}
                                onClick={() => handleStatusToggle(key)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedStatuses.includes(key)
                                    ? `${cfg.bg} ${cfg.color}`
                                    : "bg-muted text-muted-foreground hover:bg-accent"
                                    }`}
                            >
                                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                {statusCounts[key] || 0}
                            </button>
                        )
                    )}
                </div>

                {/* User info & logout */}
                <div className="flex items-center gap-1 md:gap-2 shrink-0">
                    {/* Email visible solo en desktop */}
                    <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground">
                        <User className="w-3.5 h-3.5" />
                        <span className="max-w-[120px] truncate">{userEmail}</span>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 ${activeGroupId ? "text-primary" : ""}`}
                        onClick={() => setIsGroupsOpen(true)}
                        title="Grupos familiares"
                    >
                        <Users className="w-4 h-4" />
                    </Button>
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
    );
};
