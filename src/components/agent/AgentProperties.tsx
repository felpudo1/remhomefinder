import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Home, Plus, Loader2, Edit, ChevronDown, Check, RefreshCw } from "lucide-react";
import { currencySymbol } from "@/lib/currency";
import { PublishPropertyModal } from "@/components/PublishPropertyModal";
import { Agency } from "./AgentProfile";
import { AGENT_PROPERTY_STATUSES, PROPERTY_STATUS_LABELS } from "@/lib/constants";
import { PropertyCardBase } from "@/components/ui/PropertyCardBase";
import { FullScreenGallery } from "@/components/ui/FullScreenGallery";
import { MarketplacePropertyDetailModal } from "@/components/MarketplacePropertyDetailModal";
import { MarketplaceProperty } from "@/types/property";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradePlanModal } from "@/components/UpgradePlanModal";
import { PremiumWelcomeModal } from "@/components/PremiumWelcomeModal";
import { useGroups } from "@/hooks/useGroups";
import { resolveImages } from "@/lib/mappers/propertyMappers";
import type { AgentPubStatus } from "@/types/supabase";

interface AgentPropertiesProps {
    agency: Agency;
    profileStatus?: string;
    activeGroupId?: string | null;
}

export const AgentProperties = ({ agency, profileStatus, activeGroupId }: AgentPropertiesProps) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { canAgentPublishMore, maxAgentPublishes, isPremium } = useSubscription();
    const { groups } = useGroups();
    const [publishOpen, setPublishOpen] = useState(false);
    const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
    const [propertyToEdit, setPropertyToEdit] = useState<any>(null);
    const [selectedProperty, setSelectedProperty] = useState<MarketplaceProperty | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [galleryImages, setGalleryImages] = useState<string[]>([]);
    const [galleryIndex, setGalleryIndex] = useState(0);
    const [isPremiumWelcomeOpen, setIsPremiumWelcomeOpen] = useState(false);

    const isActive = profileStatus === "active";

    useEffect(() => {
        const userId = agency.created_by;
        if (isPremium && userId) {
            const key = `hf_premium_welcome_shown_${userId}`;
            if (localStorage.getItem(key) !== "true") {
                setIsPremiumWelcomeOpen(true);
                localStorage.setItem(key, "true");
            }
        }
    }, [isPremium, agency.created_by]);

    const { data: agencyProperties = [], isLoading: propsLoading, refetch: refetchProperties, isFetching: isRefreshing } = useQuery({
        queryKey: ["agency-marketplace-properties", agency.id],
        enabled: isActive,
        queryFn: async () => {
            const { data, error } = await supabase
                .from("agent_publications")
                .select("*, properties(*), organizations(name)")
                .eq("org_id", agency.id)
                .order("created_at", { ascending: false });
            if (error) throw error;
            if (!data) return [];

            const publisherIds = [...new Set((data || []).map((d: { published_by?: string }) => d.published_by).filter(Boolean))];
            let publishedByMap: Record<string, string> = {};
            if (publisherIds.length > 0) {
                const { data: profilesData } = await supabase
                    .from("profiles")
                    .select("user_id, display_name, email")
                    .in("user_id", publisherIds);
                profilesData?.forEach((pr) => {
                    publishedByMap[pr.user_id] = pr.display_name || pr.email || "Agente";
                });
            }

            return data.map((pub: any): MarketplaceProperty => {
                const p = pub.properties || {};
                return {
                    id: pub.id,
                    orgId: pub.org_id,
                    orgName: pub.organizations?.name || agency.name,
                    agentId: pub.published_by || agency.created_by,
                    title: p.title || "",
                    description: pub.description || "",
                    url: p.source_url || "",
                    priceRent: Number(p.price_amount || 0),
                    priceExpenses: Number(p.price_expenses || 0),
                    totalCost: Number(p.total_cost || 0),
                    currency: p.currency || "USD",
                    neighborhood: p.neighborhood || "",
                    city: p.city || "",
                    sqMeters: Number(p.m2_total || 0),
                    rooms: p.rooms || 0,
                    images: resolveImages(p.images || []),
                    status: pub.status,
                    listingType: pub.listing_type || "rent",
                    createdAt: new Date(pub.created_at),
                    updatedAt: new Date(pub.updated_at),
                    ref: p.ref || "",
                    publishedByName: pub.published_by ? publishedByMap[pub.published_by] : undefined,
                };
            });
        },
    });

    const handleOpenPublish = () => {
        if (!canAgentPublishMore(agencyProperties.length)) {
            setIsUpgradeOpen(true);
            return;
        }
        setPropertyToEdit(null);
        setPublishOpen(true);
    };

    const handleEdit = (prop: any) => {
        setPropertyToEdit(prop);
        setPublishOpen(true);
    };

    // Map agent_pub_status values for status changes
    const handleChangeStatus = async (id: string, newStatus: string) => {
        const { error } = await supabase.from("agent_publications").update({ status: newStatus as AgentPubStatus }).eq("id", id);
        if (error) { toast({ title: "Error al actualizar estado", description: error.message, variant: "destructive" }); }
        else {
            toast({ title: "Estado actualizado", description: `La propiedad ahora está ${PROPERTY_STATUS_LABELS[newStatus] || newStatus}` });
            queryClient.invalidateQueries({ queryKey: ["agency-marketplace-properties"] });
        }
    };

    if (!isActive) return null;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <Home className="w-5 h-5" /> Mis Propiedades ({agencyProperties.length})
                    </h3>
                    <button
                        type="button"
                        onClick={() => refetchProperties()}
                        disabled={isRefreshing || propsLoading}
                        className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground border border-border disabled:opacity-50"
                        title="Refrescar listado"
                    >
                        <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                    </button>
                </div>
                <Button size="sm" className="gap-1.5" onClick={handleOpenPublish}>
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
                        const availableStatuses = p.listingType === 'sale'
                            ? AGENT_PROPERTY_STATUSES.SALE
                            : AGENT_PROPERTY_STATUSES.RENT;

                        return (
                            <PropertyCardBase
                                key={p.id}
                                title={p.title}
                                neighborhood={p.neighborhood}
                                city={p.city}
                                priceRent={p.priceRent}
                                priceExpenses={p.priceExpenses}
                                totalCost={p.totalCost}
                                currency={p.currency}
                                sqMeters={p.sqMeters}
                                rooms={p.rooms}
                                images={p.images}
                                listingType={p.listingType}
                                collapsibleImages
                                refText={p.ref ?? ""}
                                onClick={() => { setSelectedProperty(p); setIsDetailOpen(true); }}
                                onImageClick={(index) => { setGalleryImages(p.images); setGalleryIndex(index); setIsGalleryOpen(true); }}
                                topOverlay={p.publishedByName ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/50 text-white backdrop-blur-md">
                                        Ingresado por {p.publishedByName}
                                    </span>
                                ) : undefined}
                                statusOverlay={
                                    <Badge variant="outline" className={`text-xs font-bold border-none ${
                                        p.status === 'disponible' ? 'bg-green-500/90 text-white' :
                                        p.status === 'pausado' ? 'bg-yellow-500/90 text-white' :
                                        'bg-blue-600/90 text-white'
                                    }`}>
                                        {PROPERTY_STATUS_LABELS[p.status] || p.status}
                                    </Badge>
                                }
                                actions={
                                    <div className="flex gap-2 w-full">
                                        <Button size="sm" variant="outline" className="gap-1 rounded-lg text-xs flex-1" onClick={() => handleEdit(p)}>
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
                                    </div>
                                }
                            />
                        );
                    })}
                </div>
            )}

            <PublishPropertyModal
                open={publishOpen}
                onClose={() => { setPublishOpen(false); setPropertyToEdit(null); }}
                orgId={agency.id}
                onPublished={() => queryClient.invalidateQueries({ queryKey: ["agency-marketplace-properties"] })}
                propertyToEdit={propertyToEdit}
            />

            <MarketplacePropertyDetailModal
                property={selectedProperty}
                open={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
            />

            <FullScreenGallery
                images={galleryImages}
                initialIndex={galleryIndex}
                isOpen={isGalleryOpen}
                onClose={() => setIsGalleryOpen(false)}
            />

            <UpgradePlanModal open={isUpgradeOpen} onClose={() => setIsUpgradeOpen(false)} limit={maxAgentPublishes} type="agent" />
            <PremiumWelcomeModal open={isPremiumWelcomeOpen} onClose={() => setIsPremiumWelcomeOpen(false)} />
        </div>
    );
};
