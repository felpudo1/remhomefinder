import { useRef, useState } from "react";
import { Home, LogOut, Users, Star, User, Building2, Loader2, Camera, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useSystemConfig } from "@/hooks/useSystemConfig";
import { APP_BRAND_NAME_DEFAULT, APP_BRAND_NAME_KEY } from "@/lib/config-keys";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditProfileModal } from "@/components/EditProfileModal";
import { uploadAgencyLogoAndSave } from "@/lib/agencyLogoUpload";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { AgentProfile, type Agency } from "@/components/agent/AgentProfile";
import type { UserStatus } from "@/types/property";

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
    /** Foto del agente (igual que usuarios) */
    avatarUrl?: string;
    isPremium?: boolean;
    isOwner?: boolean;
    canManageTeams?: boolean;
    showFormarEquipo?: boolean;
    /** Agencia actual para logo */
    agencyId?: string | null;
    agencyLogoUrl?: string;
    onAgencyLogoUpdated?: (url: string) => void;
    /** Para el diálogo "Perfil de agencia" (antes pestaña Perfil) */
    agency?: Agency | null;
    profileStatus?: UserStatus;
    /** Reiniciar el tour guiado del dashboard */
    onRestartTour?: () => void;
}

/**
 * Logo de agencia: click → elegir imagen; muestra preview y sube a Storage.
 */
