import { Loader2, ExternalLink, Trash2, Eye, EyeOff, Building } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { TabsContent } from "@/components/ui/tabs";
import { useState } from "react";
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
    const [filterOwn, setFilterOwn] = useState(false);
    const [filterAgency, setFilterAgency] = useState(false);

    const filteredProps = userProps.filter(prop => {
        if (filterOwn && prop.source_marketplace_id) return false;
        if (filterAgency && !prop.isAgency) return false;
        return true;
    });

    return (
        <TabsContent value="usuarios">
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <p className="text-sm text-muted-foreground flex-1">
                    Propiedades guardadas por usuarios en su listado personal. Aquí conviven las que guardan del market y las que crean ellos mismos.
                </p>
                <div className="flex flex-col gap-2 shrink-0 bg-muted/30 p-3 rounded-xl border border-border/50">
                    <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                        <Checkbox checked={filterOwn} onCheckedChange={(c) => setFilterOwn(!!c)} />
                        Solo creadas por ellos <span className="text-xs text-muted-foreground font-normal">(oculta las del market)</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                        <Checkbox checked={filterAgency} onCheckedChange={(c) => setFilterAgency(!!c)} />
                        Solo de Agencias <span className="text-xs text-muted-foreground font-normal">(oculta familias comunes)</span>
                    </label>
                </div>
            </div>

            {loadingUser ? (
                <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            ) : filteredProps.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No hay propiedades que coincidan con los filtros.</div>
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
                                {filteredProps.map(prop => {
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
                                            <td className="px-4 py-3 text-xs max-w-[150px]">
                                                <div className="flex flex-col gap-1">
                                                    <span className="truncate text-foreground font-medium" title={prop.created_by_email}>
                                                        {prop.created_by_email || "—"}
                                                    </span>
                                                    {prop.isAgency && (
                                                        <Badge variant="outline" className="w-fit text-[10px] gap-1 px-1.5 py-0 border-primary/20 bg-primary/5 text-primary">
                                                            <Building className="w-3 h-3" />
                                                            <span className="truncate max-w-[100px]" title={prop.orgName}>{prop.orgName}</span>
                                                        </Badge>
                                                    )}
                                                </div>
                                            </td>
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
                        {filteredProps.map(prop => {
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
                                            <span className="text-xs text-foreground font-medium block mt-1 truncate max-w-[200px]" title={prop.created_by_email}>
                                                {prop.created_by_email || "—"}
                                            </span>
                                            {prop.isAgency && (
                                                <Badge variant="outline" className="w-fit text-[10px] gap-1 px-1.5 py-0 mt-1 border-primary/20 bg-primary/5 text-primary">
                                                    <Building className="w-3 h-3" />
                                                    <span className="truncate max-w-[140px]" title={prop.orgName}>{prop.orgName}</span>
                                                </Badge>
                                            )}
                                            {prop.ref && <span className="text-xs text-muted-foreground block mt-1">Ref: {prop.ref}</span>}
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
