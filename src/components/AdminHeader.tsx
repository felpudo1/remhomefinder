import { Shield, LogOut, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminHeaderProps {
    activeSection: string;
    onNavigate: (section: string) => void;
    onGoBack: () => void;
    handleSignOut: () => void;
    menuItems: { id: string; label: string; icon: any }[];
}

export const AdminHeader = ({
    activeSection,
    onNavigate,
    onGoBack,
    handleSignOut,
    menuItems,
}: AdminHeaderProps) => {
    return (
        <header className="border-b border-border bg-card sticky top-0 z-10">
            <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={onGoBack}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Shield className="w-4 h-4 text-primary" />
                        </div>
                        <h1 className="text-base font-semibold text-foreground">Panel de Administración</h1>
                    </div>
                </div>
                <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-2 text-muted-foreground">
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Salir</span>
                </Button>
            </div>

            {/* Pestañas superiores — scroll horizontal en mobile */}
            <div className="max-w-5xl mx-auto px-4 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                <nav className="flex gap-0 min-w-max border-t border-border/50">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeSection === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => onNavigate(item.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${isActive
                                        ? "border-primary text-primary bg-primary/5"
                                        : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {item.label}
                            </button>
                        );
                    })}
                </nav>
            </div>
        </header>
    );
};
