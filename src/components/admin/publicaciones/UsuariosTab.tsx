import { Loader2, ExternalLink, Trash2, Eye, EyeOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TabsContent } from "@/components/ui/tabs";
import { DeletePropertyDialog } from "@/components/property/DeletePropertyDialog";
import { UserProperty } from "@/types/admin-publications";
import { STATUS_CONFIG } from "@/types/property";

interface UsuariosTabProps {
    userProps: UserProperty[];
    loadingUser: boolean;
    toggleHideUserProperty: (prop: UserProperty) => void;
    deleteUserTarget: UserProperty | null;
    setDeleteUserTarget: (prop: UserProperty | null) => void;
    deleteUserProperty: (reason: string) => void;
}

export function UsuariosTab({
    userProps,
    loadingUser,
    toggleHideUserProperty,
    deleteUserTarget,
    setDeleteUserTarget,
    deleteUserProperty,
}: UsuariosTabProps) {
    return (
        <TabsContent value="usuarios">
            <p className="text-sm text-muted-foreground mb-4">
                Propiedades guardadas por usuarios en su listado de búsqueda personal.
                El estado mostrado es el estado personal del usuario en su flujo de búsqueda.
            </p>

            {loadingUser ? (
                <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            ) : userProps.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No hay propiedades guardadas por usuarios.</div>
            ) : (
                <div className="space-y-2">
                    <div className="hidden lg:block overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider max-w-[180px]">Título</th>
                                    <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[90px]">Ref.</th>
                                    <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[100px]">Usuario</th>
                                    <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[70px]">Op.</th>
                                    <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[120px]">Estado</th>
                                    <th className="w-20 px-2"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {userProps.map(prop => {
                                    const cfg = STATUS_CONFIG[prop.status];
                                    return (
                                        <tr key={prop.id} className="rounded-xl hover:bg-muted/50 transition-colors">
                                            <td className="px-4 py-3 text-sm max-w-[180px]">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className="truncate font-medium block" title={prop.title}>{prop.title}</span>
                                                    {prop.url && (
                                                        <a href={prop.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-primary hover:text-primary/80">
                                                            <ExternalLink className="w-3.5 h-3.5" />
                                                        </a>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-muted-foreground max-w-[90px] truncate" title={prop.ref}>{prop.ref || "—"}</td>
                                            <td className="px-4 py-3 text-xs text-muted-foreground max-w-[100px] truncate" title={prop.created_by_email}>{prop.created_by_email || "—"}</td>
                                            <td className="px-4 py-3">
                                                <Badge variant={prop.listing_type === "sale" ? "default" : "secondary"} className="text-xs">
                                                    {prop.listing_type === "sale" ? "Venta" : "Alquiler"}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                {cfg ? (
                                                    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.color}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                                        {cfg.label}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">—</span>
                                                )}
                                            </td>
                                            <td className="px-2 py-3">
                                                <div className="flex items-center gap-0">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        title={prop.admin_hidden ? "Restaurar propiedad" : "Ocultar al usuario"}
                                                        onClick={() => toggleHideUserProperty(prop)}
                                                    >
                                                        {prop.admin_hidden
                                                            ? <EyeOff className="w-4 h-4 text-red-500" />
                                                            : <Eye className="w-4 h-4 text-emerald-500" />}
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleteUserTarget(prop)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="lg:hidden space-y-3">
                        {userProps.map(prop => {
                            const cfg = STATUS_CONFIG[prop.status];
                            return (
                                <div key={prop.id} className="rounded-xl border border-border p-4 space-y-2 bg-card">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium truncate max-w-[200px]" title={prop.title}>{prop.title}</span>
                                                {prop.url && (
                                                    <a href={prop.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-primary">
                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                    </a>
                                                )}
                                            </div>
                                            <span className="text-xs text-muted-foreground block mt-0.5 truncate max-w-[200px]" title={prop.created_by_email}>{prop.created_by_email || "—"}</span>
                                            {prop.ref && <span className="text-xs text-muted-foreground block mt-0.5">Ref: {prop.ref}</span>}
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <Badge variant={prop.listing_type === "sale" ? "default" : "secondary"} className="text-xs">
                                                {prop.listing_type === "sale" ? "Venta" : "Alquiler"}
                                            </Badge>
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleHideUserProperty(prop)}>
                                                {prop.admin_hidden ? <EyeOff className="w-3.5 h-3.5 text-red-500" /> : <Eye className="w-3.5 h-3.5 text-emerald-500" />}
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setDeleteUserTarget(prop)}>
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                    {cfg && (
                                        <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.color}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                            {cfg.label}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
            <DeletePropertyDialog
                open={!!deleteUserTarget}
                onOpenChange={(open) => !open && setDeleteUserTarget(null)}
                onConfirm={deleteUserProperty}
                title={deleteUserTarget?.title || ""}
            />
        </TabsContent>
    );
}