function AgencyLogoSlot({
    agencyId,
    logoUrl,
    onUploaded,
}: {
    agencyId: string | null;
    logoUrl: string;
    onUploaded?: (url: string) => void;
}) {
    const { toast } = useToast();
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    const handlePick = () => inputRef.current?.click();

    const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file || !agencyId) return;
        if (!file.type.startsWith("image/")) {
            toast({ title: "Archivo no válido", description: "Elegí una imagen (JPG, PNG, etc.).", variant: "destructive" });
            return;
        }
        setUploading(true);
        try {
            const url = await uploadAgencyLogoAndSave(agencyId, file);
            onUploaded?.(url);
            toast({ title: "Logo actualizado" });
        } catch (err) {
            console.error(err);
            toast({
                title: "No se pudo subir el logo",
                description: err instanceof Error ? err.message : "Intentá de nuevo.",
                variant: "destructive",
            });
        } finally {
            setUploading(false);
        }
    };

    if (!agencyId) {
        return (
            <div
                className="h-9 w-9 md:h-14 md:w-14 rounded-xl border border-dashed border-border flex items-center justify-center shrink-0 bg-muted/30"
                title="Sin agencia"
            >
                <Building2 className="h-4 w-4 md:h-6 md:w-6 text-muted-foreground" />
            </div>
        );
    }

    return (
        <>
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
            <button
                type="button"
                onClick={handlePick}
                disabled={uploading}
                title="Cargar logo de la agencia"
                className={cn(
                    "relative h-9 w-9 md:h-14 md:w-14 rounded-xl border border-border overflow-hidden shrink-0",
                    "bg-muted/40 flex items-center justify-center",
                    "hover:ring-2 hover:ring-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    "disabled:opacity-60"
                )}
            >
                {uploading ? (
                    <Loader2 className="h-4 w-4 md:h-6 md:w-6 animate-spin text-muted-foreground" />
                ) : logoUrl ? (
                    <img src={logoUrl} alt="" className="h-full w-full object-contain" />
                ) : (
                    <Camera className="h-4 w-4 md:h-6 md:w-6 text-muted-foreground" />
                )}
                <span className="sr-only">Cargar logo de la agencia</span>
            </button>
        </>
    );
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
    avatarUrl,
    isPremium,
    isOwner = false,
    canManageTeams = false,
    showFormarEquipo = false,
    agencyId = null,
    agencyLogoUrl = "",
    onAgencyLogoUpdated,
    agency = null,
    profileStatus = "active",
    onRestartTour,
}: AgentHeaderProps) => {
    const { value: appBrandName } = useSystemConfig(APP_BRAND_NAME_KEY, APP_BRAND_NAME_DEFAULT);
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [agencyProfileOpen, setAgencyProfileOpen] = useState(false);

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
        <>
        <header className="border-b border-border bg-card sticky top-0 z-40 card-shadow">
            <div className="max-w-7xl mx-auto px-4 py-3 md:py-4 flex items-start justify-between gap-2 md:gap-4">
                <div className="flex items-center gap-2 md:gap-3 min-w-0 pt-0.5">
                    <div id="agent-agency-logo">
                        <AgencyLogoSlot
                            agencyId={agencyId}
                            logoUrl={agencyLogoUrl}
                            onUploaded={onAgencyLogoUpdated}
                        />
                    </div>
                    <div className="w-7 h-7 md:w-14 md:h-14 bg-primary rounded-xl md:rounded-2xl flex items-center justify-center shrink-0">
                        <Home className="w-3.5 h-3.5 md:w-8 md:h-8 text-primary-foreground" />
                    </div>
                    <div className="flex flex-col min-w-0 justify-center">
                        <span className="font-bold text-foreground text-sm md:text-lg tracking-tight leading-tight">{appBrandName}</span>
                        {agency?.name ? (
                            <span
                                className="mt-0.5 font-bold text-foreground text-sm md:text-lg tracking-tight leading-tight truncate max-w-[160px] sm:max-w-[220px] md:max-w-[280px]"
                                title={agency.name}
                            >
                                {agency.name}
                            </span>
                        ) : null}
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <div className="flex items-center gap-[calc(0.25rem*1.3)] sm:gap-[calc(0.5rem*1.3)]">
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
                                <span className="hidden sm:inline">Formar equipo</span>
                            </Button>
                        )}

                        {/* Botón de ayuda para repetir el tour guiado */}
                        {onRestartTour && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground"
                                onClick={onRestartTour}
                                title="Ver tour guiado"
                            >
                                <HelpCircle className="w-4 h-4" />
                            </Button>
                        )}

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-[43px] w-[43px] md:h-14 md:w-14 rounded-full shrink-0"
                                    title="Menú del agente"
                                    type="button"
                                >
                                    <Avatar className="h-[38px] w-[38px] md:h-12 md:w-12 hover:opacity-80 transition-opacity">
                                        <AvatarImage src={avatarUrl} alt={displayName || "Agente"} />
                                        <AvatarFallback className="bg-primary/10 text-primary text-sm md:text-lg">
                                            {displayName ? displayName.charAt(0).toUpperCase() : <User className="w-[18px] h-[18px] md:w-7 md:h-7" />}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 mt-2">
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{displayName || "Agente"}</p>
                                    <p className="text-xs leading-none text-muted-foreground">{userEmail ?? ""}</p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="cursor-pointer gap-2 py-2" onClick={() => setIsEditProfileOpen(true)}>
                                <User className="w-4 h-4 text-muted-foreground" />
                                <span>Mi perfil</span>
                            </DropdownMenuItem>
                            {agency && (
                                <DropdownMenuItem
                                    className="cursor-pointer gap-2 py-2"
                                    onClick={() => setAgencyProfileOpen(true)}
                                >
                                    <Building2 className="w-4 h-4 text-muted-foreground" />
                                    <span>Perfil de agencia</span>
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="cursor-pointer gap-2 py-2 text-destructive focus:text-destructive focus:bg-destructive/10"
                                onClick={handleLogout}
                            >
                                <LogOut className="w-4 h-4" />
                                <span>Cerrar sesión</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    </div>

                    <div className="flex items-center justify-end gap-1 flex-wrap text-right max-w-[70vw] sm:max-w-xs md:max-w-sm">
                        <StatusStar />
                        <span className="text-xs md:text-sm text-muted-foreground font-medium leading-tight break-words">
                            {displayName || userEmail || "—"}
                        </span>
                        <span className="text-[10px] md:text-xs text-muted-foreground/80 shrink-0">
                            · {isOwner ? "Owner" : "Agente"}
                        </span>
                    </div>
                </div>
            </div>

            {agencyStatus === "approved" && (
                <div className="max-w-7xl mx-auto px-4 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                    <nav id="agent-tabs" className="flex gap-0 min-w-max border-t border-border/50 mt-1">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            const tabIdMap: Record<string, string> = {
                                listado: "agent-listado-tab",
                                estadisticas: "agent-estadisticas-tab",
                                indicadores: "agent-indicadores-tab",
                                qr_analytics: "agent-qr-leads-tab",
                                referencias: "agent-referencias-tab",
                            };
                            return (
                                <button
                                    key={tab.id}
                                    id={tabIdMap[tab.id]}
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

        <EditProfileModal isOpen={isEditProfileOpen} onClose={() => setIsEditProfileOpen(false)} />

        <Dialog open={agencyProfileOpen} onOpenChange={setAgencyProfileOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Perfil de agencia</DialogTitle>
                    <DialogDescription>Datos de tu agencia en la plataforma.</DialogDescription>
                </DialogHeader>
                {agency && (
                    <AgentProfile
                        agency={agency}
                        profileStatus={profileStatus}
                        onAgencyLogoUpdated={onAgencyLogoUpdated}
                    />
                )}
            </DialogContent>
        </Dialog>
        </>
    );
};
