import { Home, LogOut, ArrowLeft, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSystemConfig } from "@/hooks/useSystemConfig";
import { APP_BRAND_NAME_DEFAULT, APP_BRAND_NAME_KEY } from "@/lib/config-keys";

interface AdminHeaderProps {
    activeSection: string;
    onNavigate: (section: string) => void;
    onGoBack: () => void;
    handleSignOut: () => void;
    menuItems: { id: string; label: string; icon: any }[];
    userEmail?: string | null;
    displayName?: string | null;
    isPremium?: boolean;
}

export const AdminHeader = ({
    activeSection,
    onNavigate,
    onGoBack,
    handleSignOut,
    menuItems,
    userEmail,
    displayName,
    isPremium,
}: AdminHeaderProps) => {
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
                    <Button variant="ghost" size="icon" onClick={onGoBack} className="shrink-0 -ml-2">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 md:w-8 md:h-8 bg-primary rounded-xl flex items-center justify-center shrink-0">
                            <Home className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary-foreground" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="font-bold text-foreground text-sm tracking-tight leading-tight">{appBrandName}</span>
                            {/* Identidad del Admin como subtexto */}
                            <div className="flex items-center gap-1">
                                <StatusStar />
                                <span className="text-[11px] text-muted-foreground truncate max-w-[150px] leading-tight font-medium">
                                    {displayName || userEmail || "Administrador"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-2 text-muted-foreground">
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Salir</span>
                </Button>
            </div>

            {/* Pestañas superiores — scroll horizontal en mobile */}
            <div className="max-w-7xl mx-auto px-4 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
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
