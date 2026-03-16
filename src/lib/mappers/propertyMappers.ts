import { Property, PropertyStatus, PropertyComment, MarketplacePropertyStatus, ListingType } from "@/types/property";

import defaultHouse1 from "@/assets/default-house-1.jpg";
import defaultHouse2 from "@/assets/default-house-2.jpg";
import defaultHouse3 from "@/assets/default-house-3.jpg";
import defaultHouse4 from "@/assets/default-house-4.jpg";
import defaultHouse5 from "@/assets/default-house-5.jpg";

const DEFAULT_HOUSE_IMAGES = [defaultHouse1, defaultHouse2, defaultHouse3, defaultHouse4, defaultHouse5];

/**
 * Resuelve las imágenes de una propiedad, asignando una por defecto si no existen.
 */
export function resolveImages(dbImages: string[] | null): string[] {
    if (!dbImages || dbImages.length === 0) {
        return [DEFAULT_HOUSE_IMAGES[Math.floor(Math.random() * DEFAULT_HOUSE_IMAGES.length)]];
    }
    return dbImages.map((img) => {
        if (img.startsWith("http://") || img.startsWith("https://")) return img;
        const match = img.match(/default-house-(\d+)\.jpg/);
        if (match) {
            const idx = parseInt(match[1], 10) - 1;
            if (idx >= 0 && idx < DEFAULT_HOUSE_IMAGES.length) return DEFAULT_HOUSE_IMAGES[idx];
        }
        return img;
    });
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
    };
}

/**
 * @deprecated Use mapListingToProperty instead. Kept for backward compatibility.
 */
export function mapDbToProperty(db: any, comments: any[]): Property {
    return {
        id: db.id,
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
