/**
 * ARCHIVO: admin-publications.ts
 * DESCRIPCIÓN: Definiciones de "planos" (interfaces) para los datos del admin.
 */
import { PropertyStatus, AgentPubStatus } from "./property";

export type MarketplaceStatus = AgentPubStatus;

export const MK_STATUS_COLORS: Record<MarketplaceStatus, string> = {
    disponible: "bg-emerald-100 text-emerald-700",
    pausado: "bg-amber-100 text-amber-700",
    reservado: "bg-blue-100 text-blue-700",
    vendido: "bg-gray-100 text-gray-600",
    alquilado: "bg-violet-100 text-violet-700",
    eliminado: "bg-red-100 text-red-700",
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
    property_id?: string;
    /** Referencia de la propiedad (ej: REF-12345) */
    ref?: string;
    orgName?: string;
    isAgency?: boolean;
}

export interface MktProperty {
    id: string;
    title: string;
    url: string;
    status: MarketplaceStatus;
    listing_type: "rent" | "sale";
    created_at: string;
    orgName?: string;
    /** Nombre del miembro de la agencia que ingresó la publicación */
    publishedByName?: string;
    /** Referencia de la publicación (ej: REF-12345) */
    ref?: string;
    /** ID de la property en la tabla properties (para borrar huérfanas) */
    property_id?: string;
}

/**
 * INTERFAZ: StatProperty
 * Es el molde final de una propiedad cuando está en la tabla de estadísticas.
 */
export interface StatProperty {
    id: string;
    title: string;
    creator: string; // Quién la puso (email o agencia)
    type: "user" | "agency";
    listing_type: "rent" | "sale";
    neighborhood: string;
    city: string;
    total_cost: number;
    sq_meters: number;
    rooms: number;
    status: string;
    average_rating: number; // Promedio de 1 a 5 estrellas
    total_votes: number; // Cuánta gente opinó (ratings)
    /** Usuarios distintos que guardaron esta publicación del marketplace en su listado */
    saves_count?: number;
    created_at: string;
    url: string;
    views_count?: number; // Cuántos clics recibió
    cr?: number; // Tasa de éxito (Conversion Rate)
    /** Motivos de descarte: atributo y cuántas veces fue seleccionado (ej: Precio: 5, Humedad: 3) */
    discardReasons?: { name: string; count: number }[];
    /** Cantidad de usuarios cuyos perfiles IA coinciden con esta propiedad */
    matchCount?: number;
    /** Lista de usuarios que coinciden (para mostrar al admin) */
    matches?: Array<{
        id: string;
        user_id: string;
        display_name?: string | null;
        phone?: string | null;
        is_private?: boolean | null;
    }>;
}
