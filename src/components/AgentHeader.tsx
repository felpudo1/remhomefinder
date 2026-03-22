import { Home, LogOut, Users, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSystemConfig } from "@/hooks/useSystemConfig";
import { APP_BRAND_NAME_DEFAULT, APP_BRAND_NAME_KEY } from "@/lib/config-keys";

interface AgentHeaderProps {
    userEmail: string | null;
    agencyStatus?: string;
    activeTab: string;
    setActiveTab: (tab: any) => void;
    tabs: { id: string; label: string; icon: any }[];
    handleLogout: () => void;
    activeGroupId: string | null;
    setIsGroupsOpen?: (open: boolean) => void;
    displayName?: string;
    isPremium?: boolean;
    /** Solo owners pueden formar/gestionar equipos */
    isOwner?: boolean;
    /** Solo agency administra equipos; agencymember no ve tab Equipo */
    canManageTeams?: boolean;
    /** Muestra botón Formar equipo (agency y agencymember pueden abrir para copiar/pegar) */
    showFormarEquipo?: boolean;
}

export const AgentHeader = ({
    userEmail,
    agencyStatus,
    activeTab,
    setActiveTab,
    tabs,
    handleLogout,
    activeGroupId,
    setIsGroupsOpen,
    displayName,
    isPremium,
    isOwner = false,
    canManageTeams = false,
    showFormarEquipo = false,
}: AgentHeaderProps) => {
    const { value: appBrandName } = useSystemConfig(APP_BRAND_NAME_KEY, APP_BRAND_NAME_DEFAULT);
    const StatusStar = () => (
        isPremium ? (
            <span title="PREMIUM">
                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 drop-shadow-[0_0_5px_rgba(234,179,8,0.5)]" />
            </span>
        ) : (
            <span title="FREE">
                <Star className="w-3 h-3 text-slate-400/50" />
            </span>
        )
    );

    return (
        <header className="border-b border-border bg-card sticky top-0 z-40 card-shadow">
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 md:w-8 md:h-8 bg-primary rounded-xl flex items-center justify-center shrink-0">
                        <Home className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary-foreground" />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="font-bold text-foreground text-sm tracking-tight leading-tight">{appBrandName}</span>
                        {/* Identidad del Agente como subtexto: nombre + rol (owner/agente) */}
                        <div className="flex items-center gap-1">
                            <StatusStar />
                            <span className="text-[11px] text-muted-foreground truncate max-w-[150px] leading-tight font-medium">
                                {displayName || userEmail}
                            </span>
                            <span className="text-[10px] text-muted-foreground/80 shrink-0">
                                · {isOwner ? "Owner" : "Agente"}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {(showFormarEquipo || canManageTeams) && (
                        <Button
                            variant={activeGroupId ? "default" : "outline"}
                            size="sm"
                            disabled={agencyStatus !== "approved"}
                            className="h-10 px-3 md:px-4 gap-2 rounded-xl text-sm font-semibold shadow-sm transition-all hover:scale-[1.02] disabled:opacity-50"
                            onClick={() => setIsGroupsOpen && setIsGroupsOpen(true)}
                            title={agencyStatus === "approved" ? (isOwner ? "Formar equipo / Mis grupos" : "Unirme con código") : "Cuenta pendiente de activación"}
                        >
                            <Users className="w-4 h-4" />
                            <span className="hidden md:inline">Formar equipo</span>
                        </Button>
                    )}
                    
                    <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 text-muted-foreground ml-1">
                        <LogOut className="w-4 h-4" />
                        <span className="hidden sm:inline">Salir</span>
                    </Button>
                </div>
            </div>

            {agencyStatus === "approved" && (
                <div className="max-w-7xl mx-auto px-4 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                    <nav className="flex gap-0 min-w-max border-t border-border/50 mt-1">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${isActive
                                        ? "border-primary text-primary bg-primary/5"
                                        : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>
            )}
        </header>
    );
};
