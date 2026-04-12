import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Home, Plus, Loader2, Edit, ChevronDown, Check, RefreshCw, Sparkles, QrCode, Globe } from "lucide-react";
import { useImportActions } from "@/store/useImportStore";
import { QRCodeModal } from "@/components/marketplace/QRCodeModal";
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
import { resolveImages } from "@/lib/mappers/propertyMappers";
import type { AgentPubStatus, TableRow } from "@/types/supabase";
import { MatchLeadsList } from "./MatchLeadsList";

type SearchProfile = TableRow<"user_search_profiles">;
type LeadProfileContact = Pick<TableRow<"profiles">, "user_id" | "display_name" | "phone">;
type SearchProfileWithLead = SearchProfile & { leadProfile?: LeadProfileContact };

interface AgentPropertiesProps {
    agency: Agency;
    profileStatus?: string;
    activeGroupId?: string | null;
}

export const AgentProperties = ({ agency, profileStatus }: AgentPropertiesProps) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { openModal: openImporter } = useImportActions();
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
    const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);
    const [qrProperty, setQrProperty] = useState<{ id: string; propertyId: string; title: string; publishedBy: string } | null>(null);

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

    // Nuevo: Fetch para perfiles de bÃºsqueda de usuarios (Matchmaking)
    const { data: searchProfiles = [], isFetched: searchProfilesFetched } = useQuery<SearchProfileWithLead[]>({
        queryKey: ["all-user-search-profiles"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("user_search_profiles")
                .select("id, user_id, operation, currency, min_budget, max_budget, min_bedrooms, city_id, neighborhood_ids, is_private, updated_at, created_at");
            if (error) {
                console.error("ðŸ”´ AI MATCHMAKER: Error de Supabase (RLS):", error);
                throw error;
            }

            const baseProfiles = (data || []) as SearchProfile[];
            const userIds = [...new Set(baseProfiles.map((profile) => profile.user_id).filter(Boolean))];

            let contactByUserId: Record<string, LeadProfileContact> = {};
            if (userIds.length > 0) {
                const { data: contactsData, error: contactsError } = await supabase
                    .rpc("get_search_profile_contacts", { _user_ids: userIds });

                if (contactsError) {
                    console.warn("ðŸŸ  AI MATCHMAKER: No se pudieron cargar datos de contacto de perfiles:", contactsError.message);
                } else {
                    contactByUserId = (contactsData || []).reduce<Record<string, LeadProfileContact>>((acc, contact: any) => {
                        acc[contact.user_id] = { user_id: contact.user_id, display_name: contact.display_name, phone: contact.phone };
                        return acc;
                    }, {});
                }
            }

            const enrichedProfiles: SearchProfileWithLead[] = baseProfiles.map((profile) => ({
                ...profile,
                leadProfile: contactByUserId[profile.user_id],
            }));

            console.log("ðŸ”µ AI MATCHMAKER: Perfiles obtenidos de Supabase:", enrichedProfiles);
            return enrichedProfiles;
        },
        enabled: isActive,
    });

    const searchProfilesSignature = searchProfiles
        .map((profile) => `${profile.id}:${profile.updated_at}`)
        .sort()
        .join("|");

    const { data: agencyProperties = [], isLoading: propsLoading, refetch: refetchProperties, isFetching: isRefreshing } = useQuery({
        queryKey: ["agency-marketplace-properties", agency.id, searchProfilesSignature],
        enabled: isActive && searchProfilesFetched,
        queryFn: async () => {
            const { data, error } = await supabase
                .from("agent_publications")
                // Proyectar columnas especÃ­ficas â€” excluye raw_ai_data y status_history (~50 KB/fila)
                .select(`
                    id, property_id, org_id, published_by, status, listing_type, description, created_at, updated_at,
                    properties (
                        id, title, source_url, price_amount, price_expenses, total_cost, currency,
                        neighborhood, neighborhood_id, city, city_id, department, department_id, address,
                        m2_total, rooms, images, ref, details
                    ),
                    organizations (name)
                `)
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

            return data.map((pub: any) => {
                const p = pub.properties || {};
                const listingType = pub.listing_type || "rent";
                const opMatch = listingType === 'sale' ? 'Comprar' : 'Alquilar';
                
                // Calcular MATCHES (Matchmaking IA)
                const matches = searchProfiles.filter((s) => {
                    if (s.is_private) return false;

                    const normalizedProfileOperation = String(s.operation || "").trim().toLowerCase();
                    const normalizedExpectedOperation = opMatch.trim().toLowerCase();
                    const opOk = normalizedProfileOperation === normalizedExpectedOperation;

                    // Moneda: U$S modal vs USD en DB, y $ en modal vs ARS/UYU en DB
                    const normalizedProfileCurrency = String(s.currency || "").trim().toUpperCase();
                    const normalizedPropCurrency = String(p.currency || "").trim().toUpperCase();
                    const isDollarProfile = normalizedProfileCurrency === "U$S" || normalizedProfileCurrency === "USD";
                    const isDollarProp = normalizedPropCurrency === "USD" || normalizedPropCurrency === "U$S";
                    const isPesosProfile = normalizedProfileCurrency === "$" || normalizedProfileCurrency === "ARS" || normalizedProfileCurrency === "UYU";
                    const isPesosProp = normalizedPropCurrency === "ARS" || normalizedPropCurrency === "UYU" || normalizedPropCurrency === "$";
                    const curOk = (isDollarProfile && isDollarProp) || (isPesosProfile && isPesosProp);

                    // Precio: Rango completo (min y max)
                    const rawTotal = Number(p.total_cost || 0);
                    const rawRent = Number(p.price_amount || 0);
                    const rawExp = Number(p.price_expenses || 0);
                    const propPrice = rawTotal > 0 ? rawTotal : (rawRent + rawExp > 0 ? rawRent + rawExp : rawRent);
                    
                    const hasPropPrice = propPrice > 0;
                    const priceMaxOk = (Number(s.max_budget || 0) > 0 && hasPropPrice) ? propPrice <= Number(s.max_budget) : true;
                    const priceMinOk = (Number(s.min_budget || 0) > 0 && hasPropPrice) ? propPrice >= Number(s.min_budget) : true;
                    const priceOk = priceMaxOk && priceMinOk;

                    // Ambientes vs Dormitorios
                    const propRooms = Number(p.rooms || 0);
                    const userDorms = Number(s.min_bedrooms || 1);
                    const roomsOk = propRooms >= userDorms;

                    // GeografÃ­a
                    let geoOk = true;
                    const pCityId = p.city_id;
                    const pNeighId = p.neighborhood_id;
                    
                    if (s.city_id) {
                        if (!pCityId) {
                            geoOk = false;
                        } else if (s.city_id !== pCityId) {
                            geoOk = false;
                        }
                        
                        if (geoOk && s.neighborhood_ids && s.neighborhood_ids.length > 0) {
                            if (pNeighId) {
                                geoOk = s.neighborhood_ids.includes(pNeighId);
                            } else {
                                geoOk = false;
                            }
                        }
                    }

                    const isMatch = priceOk && roomsOk && opOk && curOk && geoOk;
                    
                    if (searchProfiles.length > 0) {
                        console.log(`ðŸŸ¡ EVALUANDO PROPIEDAD: ${p.title}`, {
                            perfilUser: s,
                            propiedadValores: { operacion: opMatch, precio: propPrice, moneda: p.currency, ambientes: propRooms, cityId: p.city_id, neighId: p.neighborhood_id },
                            resultados: { opOk, curOk, priceOk, roomsOk, geoOk, isMatch }
                        });
                    }

                    return isMatch;
                });

                const result = {
                    id: pub.id,
                    propertyId: pub.property_id,
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
                    neighborhood_id: p.neighborhood_id || "",
                    city: p.city || "",
                    city_id: p.city_id || "",
                    department: p.department || "",
                    department_id: p.department_id || "",
                    address: p.address || "",
                    sqMeters: Number(p.m2_total || 0),
                    rooms: p.rooms || 0,
                    images: resolveImages(p.images || []),
                    status: pub.status,
                    listingType: pub.listing_type || "rent",
                    createdAt: new Date(pub.created_at),
                    updatedAt: new Date(pub.updated_at),
                    ref: p.ref || "",
                    details: p.details || "",
                    source_url: p.source_url || "",
                    publishedByName: pub.published_by ? publishedByMap[pub.published_by] : undefined,
                    matchCount: matches.length,
                    matches: matches,
                };
                return result;
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
        const { error } = await (supabase.from("agent_publications") as any).update({ status: newStatus as AgentPubStatus }).eq("id", id);
        if (error) { toast({ title: "Error al actualizar estado", description: error.message, variant: "destructive" }); }
        else {
            toast({ title: "Estado actualizado", description: `La propiedad ahora estÃ¡ ${PROPERTY_STATUS_LABELS[newStatus] || newStatus}` });
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
                <div className="flex gap-2">
                    <Button id="agent-import-web-btn" size="sm" variant="outline" className="gap-1.5" onClick={openImporter}>
                        <Globe className="w-4 h-4" /> Importar desde web
                    </Button>
                    <Button id="agent-publish-property-btn" size="sm" className="gap-1.5" onClick={handleOpenPublish}>
                        <Plus className="w-4 h-4" /> Publicar propiedad
                    </Button>
                </div>
            </div>

            {propsLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            ) : agencyProperties.length === 0 ? (
                <div className="border border-border rounded-2xl bg-card p-8 text-center bg-card/50">
                    <p className="text-muted-foreground text-sm">TodavÃ­a no publicaste ninguna propiedad. Â¡EmpezÃ¡ ahora!</p>
                </div>
            ) : (
                <div id="agent-properties-section" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                                subImageContent={
                                    p.matchCount > 0 ? (
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setExpandedMatchId(expandedMatchId === p.id ? null : p.id);
                                            }}
                                            className={`w-full border-b flex flex-row items-center justify-center gap-2 py-2 transition-all hover:bg-primary/25 ${
                                                expandedMatchId === p.id 
                                                    ? 'bg-primary/30 border-primary/40 text-primary-foreground font-black' 
                                                    : 'bg-primary/15 border-primary/20 text-primary'
                                            }`}
                                        >
                                            <Sparkles className={`w-4 h-4 ${expandedMatchId === p.id ? 'animate-none' : 'animate-pulse'}`} />
                                            <span className="text-xs font-bold uppercase tracking-wider">
                                                {p.matchCount} {p.matchCount === 1 ? 'Match de IA' : 'Matches de IA'}
                                            </span>
                                        </button>
                                    ) : undefined
                                }
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
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="gap-1 rounded-lg px-2 text-xs"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setQrProperty({ id: p.id, propertyId: p.propertyId, title: p.title, publishedBy: p.published_by });
                                            }}
                                            title="Generar QR"
                                        >
                                            <QrCode className="w-3.5 h-3.5" />
                                        </Button>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button size="sm" variant="outline" className="gap-1 rounded-lg text-xs flex-1">
                                                     {PROPERTY_STATUS_LABELS[p.status] || p.status} <ChevronDown className="w-3 h-3" />
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
                                bottomContent={
                                    expandedMatchId === p.id && (
                                        <MatchLeadsList matches={p.matches} />
                                    )
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
                onOpenExistingAgentPublication={async (publicationId) => {
                    let row = agencyProperties.find((p: any) => p.id === publicationId);
                    if (!row) {
                        const { data } = await refetchProperties();
                        row = (data as any[])?.find((p: any) => p.id === publicationId);
                    }
                    if (row) {
                        setPublishOpen(false);
                        setSelectedProperty(row);
                        setIsDetailOpen(true);
                    } else {
                        toast({
                            title: "No encontramos la publicaciÃ³n",
                            description: "RefrescÃ¡ el listado e intentÃ¡ de nuevo.",
                            variant: "destructive",
                        });
                    }
                }}
            />

            <MarketplacePropertyDetailModal
                property={selectedProperty}
                open={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                onEditPublication={(p) => {
                    setIsDetailOpen(false);
                    setPropertyToEdit(p);
                    setPublishOpen(true);
                }}
            />

            <FullScreenGallery
                images={galleryImages}
                initialIndex={galleryIndex}
                isOpen={isGalleryOpen}
                onClose={() => setIsGalleryOpen(false)}
            />

            {qrProperty && (
                <QRCodeModal
                    open={!!qrProperty}
                    onClose={() => setQrProperty(null)}
                    propertyTitle={qrProperty.title}
                    propertyId={qrProperty.propertyId}
                    publicationId={qrProperty.id}
                    publishedBy={qrProperty.publishedBy}
                />
            )}

            <UpgradePlanModal open={isUpgradeOpen} onClose={() => setIsUpgradeOpen(false)} limit={maxAgentPublishes} type="agent" />
            <PremiumWelcomeModal open={isPremiumWelcomeOpen} onClose={() => setIsPremiumWelcomeOpen(false)} />
        </div>
    );
};
