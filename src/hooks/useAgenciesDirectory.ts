import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/contexts/AuthProvider";
import { useSystemConfig } from "./useSystemConfig";

export interface DirectoryAgency {
  id: string;
  name: string;
  websiteUrl: string;
  departmentId: string | null;
  isFeatured: boolean;
  type: "organization" | "external";
  followerCount: number;
  isFavorite: boolean;
  address?: string;
  phone?: string;
  email?: string;
}

function normalizeDomain(url: string): string {
  if (!url) return "";
  try {
    let cleaned = url.trim().toLowerCase();
    if (!cleaned.startsWith("http")) cleaned = "https://" + cleaned;
    const u = new URL(cleaned);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/+$/, "").toLowerCase();
  }
}

export function useAgenciesDirectory() {
  const { user } = useCurrentUser();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const { value: maxFavoritesStr } = useSystemConfig("MAX_AGENCY_FAVORITES", "20");
  const maxFavorites = parseInt(maxFavoritesStr, 10) || 20;

  const { data: agencies = [], isLoading } = useQuery({
    queryKey: ["agencies-directory", userId],
    enabled: !!userId,
    queryFn: async (): Promise<DirectoryAgency[]> => {
      // Fetch all sources in parallel
      const [orgsRes, externalsRes, favoritesRes, followersRes] = await Promise.all([
        supabase
          .from("organizations")
          .select("id, name, website_url, type")
          .eq("type", "agency_team"),
        supabase
          .from("external_agencies" as any)
          .select("id, name, website_url, department_id, is_featured, address, phone, email"),
        supabase
          .from("user_agency_favorites" as any)
          .select("agency_id, agency_type")
          .eq("user_id", userId!),
        // Social proof: count user_listings per org via agent_publications
        supabase
          .from("agent_publications")
          .select("org_id")
          .neq("status", "eliminado"),
      ]);

      const orgs = (orgsRes.data || []) as any[];
      const externals = (externalsRes.data || []) as any[];
      const favorites = (favoritesRes.data || []) as any[];
      const pubs = (followersRes.data || []) as any[];

      // Build follower count map (org_id -> count of publications being followed)
      const pubCountMap: Record<string, number> = {};
      for (const p of pubs) {
        pubCountMap[p.org_id] = (pubCountMap[p.org_id] || 0) + 1;
      }

      const favSet = new Set(favorites.map((f: any) => `${f.agency_type}:${f.agency_id}`));

      // Build org domain set for dedup
      const orgDomains = new Set<string>();
      const orgItems: DirectoryAgency[] = [];
      for (const o of orgs) {
        const domain = normalizeDomain(o.website_url || "");
        if (domain) orgDomains.add(domain);
        orgItems.push({
          id: o.id,
          name: o.name,
          websiteUrl: o.website_url || "",
          departmentId: null,
          isFeatured: false,
          type: "organization",
          followerCount: pubCountMap[o.id] || 0,
          isFavorite: favSet.has(`organization:${o.id}`),
        });
      }

      // External agencies, deduped against orgs
      const extItems: DirectoryAgency[] = [];
      for (const e of externals) {
        const domain = normalizeDomain(e.website_url || "");
        if (domain && orgDomains.has(domain)) continue; // dedup
        extItems.push({
          id: e.id,
          name: e.name,
          websiteUrl: e.website_url || "",
          departmentId: e.department_id,
          isFeatured: e.is_featured,
          type: "external",
          followerCount: 0,
          isFavorite: favSet.has(`external:${e.id}`),
          address: e.address || "",
          phone: e.phone || "",
          email: e.email || "",
        });
      }

      const all = [...orgItems, ...extItems];
      // Sort: featured first, then name
      all.sort((a, b) => {
        if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
      return all;
    },
    staleTime: 2 * 60 * 1000,
  });

  const favoriteAgencies = agencies.filter((a) => a.isFavorite);
  const favoriteCount = favoriteAgencies.length;

  const toggleFavorite = useMutation({
    mutationFn: async ({ agencyId, agencyType, isFavorite }: { agencyId: string; agencyType: "organization" | "external"; isFavorite: boolean }) => {
      if (isFavorite) {
        // Remove
        const { error } = await (supabase as any)
          .from("user_agency_favorites")
          .delete()
          .eq("user_id", userId!)
          .eq("agency_id", agencyId)
          .eq("agency_type", agencyType);
        if (error) throw error;
      } else {
        // Add - check limit
        if (favoriteCount >= maxFavorites) {
          throw new Error(`Máximo de ${maxFavorites} agencias favoritas alcanzado.`);
        }
        const { error } = await (supabase as any)
          .from("user_agency_favorites")
          .insert({ user_id: userId, agency_id: agencyId, agency_type: agencyType });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agencies-directory"] });
    },
  });

  return {
    agencies,
    favoriteAgencies,
    isLoading,
    toggleFavorite,
    maxFavorites,
    favoriteCount,
  };
}
