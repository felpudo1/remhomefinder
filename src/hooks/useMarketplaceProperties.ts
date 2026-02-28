import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MarketplaceProperty } from "@/types/property";

import defaultHouse1 from "@/assets/default-house-1.jpg";
import defaultHouse2 from "@/assets/default-house-2.jpg";
import defaultHouse3 from "@/assets/default-house-3.jpg";
import defaultHouse4 from "@/assets/default-house-4.jpg";
import defaultHouse5 from "@/assets/default-house-5.jpg";

const DEFAULT_HOUSE_IMAGES = [defaultHouse1, defaultHouse2, defaultHouse3, defaultHouse4, defaultHouse5];

function resolveImages(dbImages: string[]): string[] {
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

export function useMarketplaceProperties() {
  return useQuery({
    queryKey: ["marketplace-properties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketplace_properties")
        .select("*, agencies(name)")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!data) return [];

      return data.map((p: any): MarketplaceProperty => ({
        id: p.id,
        agencyId: p.agency_id,
        agencyName: p.agencies?.name || "Agencia",
        title: p.title,
        description: p.description,
        url: p.url,
        priceRent: Number(p.price_rent),
        priceExpenses: Number(p.price_expenses),
        totalCost: Number(p.total_cost),
        currency: p.currency,
        neighborhood: p.neighborhood,
        sqMeters: Number(p.sq_meters),
        rooms: p.rooms,
        images: resolveImages(p.images),
        status: p.status,
        createdAt: new Date(p.created_at),
        updatedAt: new Date(p.updated_at),
      }));
    },
  });
}
