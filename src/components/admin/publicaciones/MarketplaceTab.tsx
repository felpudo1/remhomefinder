import { Loader2, ExternalLink, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TabsContent } from "@/components/ui/tabs";
import { PROPERTY_STATUS_LABELS, AGENT_PROPERTY_STATUSES } from "@/lib/constants";
import { DeletePropertyDialog } from "@/components/property/DeletePropertyDialog";
import { MarketplaceStatus, MK_STATUS_COLORS, MktProperty } from "@/types/admin-publications";

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
                    <div className="hidden lg:block">
                        <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                            <span>Título</span>
                            <span>Organización</span>
                            <span>Operación</span>
                            <span>Estado actual</span>
                            <span>Cambiar estado</span>
                            <span></span>
                        </div>
                        {mktProps.map(prop => {
                            const color = MK_STATUS_COLORS[prop.status] || "";
                            return (
                                <div key={prop.id} className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-4 py-3 rounded-xl hover:bg-muted/50 transition-colors items-center text-sm">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className="truncate font-medium">{prop.title}</span>
                                        {prop.url && (
                                            <a href={prop.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-primary hover:text-primary/80">
                                                <ExternalLink className="w-3.5 h-3.5" />
                                            </a>
                                        )}
                                    </div>
                                    <span className="text-xs text-muted-foreground min-w-[100px] truncate">{prop.orgName}</span>
                                    <Badge variant={prop.listing_type === "sale" ? "default" : "secondary"} className="text-xs">
                                        {prop.listing_type === "sale" ? "Venta" : "Alquiler"}
                                    </Badge>
                                    <span className={`inline-flex items-center text-xs px-2.5 py-0.5 rounded-full font-medium ${color}`}>
                                        {PROPERTY_STATUS_LABELS[prop.status as string] || prop.status}
                                    </span>
                                    <Select value={prop.status} onValueChange={(v) => updateMktStatus(prop, v as MarketplaceStatus)}>
                                        <SelectTrigger className="h-8 rounded-xl text-xs w-[150px]"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {getStatusOptions(prop.listing_type).map(s => (
                                                <SelectItem key={s} value={s}>{PROPERTY_STATUS_LABELS[s] || s}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleteMktTarget(prop)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            );
                        })}
                    </div>

                    <div className="lg:hidden space-y-3">
                        {mktProps.map(prop => {
                            const color = MK_STATUS_COLORS[prop.status] || "";
                            return (
                                <div key={prop.id} className="rounded-xl border border-border p-4 space-y-3 bg-card">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium truncate">{prop.title}</span>
                                                {prop.url && (
                                                    <a href={prop.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-primary">
                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                    </a>
                                                )}
                                            </div>
                                            <span className="text-xs text-muted-foreground block mt-0.5">{prop.orgName}</span>
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
                                    <span className={`inline-flex items-center text-xs px-2.5 py-0.5 rounded-full font-medium ${color}`}>
                                        {PROPERTY_STATUS_LABELS[prop.status as string] || prop.status}
                                    </span>
                                    <Select value={prop.status} onValueChange={(v) => updateMktStatus(prop, v as MarketplaceStatus)}>
                                        <SelectTrigger className="h-8 rounded-xl text-xs w-full"><SelectValue placeholder="Cambiar estado" /></SelectTrigger>
                                        <SelectContent>
                                            {getStatusOptions(prop.listing_type).map(s => (
                                                <SelectItem key={s} value={s}>{PROPERTY_STATUS_LABELS[s] || s}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            );
                        })}
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
