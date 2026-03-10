import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Home, Plus, Loader2, MapPin, Maximize2, BedDouble, Trash2, Edit, ChevronDown, Check } from "lucide-react";
import { currencySymbol } from "@/lib/currency";
import { PublishPropertyModal } from "@/components/PublishPropertyModal";
import { Agency } from "./AgentProfile";
import { AGENT_PROPERTY_STATUSES, PROPERTY_STATUS_LABELS } from "@/lib/constants";
import { PropertyCardBase } from "@/components/ui/PropertyCardBase";
import { FullScreenGallery } from "@/components/ui/FullScreenGallery";

interface AgentPropertiesProps {
    agency: Agency;
    profileStatus?: string;
}

export const AgentProperties = ({ agency, profileStatus }: AgentPropertiesProps) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [publishOpen, setPublishOpen] = useState(false);
    const [propertyToEdit, setPropertyToEdit] = useState<any>(null);
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [galleryImages, setGalleryImages] = useState<string[]>([]);
    const [galleryIndex, setGalleryIndex] = useState(0);

    const isActive = profileStatus === "active";

    const { data: agencyProperties = [], isLoading: propsLoading } = useQuery({
        queryKey: ["agency-marketplace-properties", agency.id],
        enabled: isActive,
        queryFn: async () => {
            const { data, error } = await supabase
                .from("marketplace_properties")
                .select("*")
                .eq("agency_id", agency.id)
                .order("created_at", { ascending: false });
            if (error) throw error;
            return data || [];
        },
    });

    const handleChangeStatus = async (id: string, newStatus: string) => {
        const { error } = await supabase.from("marketplace_properties").update({ status: newStatus as any }).eq("id", id);
        if (error) { toast({ title: "Error al actualizar estado", description: error.message, variant: "destructive" }); }
        else {
            toast({ title: "Estado actualizado", description: `La propiedad ahora está ${PROPERTY_STATUS_LABELS[newStatus]}` });
            queryClient.invalidateQueries({ queryKey: ["agency-marketplace-properties"] });
        }
    };

    const handleDelete = async (id: string) => {
        const { error } = await supabase.from("marketplace_properties").delete().eq("id", id);
        if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
        else { queryClient.invalidateQueries({ queryKey: ["agency-marketplace-properties"] }); toast({ title: "Eliminada" }); }
    };

    if (!isActive) return null;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Home className="w-5 h-5" /> Mis Propiedades ({agencyProperties.length})
                </h3>
                <Button size="sm" className="gap-1.5" onClick={() => { setPropertyToEdit(null); setPublishOpen(true); }}>
                    <Plus className="w-4 h-4" /> Publicar propiedad
                </Button>
            </div>

            {propsLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            ) : agencyProperties.length === 0 ? (
                <div className="border border-border rounded-2xl bg-card p-8 text-center bg-card/50">
                    <p className="text-muted-foreground text-sm">Todavía no publicaste ninguna propiedad. ¡Empezá ahora!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {agencyProperties.map((p: any) => {
                        const availableStatuses = p.listing_type === 'sale'
                            ? AGENT_PROPERTY_STATUSES.SALE
                            : AGENT_PROPERTY_STATUSES.RENT;

                        return (
                            <PropertyCardBase
                                key={p.id}
                                title={p.title}
                                neighborhood={p.neighborhood}
                                city={p.city}
                                priceRent={p.price_rent}
                                priceExpenses={p.price_expenses}
                                totalCost={p.total_cost}
                                currency={p.currency}
                                sqMeters={p.sq_meters}
                                rooms={p.rooms}
                                images={p.images || []}
                                listingType={p.listing_type}
                                onImageClick={(index) => {
                                    setGalleryImages(p.images || []);
                                    setGalleryIndex(index);
                                    setIsGalleryOpen(true);
                                }}
                                statusOverlay={
                                    <Badge variant="outline" className={`text-xs font-bold border-none ${p.status === 'active' ? 'bg-green-500/90 text-white' :
                                            p.status === 'paused' ? 'bg-yellow-500/90 text-white' :
                                                'bg-blue-600/90 text-white'
                                        }`}>
                                        {PROPERTY_STATUS_LABELS[p.status] || p.status}
                                    </Badge>
                                }
                                actions={
                                    <div className="flex gap-2 w-full">
                                        <Button size="sm" variant="outline" className="gap-1 rounded-lg text-xs flex-1" onClick={() => { setPropertyToEdit(p); setPublishOpen(true); }}>
                                            <Edit className="w-3 h-3" /> Editar
                                        </Button>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button size="sm" variant="outline" className="gap-1 rounded-lg text-xs flex-1">
                                                    Estado <ChevronDown className="w-3 h-3" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                {availableStatuses.map(status => (
                                                    <DropdownMenuItem
                                                        key={status}
                                                        onClick={() => handleChangeStatus(p.id, status)}
                                                        className={`text-xs flex items-center gap-2 ${p.status === status ? 'bg-muted font-medium' : ''}`}
                                                    >
                                                        {p.status === status && <Check className="w-3 h-3 text-primary" />}
                                                        {PROPERTY_STATUS_LABELS[status]}
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>

                                        <Button size="sm" variant="ghost" className="gap-1 rounded-lg text-xs text-destructive hover:text-destructive w-auto px-2" onClick={() => handleDelete(p.id)}>
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                }
                            />
                        )
                    })}
                </div>
            )}

            <PublishPropertyModal
                open={publishOpen}
                onClose={() => setPublishOpen(false)}
                agencyId={agency.id}
                onPublished={() => queryClient.invalidateQueries({ queryKey: ["agency-marketplace-properties"] })}
                propertyToEdit={propertyToEdit}
            />

            <FullScreenGallery
                images={galleryImages}
                isOpen={isGalleryOpen}
                initialIndex={galleryIndex}
                onClose={() => setIsGalleryOpen(false)}
            />
        </div>
    );
};
