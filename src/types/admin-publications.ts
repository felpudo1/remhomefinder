import { PropertyStatus } from "./property";

export type MarketplaceStatus = "active" | "paused" | "sold" | "reserved" | "rented" | "deleted";

export const MK_STATUS_COLORS: Record<MarketplaceStatus, string> = {
    active: "bg-emerald-100 text-emerald-700",
    paused: "bg-amber-100 text-amber-700",
    reserved: "bg-blue-100 text-blue-700",
    sold: "bg-gray-100 text-gray-600",
    rented: "bg-violet-100 text-violet-700",
    deleted: "bg-red-100 text-red-700",
};

export interface UserProperty {
    id: string;
    title: string;
    url: string;
    status: PropertyStatus;
    created_by_email: string;
    source_marketplace_id: string | null;
    listing_type: "rent" | "sale";
    created_at: string;
    admin_hidden: boolean;
}

export interface MktProperty {
    id: string;
    title: string;
    url: string;
    status: MarketplaceStatus;
    listing_type: "rent" | "sale";
    created_at: string;
    agency_name?: string;
}

export interface StatProperty {
    id: string;
    title: string;
    creator: string; // Email o Nombre de Agencia
    type: "user" | "agency";
    listing_type: "rent" | "sale";
    neighborhood: string;
    city: string;
    total_cost: number;
    sq_meters: number;
    rooms: number;
    status: string;
    average_rating: number;
    total_votes: number;
    created_at: string;
    url: string;
    views_count?: number;
    cr?: number;
}
