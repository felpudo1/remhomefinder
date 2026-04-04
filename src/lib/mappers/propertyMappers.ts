import { Property, PropertyStatus, MarketplacePropertyStatus, ListingType } from "@/types/property";

/**
 * Normaliza URLs de imágenes desde la DB.
 * - Sin fotos → array vacío (no se usan imágenes genéricas de casas).
 * - URLs http(s) se mantienen (scrape, OCR, links manuales).
 * - Referencias históricas a default-house-*.jpg se omiten (ya no se muestran casas genéricas).
 */
export function resolveImages(dbImages: string[] | null): string[] {
    if (!dbImages || dbImages.length === 0) {
        return [];
    }
    const out: string[] = [];
    for (const raw of dbImages) {
        if (raw == null) continue;
        const img = String(raw).trim();
        if (!img) continue;
        if (img.startsWith("http://") || img.startsWith("https://")) {
            out.push(img);
            continue;
        }
        if (/default-house-\d+\.jpg/i.test(img)) {
            continue;
        }
        out.push(img);
    }
    return out;
}

/**
 * Mapea datos combinados de user_listings + properties al modelo UI Property.
 * Este mapper se usa cuando ya se tienen los datos joinados.
 */
export function mapListingToProperty(
    listing: any,
    property: any,
    comments: any[] = []
): Property {
    return {
        id: listing.id,
        propertyId: property?.id || listing.property_id || listing.id,
        url: property?.source_url || "",
        title: property?.title || "Sin datos",
        priceRent: Number(property?.price_amount || 0),
        priceExpenses: Number(property?.price_expenses || 0),
        totalCost: Number(property?.total_cost || 0),
        currency: property?.currency || "USD",
        neighborhood: property?.neighborhood || "",
        city: property?.city || "",
        sqMeters: Number(property?.m2_total || 0),
        rooms: property?.rooms || 0,
        status: (listing.current_status as PropertyStatus) || "ingresado",
        images: resolveImages(property?.images as string[] | null),
        aiSummary: property?.details || "",
        createdByEmail: "",
        comments: comments.map((c) => ({
            id: c.id,
            author: c.author || "Anónimo",
            avatar: c.avatar || "",
            text: c.text || "",
            createdAt: new Date(c.created_at),
        })),
        createdAt: new Date(listing.created_at),
        deletedReason: "",
        deletedByEmail: "",
        discardedReason: "",
        discardedByEmail: "",
        statusChangedByEmail: "",
        statusChangedAt: listing.updated_at ? new Date(listing.updated_at) : null,
        groupId: listing.org_id || null,
        sourceMarketplaceId: listing.source_publication_id || null,
        listingType: (listing.listing_type as "rent" | "sale") || "rent",
        ref: property?.ref || "",
        details: property?.details || "",
        contactName: listing.contact_name || undefined,
        contactPhone: listing.contact_phone || undefined,
        contactSource: listing.contact_source || undefined,
    };
}

/**
 * @deprecated Use mapListingToProperty instead. Kept for backward compatibility.
 */
export function mapDbToProperty(db: any, comments: any[]): Property {
    return {
        id: db.id,
        propertyId: db.property_id || db.id,
        url: db.source_url || db.url || "",
        title: db.title,
        priceRent: Number(db.price_amount || db.price_rent || 0),
        priceExpenses: Number(db.price_expenses || 0),
        totalCost: Number(db.total_cost || 0),
        currency: db.currency || "USD",
        neighborhood: db.neighborhood || "",
        city: db.city || "",
        sqMeters: Number(db.m2_total || db.sq_meters || 0),
        rooms: db.rooms || 0,
        status: (db.status || "ingresado") as PropertyStatus,
        images: resolveImages(db.images as string[] | null),
        aiSummary: db.details || db.ai_summary || "",
        createdByEmail: db.created_by_email || "",
        comments: comments.map((c) => ({
            id: c.id,
            author: c.author || "Anónimo",
            avatar: c.avatar || "",
            text: c.text || "",
            createdAt: new Date(c.created_at),
        })),
        createdAt: new Date(db.created_at),
        deletedReason: db.deleted_reason || "",
        deletedByEmail: db.deleted_by_email || "",
        discardedReason: db.discarded_reason || "",
        discardedByEmail: db.discarded_by_email || "",
        statusChangedByEmail: db.status_changed_by_email || "",
        statusChangedAt: db.updated_at ? new Date(db.updated_at) : null,
        coordinatedDate: db.coordinated_date ? new Date(db.coordinated_date) : null,
        contactedName: db.contacted_name || "",
        groupId: db.group_id || db.org_id || null,
        sourceMarketplaceId: db.source_marketplace_id || db.source_publication_id || null,
        marketplaceStatus: db.marketplace_status as MarketplacePropertyStatus | null ?? null,
        listingType: (db.listing_type as ListingType) || "rent",
        ref: db.ref || "",
        details: db.details || "",
    };
}
