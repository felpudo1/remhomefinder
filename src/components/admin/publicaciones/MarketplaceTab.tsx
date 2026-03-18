import { Loader2, ExternalLink, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TabsContent } from "@/components/ui/tabs";
import { PROPERTY_STATUS_LABELS, AGENT_PROPERTY_STATUSES } from "@/lib/constants";
import { DeletePropertyDialog } from "@/components/property/DeletePropertyDialog";
import { MarketplaceStatus, MktProperty } from "@/types/admin-publications";

interface MarketplaceTabProps {
    mktProps: MktProperty[];
    loadingMkt: boolean;
    updateMktStatus: (prop: MktProperty, newStatus: MarketplaceStatus) => void;
    deleteMktTarget: MktProperty | null;
    setDeleteMktTarget: (prop: MktProperty | null) => void;
    deleteMktProperty: (reason: string) => void;
}

export function MarketplaceTab({
    mktProps,
    loadingMkt,
    updateMktStatus,
    deleteMktTarget,
    setDeleteMktTarget,
    deleteMktProperty,
}: MarketplaceTabProps) {
    const getStatusOptions = (listingType: "rent" | "sale"): readonly string[] =>
        listingType === "sale" ? AGENT_PROPERTY_STATUSES.SALE : AGENT_PROPERTY_STATUSES.RENT;

    return (
        <TabsContent value="marketplace">
            <p className="text-sm text-muted-foreground mb-4">
                Publicaciones ingresadas por agentes al HFMarket. Desde aquí podés cambiar el estado o eliminarlas.
                El cambio de estado se propaga automáticamente a todos los usuarios que las guardaron.
            </p>

            {loadingMkt ? (
                <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            ) : mktProps.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No hay publicaciones del marketplace.</div>
            ) : (
                <div className="space-y-2">
                    <div className="hidden lg:block overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider max-w-[180px]">Título</th>
                                    <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[90px]">Ref.</th>
                                    <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[100px]">Organización</th>
                                    <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[90px]">Ingresado por</th>
                                    <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[70px]">Op.</th>
                                    <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[140px]">Estado</th>
                                    <th className="w-10 px-2"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {mktProps.map(prop => (
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
                                        <td className="px-4 py-3 text-xs text-muted-foreground max-w-[100px] truncate" title={prop.orgName}>{prop.orgName}</td>
                                        <td className="px-4 py-3 text-xs text-muted-foreground max-w-[90px] truncate" title={prop.publishedByName}>{prop.publishedByName ?? "—"}</td>
                                        <td className="px-4 py-3">
                                            <Badge variant={prop.listing_type === "sale" ? "default" : "secondary"} className="text-xs">
                                                {prop.listing_type === "sale" ? "Venta" : "Alquiler"}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Select value={prop.status} onValueChange={(v) => updateMktStatus(prop, v as MarketplaceStatus)}>
                                                <SelectTrigger className="h-8 rounded-xl text-xs w-[150px]"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    {getStatusOptions(prop.listing_type).map(s => (
                                                        <SelectItem key={s} value={s}>{PROPERTY_STATUS_LABELS[s] || s}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </td>
                                        <td className="px-2 py-3">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleteMktTarget(prop)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="lg:hidden space-y-3">
                        {mktProps.map(prop => (
                                <div key={prop.id} className="rounded-xl border border-border p-4 space-y-3 bg-card">
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
                                            <span className="text-xs text-muted-foreground block mt-0.5 truncate max-w-[200px]" title={prop.orgName}>{prop.orgName}</span>
                                            {prop.ref && <span className="text-xs text-muted-foreground block mt-0.5">Ref: {prop.ref}</span>}
                                            {prop.publishedByName && (
                                                <span className="text-xs text-muted-foreground block mt-0.5 truncate max-w-[200px]" title={prop.publishedByName}>Ingresado por: {prop.publishedByName}</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <Badge variant={prop.listing_type === "sale" ? "default" : "secondary"} className="text-xs">
                                                {prop.listing_type === "sale" ? "Venta" : "Alquiler"}
                                            </Badge>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setDeleteMktTarget(prop)}>
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                    <Select value={prop.status} onValueChange={(v) => updateMktStatus(prop, v as MarketplaceStatus)}>
                                        <SelectTrigger className="h-8 rounded-xl text-xs w-full"><SelectValue placeholder="Cambiar estado" /></SelectTrigger>
                                        <SelectContent>
                                            {getStatusOptions(prop.listing_type).map(s => (
                                                <SelectItem key={s} value={s}>{PROPERTY_STATUS_LABELS[s] || s}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                        ))}
                    </div>
                </div>
            )}
            <DeletePropertyDialog
                open={!!deleteMktTarget}
                onOpenChange={(open) => !open && setDeleteMktTarget(null)}
                onConfirm={deleteMktProperty}
                title={deleteMktTarget?.title || ""}
            />
        </TabsContent>
    );
}
