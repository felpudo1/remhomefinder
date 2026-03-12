import { Building2, LogOut, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AgentHeaderProps {
    userEmail: string | null;
    agencyStatus?: string;
    activeTab: string;
    setActiveTab: (tab: any) => void;
    tabs: { id: string; label: string; icon: any }[];
    handleLogout: () => void;
    activeGroupId: string | null;
    setIsGroupsOpen: (open: boolean) => void;
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
}: AgentHeaderProps) => {
    return (
        <header className="border-b border-border bg-card sticky top-0 z-40 card-shadow">
            <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-base font-semibold text-foreground">Panel Agente</h1>
                        {userEmail && <p className="text-xs text-muted-foreground">{userEmail}</p>}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant={activeGroupId ? "default" : "outline"}
                        size="sm"
                        className="h-10 px-4 gap-2 rounded-xl text-sm font-semibold shadow-sm transition-all hover:scale-[1.02]"
                        onClick={() => setIsGroupsOpen(true)}
                        title="Formar equipo / Mis grupos"
                    >
                        <Users className="w-4 h-4" />
                        <span>Formar equipo</span>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 text-muted-foreground ml-1">
                        <LogOut className="w-4 h-4" />
                        <span className="hidden sm:inline">Salir</span>
                    </Button>
                </div>
            </div>

            {agencyStatus === "approved" && (
                <div className="max-w-5xl mx-auto px-4 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
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
