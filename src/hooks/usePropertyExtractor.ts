import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { checkUrlStatus } from "@/lib/duplicateCheck";
import { resolveGeoIds } from "@/lib/resolveGeoIds";
import { useCurrentUser } from "@/contexts/AuthProvider";

/** Genera un UUID compatible con contextos no seguros (HTTP en red local) */
function safeUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback para contextos no seguros
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function normalizeCurrency(value: unknown): "UYU" | "USD" | "UI" {
  if (value === "USD") return "USD";
  if (value === "UI") return "UI";
  return "UYU";
}

export type PropertyData = {
  title: string;
  priceRent: string;
  priceExpenses: string;
  currency: "UYU" | "USD";
  department: string;
  department_id: string;
  neighborhood: string;
  neighborhood_id: string;
  city: string;
  city_id: string;
  sqMeters: string;
  rooms: string;
  aiSummary: string;
  ref: string;
  details: string;
  listingType?: "rent" | "sale";
  images?: string[];
  contactName?: string;
  contactPhone?: string;
};

export function usePropertyExtractor() {
  const { user: authUser } = useCurrentUser();
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzingUnified, setIsAnalyzingUnified] = useState(false);
  const [isAnalyzingImages, setIsAnalyzingImages] = useState(false);

  /**
   * Scrapea una URL o verifica duplicados.
   */
  const handleScrape = async (
    url: string,
    selectedGroupId: string | null,
    scraper: "firecrawl" | "zenrows" = "firecrawl"
  ) => {
    if (!url.trim()) return null;

    setIsLoading(true);
    try {
      const orgId = selectedGroupId || null;
      const result = await checkUrlStatus(url.trim(), orgId);

      if (result.case !== "none") {
        setIsLoading(false);
        return { duplicateResult: result };
      }

      const { data, error } = await supabase.functions.invoke("scrape-property", {
        body: { url: url.trim(), scraper, role: "user" },
      });

      if (error || !data?.success) {
        let errorMsg = "No pudimos extraer datos automáticamente. Completá los datos manualmente.";
        try {
          const errBody = typeof error?.context === "string" ? JSON.parse(error.context) : error?.context;
          if (errBody?.error === "MARKETPLACE_MANUAL" || errBody?.message) {
            errorMsg = errBody.message || errorMsg;
          } else if (data?.error === "MARKETPLACE_MANUAL" || data?.message) {
            errorMsg = data.message || errorMsg;
          }
        } catch {
          if (data?.message) errorMsg = data.message;
          else if (data?.error && data.error !== "MARKETPLACE_MANUAL") errorMsg = data.error;
        }
        toast.info("📋 " + errorMsg, { duration: 8000 });
        setIsLoading(false);
        return { error: errorMsg };
      }

      const d = data.data;
      const geoIds = await resolveGeoIds({
        department: d.department || "",
        city: d.city || "",
        neighborhood: d.neighborhood || "",
      });
      const propertyData: PropertyData = {
        title: d.title || "",
        priceRent: String(d.priceRent || ""),
        priceExpenses: String(d.priceExpenses || ""),
        currency: normalizeCurrency(d.currency),
        department: geoIds.department || d.department || "",
        department_id: geoIds.department_id || "",
        neighborhood: geoIds.neighborhood || d.neighborhood || "",
        neighborhood_id: geoIds.neighborhood_id || "",
        city: geoIds.city || d.city || "",
        city_id: geoIds.city_id || "",
        sqMeters: String(d.sqMeters || ""),
        rooms: String(d.rooms || ""),
        aiSummary: d.aiSummary || "",
        ref: d.ref || "",
        details: d.details || "",
        listingType: d.listingType === "sale" || d.listingType === "rent" ? d.listingType : undefined,
        images: d.images || [],
        contactName: d.contactName || "",
        contactPhone: d.contactPhone || "",
      };

      toast.success("¡Datos extraídos con IA!");
      return { data: propertyData };
    } catch (err) {
      console.error("Scrape error:", err);
      toast.error("Error al conectar con el servicio de scraping");
      return { error: "Error de conexión" };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Analiza imágenes subidas a Storage usando extract-from-image.
   */
  const handleImagesExtractor = async (files: FileList | File[] | null, isUnified: boolean = true) => {
    if (!files || (files instanceof FileList ? files.length === 0 : (files as File[]).length === 0)) return null;
    
    if (isUnified) setIsAnalyzingUnified(true);
    else setIsAnalyzingImages(true);

    try {
      if (!authUser) {
        toast.error("Debés estar logueado");
        return null;
      }

      // Subir imágenes a Storage (máx 3)
      const uploadedUrls: string[] = [];
      const filesArray = Array.from(files as any).slice(0, 3) as File[];
      
      for (const file of filesArray) {
        if (!file.type.startsWith("image/")) continue;
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${authUser.id}/screenshot-${safeUUID()}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from("property-images").upload(path, file);
        if (uploadErr) {
          console.error("Upload error:", uploadErr);
          continue;
        }
        const { data: urlData } = supabase.storage.from("property-images").getPublicUrl(path);
        uploadedUrls.push(urlData.publicUrl);
      }

      if (uploadedUrls.length === 0) {
        toast.error("No se pudieron subir las imágenes.");
        return null;
      }

      const { data, error } = await supabase.functions.invoke("extract-from-image", {
        body: { imageUrls: uploadedUrls, role: "user" },
      });

      if (error || !data?.success) {
        const errMsg = data?.error || "No pudimos extraer datos de las imágenes. Completá manualmente.";
        toast.info("📋 " + errMsg, { duration: 8000 });
        return { error: errMsg, uploadedUrls };
      }

      const d = data.data;
      const geoIds = await resolveGeoIds({
        department: d.department || "",
        city: d.city || "",
        neighborhood: d.neighborhood || "",
      });
      const propertyData: PropertyData = {
        title: d.title || "",
        priceRent: d.priceRent ? String(d.priceRent) : "",
        priceExpenses: d.priceExpenses ? String(d.priceExpenses) : "",
        currency: normalizeCurrency(d.currency),
        department: geoIds.department || d.department || "",
        department_id: geoIds.department_id || "",
        neighborhood: geoIds.neighborhood || d.neighborhood || "",
        neighborhood_id: geoIds.neighborhood_id || "",
        city: geoIds.city || d.city || "",
        city_id: geoIds.city_id || "",
        sqMeters: d.sqMeters ? String(d.sqMeters) : "",
        rooms: d.rooms ? String(d.rooms) : "",
        aiSummary: d.aiSummary || "",
        ref: d.ref || "",
        details: d.details || "",
        listingType: d.listingType === "sale" || d.listingType === "rent" ? d.listingType : undefined,
        images: uploadedUrls,
        contactName: d.contactName || "",
        contactPhone: d.contactPhone || "",
      };

      toast.success("¡Datos extraídos de las imágenes con IA!");
      return { data: propertyData };
    } catch (err) {
      console.error("Image extraction error:", err);
      toast.error("Error al analizar las imágenes. Intentá de nuevo.");
      return { error: "Error de análisis" };
    } finally {
      if (isUnified) setIsAnalyzingUnified(false);
      else setIsAnalyzingImages(false);
    }
  };

  return {
    isLoading,
    isAnalyzingUnified,
    isAnalyzingImages,
    handleScrape,
    handleImagesExtractor
  };
}
