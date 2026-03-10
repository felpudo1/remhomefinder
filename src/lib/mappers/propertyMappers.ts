import { Property, PropertyStatus, PropertyComment, MarketplacePropertyStatus } from "@/types/property";
import { Database } from "@/integrations/supabase/types";

import defaultHouse1 from "@/assets/default-house-1.jpg";
import defaultHouse2 from "@/assets/default-house-2.jpg";
import defaultHouse3 from "@/assets/default-house-3.jpg";
import defaultHouse4 from "@/assets/default-house-4.jpg";
import defaultHouse5 from "@/assets/default-house-5.jpg";

const DEFAULT_HOUSE_IMAGES = [defaultHouse1, defaultHouse2, defaultHouse3, defaultHouse4, defaultHouse5];

type DbProperty = Database['public']['Tables']['properties']['Row'];
type DbComment = Database['public']['Tables']['property_comments']['Row'];

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
 * Mapea una propiedad de la base de datos al modelo de la UI.
 * Elimina la necesidad de 'as any' al usar tipos generados.
 */
export function mapDbToProperty(db: DbProperty, comments: DbComment[]): Property {
    return {
        id: db.id,
        url: db.url || "",
        title: db.title,
        priceRent: Number(db.price_rent),
        priceExpenses: Number(db.price_expenses),
        totalCost: Number(db.total_cost),
        currency: db.currency || "USD",
        neighborhood: db.neighborhood || "",
        city: (db as any).city || "",
        sqMeters: Number(db.sq_meters),
        rooms: db.rooms || 0,
        status: (db.status || "ingresado") as PropertyStatus,
        images: resolveImages(db.images as string[] | null),
        aiSummary: db.ai_summary || "",
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
        groupId: db.group_id || null,
        sourceMarketplaceId: db.source_marketplace_id || null,
        marketplaceStatus: (db as any).marketplace_status as MarketplacePropertyStatus | null ?? null,
        listingType: (db.listing_type as "rent" | "sale") || "rent",
        ref: (db as any).ref || "",
        details: (db as any).details || "",
    };
}
