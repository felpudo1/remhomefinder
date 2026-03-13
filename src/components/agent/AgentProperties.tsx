import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Home, Plus, Loader2, MapPin, Maximize2, BedDouble, Edit, ChevronDown, Check, Users, Share2, X } from "lucide-react";
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
import { useAgencySharedProperties } from "@/hooks/useAgencySharedProperties";
import { PremiumWelcomeModal } from "@/components/PremiumWelcomeModal";

interface AgentPropertiesProps {
    agency: Agency;
    profileStatus?: string;
    activeGroupId?: string | null;
}

export const AgentProperties = ({ agency, profileStatus, activeGroupId }: AgentPropertiesProps) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { canAgentPublishMore, maxAgentPublishes, isPremium } = useSubscription();

    const [publishOpen, setPublishOpen] = useState(false);
    const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
    const [propertyToEdit, setPropertyToEdit] = useState<any>(null);
    const [selectedProperty, setSelectedProperty] = useState<MarketplaceProperty | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [galleryImages, setGalleryImages] = useState<string[]>([]);
    const [galleryIndex, setGalleryIndex] = useState(0);
    const [isPremiumWelcomeOpen, setIsPremiumWelcomeOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const isActive = profileStatus === "active";

    // Bienvenida Premium para el Agente (REGLA 2: Validación estricta)
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

    const { data: agencyProperties = [], isLoading: propsLoading } = useQuery({
        queryKey: ["agency-marketplace-properties", agency.id, activeGroupId],
        enabled: isActive,
        queryFn: async () => {
            // Si hay un grupo activo, traemos las propiedades de ESE grupo (colaboración equipo)
            if (activeGroupId) {
                const { data, error } = await supabase
                    .from("properties")
                    .select("*")
                    .eq("group_id", activeGroupId)
                    .order("created_at", { ascending: false });

                if (error) throw error;
                return (data || []).map((p: any): MarketplaceProperty => ({
                    id: p.id,
                    agencyId: "", // Es propiedad de equipo, no necesariamente de agencia
                    agencyName: "Propiedad de Equipo",
                    agentId: p.user_id,
                    title: p.title,
                    description: p.ai_summary || p.details || "",
                    url: p.url,
                    priceRent: Number(p.price_rent),
                    priceExpenses: Number(p.price_expenses),
                    totalCost: Number(p.total_cost),
                    currency: p.currency,
                    neighborhood: p.neighborhood,
                    city: p.city || "",
                    sqMeters: Number(p.sq_meters),
                    rooms: p.rooms,
                    images: p.images || [],
                    status: "active" as any, // Mapeo simple para la vista
                    listingType: p.listing_type || "rent",
                    createdAt: new Date(p.created_at),
                    updatedAt: new Date(p.updated_at),
                }));
            }

            // Si NO hay grupo activo, mostramos las de la AGENCIA (comportamiento normal)
            const { data, error } = await supabase
                .from("marketplace_properties")
                .select("*")
                .eq("agency_id", agency.id)
                .order("created_at", { ascending: false });
            if (error) throw error;
            if (!data) return [];
            return data.map((p: any): MarketplaceProperty => ({
                id: p.id,
                agencyId: p.agency_id,
                agencyName: agency.name,
                agentId: agency.created_by,
                title: p.title,
                description: p.description,
                url: p.url,
                priceRent: Number(p.price_rent),
                priceExpenses: Number(p.price_expenses),
                totalCost: Number(p.total_cost),
                currency: p.currency,
                neighborhood: p.neighborhood,
                city: p.city || "",
                sqMeters: Number(p.sq_meters),
                rooms: p.rooms,
                images: p.images || [],
                status: p.status,
                listingType: p.listing_type || "rent",
                createdAt: new Date(p.created_at),
                updatedAt: new Date(p.updated_at),
            }));
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

    const { data: referralCount = 0 } = useQuery({
        queryKey: ["agency-referral-count", agency.created_by],
        enabled: !!agency.created_by,
        queryFn: async () => {
            const { count, error } = await supabase
                .from("profiles")
                .select("*", { count: "exact", head: true })
                .eq("referred_by_id", agency.created_by);
            if (error) throw error;
            return count || 0;
        },
    });

    const copyToClipboard = async () => {
        const link = `${window.location.origin}/?ref=${agency.created_by}`;
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(link);
            } else {
                const textArea = document.createElement("textarea");
                textArea.value = link;
                textArea.style.position = "fixed";
                textArea.style.left = "-9999px";
                textArea.style.top = "0";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                textArea.remove();
            }
            setCopied(true);
            toast({
                title: "¡Link copiado! 🔗",
                description: "Ya podés pegarlo donde quieras.",
            });
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Error al copiar:', err);
            toast({
                title: "Error al copiar",
                description: "Por favor, copialo manualmente.",
                variant: "destructive",
            });
        }
    };

    const handleChangeStatus = async (id: string, newStatus: string) => {
        const { error } = await supabase.from("marketplace_properties").update({ status: newStatus as any }).eq("id", id);
        if (error) { toast({ title: "Error al actualizar estado", description: error.message, variant: "destructive" }); }
        else {
            toast({ title: "Estado actualizado", description: `La propiedad ahora está ${PROPERTY_STATUS_LABELS[newStatus]}` });
            queryClient.invalidateQueries({ queryKey: ["agency-marketplace-properties"] });
        }
    };


    if (!isActive) return null;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Home className="w-5 h-5" /> Mis Propiedades ({agencyProperties.length})
                </h3>
                <Button size="sm" className="gap-1.5" onClick={handleOpenPublish}>
                    <Plus className="w-4 h-4" /> Publicar propiedad
                </Button>
            </div>

            {/* Sección: Invitación de Clientes (Referidos) - Simplificada (REGLA 3) */}
            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-5 space-y-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <p className="font-bold text-sm text-foreground leading-tight">Invita clientes y obten beneficios</p>
                        <div 
                            className="px-2 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm cursor-help animate-in fade-in zoom-in"
                            title="Clientes referenciados"
                        >
                            {referralCount} referidos
                        </div>
                    </div>
                </div>
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl gap-2 h-10 transition-all hover:scale-[1.02] flex-1 sm:flex-none"
                            onClick={copyToClipboard}
                        >
                            {copied ? (
                                <>
                                    <Check className="w-4 h-4" /> Copiado
                                </>
                            ) : (
                                <>
                                    <Edit className="w-4 h-4" /> Copiar Link
                                </>
                            )}
                        </Button>
                        <Button
                            variant="default"
                            size="sm"
                            className="rounded-xl gap-2 h-10 bg-[#25D366] hover:bg-[#20ba5a] text-white border-none shadow-sm transition-all hover:scale-[1.02] flex-1 sm:flex-none"
                            onClick={() => {
                                const link = `${window.location.origin}/?ref=${agency.created_by}`;
                                const text = encodeURIComponent(`¡Hola! Te invito a ver mis propiedades destacadas en HomeFinder: ${link}`);
                                window.open(`https://wa.me/?text=${text}`, '_blank');
                            }}
                        >
                            <Users className="w-4 h-4" /> WhatsApp
                        </Button>
                    </div>
                </div>
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
                                priceRent={p.priceRent}
                                priceExpenses={p.priceExpenses}
                                totalCost={p.totalCost}
                                currency={p.currency}
                                sqMeters={p.sqMeters}
                                rooms={p.rooms}
                                images={p.images}
                                listingType={p.listingType}
                                onClick={() => {
                                    setSelectedProperty(p);
                                    setIsDetailOpen(true);
                                }}
                                onImageClick={(index) => {
                                    setGalleryImages(p.images);
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

            <MarketplacePropertyDetailModal
                property={selectedProperty}
                open={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
            />

            <FullScreenGallery
                images={galleryImages}
                isOpen={isGalleryOpen}
                initialIndex={galleryIndex}
                onClose={() => setIsGalleryOpen(false)}
            />

            <UpgradePlanModal
                open={isUpgradeOpen}
                onClose={() => setIsUpgradeOpen(false)}
                limit={maxAgentPublishes}
                type="agent"
            />

            <PremiumWelcomeModal
                open={isPremiumWelcomeOpen}
                onClose={() => setIsPremiumWelcomeOpen(false)}
                type="agent"
            />
        </div>
    );
};
