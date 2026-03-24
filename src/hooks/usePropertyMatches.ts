import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TableRow } from "@/types/supabase";

export type SearchProfile = TableRow<"user_search_profiles">;
export type PropertyWithLocation = {
  listing_type: "rent" | "sale";
  currency?: string | null;
  total_cost?: number | null;
  price_amount?: number | null;
  price_expenses?: number | null;
  rooms?: number | null;
  city_id?: string | null;
  neighborhood_id?: string | null;
};

export interface MatchResult {
  id: string;
  user_id: string;
  operation?: string | null;
  currency?: string | null;
  min_budget?: number | null;
  max_budget?: number | null;
  min_bedrooms?: number | null;
  city_id?: string | null;
  neighborhood_ids?: string[] | null;
  is_private?: boolean | null;
  display_name?: string | null;
  phone?: string | null;
}

/**
 * Función pura que calcula los matches entre una propiedad y los perfiles de búsqueda.
 * No tiene efectos secundarios, fácil de testear.
 * 
 * @param property - La propiedad para calcular matches
 * @param searchProfiles - Perfiles de búsqueda
 * @param includePrivate - Si true, incluye perfiles privados (solo para admin)
 */
export function calculateMatches(
  property: PropertyWithLocation,
  searchProfiles: SearchProfile[],
  includePrivate: boolean = false
): MatchResult[] {
  return searchProfiles.filter((s): s is SearchProfile & { user_id: string } => {
    if (!s.user_id) return false;

    // Si el perfil es privado y NO es admin, no es match
    if (s.is_private && !includePrivate) return false;

    const opMatch = property.listing_type === "sale" ? "Comprar" : "Alquilar";

    // Operación
    const normalizedProfileOperation = String(s.operation || "").trim().toLowerCase();
    const normalizedExpectedOperation = opMatch.trim().toLowerCase();
    const opOk = normalizedProfileOperation === normalizedExpectedOperation;

    // Moneda: U$S modal vs USD en DB, y $ en modal vs ARS/UYU en DB
    const normalizedProfileCurrency = String(s.currency || "").trim().toUpperCase();
    const normalizedPropCurrency = String(property.currency || "").trim().toUpperCase();
    const isDollarProfile = normalizedProfileCurrency === "U$S" || normalizedProfileCurrency === "USD";
    const isDollarProp = normalizedPropCurrency === "USD" || normalizedPropCurrency === "U$S";
    const isPesosProfile = normalizedProfileCurrency === "$" || normalizedProfileCurrency === "ARS" || normalizedProfileCurrency === "UYU";
    const isPesosProp = normalizedPropCurrency === "ARS" || normalizedPropCurrency === "UYU" || normalizedPropCurrency === "$";
    const curOk = (isDollarProfile && isDollarProp) || (isPesosProfile && isPesosProp);

    // Precio: Rango completo (min y max)
    const rawTotal = Number(property.total_cost || 0);
    const rawRent = Number(property.price_amount || 0);
    const rawExp = Number(property.price_expenses || 0);
    const propPrice = rawTotal > 0 ? rawTotal : (rawRent + rawExp > 0 ? rawRent + rawExp : rawRent);

    const hasPropPrice = propPrice > 0;
    const priceMaxOk = (Number(s.max_budget || 0) > 0 && hasPropPrice) ? propPrice <= Number(s.max_budget) : true;
    const priceMinOk = (Number(s.min_budget || 0) > 0 && hasPropPrice) ? propPrice >= Number(s.min_budget) : true;
    const priceOk = priceMaxOk && priceMinOk;

    // Ambientes vs Dormitorios
    const propRooms = Number(property.rooms || 0);
    const userDorms = Number(s.min_bedrooms || 1);
    const roomsOk = propRooms >= userDorms;

    // Geografía
    let geoOk = true;
    const pCityId = property.city_id;
    const pNeighId = property.neighborhood_id;

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

    return opOk && curOk && priceOk && roomsOk && geoOk;
  }).map((s) => ({
    id: s.id,
    user_id: s.user_id,
    operation: s.operation,
    currency: s.currency,
    min_budget: s.min_budget,
    max_budget: s.max_budget,
    min_bedrooms: s.min_bedrooms,
    city_id: s.city_id,
    neighborhood_ids: s.neighborhood_ids,
    is_private: s.is_private,
    display_name: (s as any).display_name,
    phone: (s as any).phone,
  }));
}

/**
 * Hook para agentes y usuarios: solo trae perfiles PÚBLICOS (is_private = false)
 */
export function usePropertyMatches(property: PropertyWithLocation | null) {
  const { data: searchProfiles = [], isLoading } = useQuery({
    queryKey: ["search-profiles-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_search_profiles")
        .select("*")
        .eq("is_private", false);
      
      if (error) {
        console.error("Error fetching search profiles:", error);
        return [];
      }

      // Obtener datos de contacto de los perfiles
      const userIds = [...new Set((data || []).map((p) => p.user_id).filter(Boolean))];
      if (userIds.length === 0) return data || [];

      const { data: contactsData } = await supabase
        .rpc("get_search_profile_contacts", { _user_ids: userIds });

      if (contactsData) {
        const contactByUserId = contactsData.reduce<Record<string, { display_name?: string | null; phone?: string | null }>>((acc, contact: any) => {
          acc[contact.user_id] = { display_name: contact.display_name, phone: contact.phone };
          return acc;
        }, {});

        return (data || []).map((profile) => ({
          ...profile,
          display_name: contactByUserId[profile.user_id]?.display_name,
          phone: contactByUserId[profile.user_id]?.phone,
        }));
      }

      return data || [];
    },
  });

  const matches = calculateMatches(property || {}, searchProfiles);

  return { matches, isLoading };
}

/**
 * Hook para ADMIN: trae TODOS los perfiles (incluidos los privados)
 * Solo el admin debería usar este hook.
 */
export function useAdminPropertyMatches(property: PropertyWithLocation | null) {
  const { data: searchProfiles = [], isLoading } = useQuery({
    queryKey: ["search-profiles-all"],
    queryFn: async () => {
      // Admin puede ver todo
      const { data, error } = await supabase
        .from("user_search_profiles")
        .select("*");
      
      if (error) {
        console.error("Error fetching all search profiles:", error);
        return [];
      }

      // Obtener datos de contacto de los perfiles
      const userIds = [...new Set((data || []).map((p) => p.user_id).filter(Boolean))];
      if (userIds.length === 0) return data || [];

      const { data: contactsData } = await supabase
        .rpc("get_search_profile_contacts", { _user_ids: userIds });

      if (contactsData) {
        const contactByUserId = contactsData.reduce<Record<string, { display_name?: string | null; phone?: string | null }>>((acc, contact: any) => {
          acc[contact.user_id] = { display_name: contact.display_name, phone: contact.phone };
          return acc;
        }, {});

        return (data || []).map((profile) => ({
          ...profile,
          display_name: contactByUserId[profile.user_id]?.display_name,
          phone: contactByUserId[profile.user_id]?.phone,
        }));
      }

      return data || [];
    },
  });

  const matches = calculateMatches(property || {}, searchProfiles);

  return { matches, isLoading };
}
