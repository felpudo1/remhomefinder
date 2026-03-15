import { useState, useRef, useEffect } from "react";

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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, Sparkles, Loader2, Plus, X, ImageIcon, Upload, Users, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGroups } from "@/hooks/useGroups";
import { ScraperInput } from "./add-property/ScraperInput";
import { PropertyFormManual } from "./add-property/PropertyFormManual";

interface AddPropertyModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (form: {
    url: string;
    title: string;
    priceRent: number;
    priceExpenses: number;
    currency: string;
    neighborhood: string;
    city: string;
    sqMeters: number;
    rooms: number;
    aiSummary: string;
    images: string[];
    groupId?: string | null;
    listingType?: string;
    ref?: string;
    details?: string;
  }) => void;
  activeGroupId?: string | null;
  scraper?: "firecrawl" | "zenrows";
}

export function AddPropertyModal({ open, onClose, onAdd, activeGroupId, scraper = "firecrawl" }: AddPropertyModalProps) {
  const { groups } = useGroups();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(activeGroupId || null);
  const [listingType, setListingType] = useState<"rent" | "sale">("rent");
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"url" | "image-upload" | "manual">("url");
  const [cameFromImage, setCameFromImage] = useState(false);

  // Image upload state
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const screenshotInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setSelectedGroupId(activeGroupId || null);
    }
  }, [open, activeGroupId]);

  const [scrapedImages, setScrapedImages] = useState<string[]>([]);
  const [manualImageUrl, setManualImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [urlDuplicated, setUrlDuplicated] = useState(false);
  const [isCheckingUrl, setIsCheckingUrl] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Ref para el input oculto de análisis de screenshots
  const imageAnalysisRef = useRef<HTMLInputElement>(null);
  // Ref para el nuevo botón unificado
  const unifiedImageRef = useRef<HTMLInputElement>(null);
  // Estado de carga para el análisis de imágenes
  const [isAnalyzingImages, setIsAnalyzingImages] = useState(false);
  const [isAnalyzingUnified, setIsAnalyzingUnified] = useState(false);
  const [form, setForm] = useState({
    title: "",
    priceRent: "",
    priceExpenses: "",
    currency: "USD",
    neighborhood: "",
    city: "",
    sqMeters: "",
    rooms: "",
    aiSummary: "",
    ref: "",
    details: "",
  });

  /**
   * NUEVO: Botón unificado — sube 1-3 fotos a Storage y llama extract-from-image
   * con URLs públicas. Usa el prompt configurable desde DB.
   */
  const handleUnifiedImageAnalysis = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsAnalyzingUnified(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Debés estar logueado"); setIsAnalyzingUnified(false); return; }

      // Subir cada imagen a Storage (máx 3)
      const uploadedUrls: string[] = [];
      for (const file of Array.from(files).slice(0, 3)) {
        if (!file.type.startsWith("image/")) continue;
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${user.id}/screenshot-${safeUUID()}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from("property-images").upload(path, file);
        if (uploadErr) { console.error("Upload error:", uploadErr); continue; }
        const { data: urlData } = supabase.storage.from("property-images").getPublicUrl(path);
        uploadedUrls.push(urlData.publicUrl);
      }

      if (uploadedUrls.length === 0) {
        toast.error("No se pudieron subir las imágenes.");
        setIsAnalyzingUnified(false);
        return;
      }

      // Llamar extract-from-image con imageUrls (array)
      const { data, error } = await supabase.functions.invoke("extract-from-image", {
        body: { imageUrls: uploadedUrls, role: "user" },
      });

      if (error || !data?.success) {
        const errMsg = data?.error || "No pudimos extraer datos de las imágenes. Completá manualmente.";
        toast.info("📋 " + errMsg, { duration: 8000 });
        setCameFromImage(true);
        setStep("manual");
        setIsAnalyzingUnified(false);
        return;
      }

      const d = data.data;
      setForm({
        title: d.title || "",
        priceRent: d.priceRent ? String(d.priceRent) : "",
        priceExpenses: d.priceExpenses ? String(d.priceExpenses) : "",
        currency: d.currency || "UYU",
        neighborhood: d.neighborhood || "",
        city: d.city || "",
        sqMeters: d.sqMeters ? String(d.sqMeters) : "",
        rooms: d.rooms ? String(d.rooms) : "",
        aiSummary: d.aiSummary || "",
        ref: d.ref || "",
        details: d.details || "",
      });
      if (d.listingType === "sale" || d.listingType === "rent") setListingType(d.listingType);
      // Agregar las imágenes subidas a la galería para que se persistan
      setScrapedImages(prev => [...prev, ...uploadedUrls]);
      setCameFromImage(true);
      setStep("manual");
      toast.success("¡Datos extraídos de las imágenes con IA!");
    } catch (err) {
      console.error("Unified image analysis error:", err);
      toast.error("Error al analizar las imágenes. Intentá de nuevo.");
    } finally {
      setIsAnalyzingUnified(false);
      if (unifiedImageRef.current) unifiedImageRef.current.value = "";
    }
  };

  /**
   * Analiza screenshots de publicaciones inmobiliarias usando Gemini Vision.
   * Convierte las imágenes a base64 y las envía a la Edge Function.
   */
  const handleImageAnalysis = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsAnalyzingImages(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Debés estar logueado"); setIsAnalyzingImages(false); return; }

      // Subir cada imagen a Storage (máx 3)
      const uploadedUrls: string[] = [];
      for (const file of Array.from(files).slice(0, 3)) {
        if (!file.type.startsWith("image/")) continue;
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${user.id}/screenshot-${safeUUID()}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from("property-images").upload(path, file);
        if (uploadErr) { console.error("Upload error:", uploadErr); continue; }
        const { data: urlData } = supabase.storage.from("property-images").getPublicUrl(path);
        uploadedUrls.push(urlData.publicUrl);
      }

      if (uploadedUrls.length === 0) {
        toast.error("No se pudieron subir las imágenes.");
        setIsAnalyzingImages(false);
        return;
      }

      // Llamar extract-from-image con URLs de Storage
      const { data, error } = await supabase.functions.invoke("extract-from-image", {
        body: { imageUrls: uploadedUrls, role: "user" },
      });

      if (error || !data?.success) {
        const msg = data?.error || error?.message || "No se pudieron analizar las imágenes. Completá manualmente.";
        toast.info("📋 " + msg, { duration: 8000 });
        setCameFromImage(true);
        setStep("manual");
        setIsAnalyzingImages(false);
        return;
      }

      // Llenar el formulario con los datos extraídos
      const d = data.data;
      setForm({
        title: d.title || "",
        priceRent: String(d.priceRent || ""),
        priceExpenses: String(d.priceExpenses || ""),
        currency: d.currency || "UYU",
        neighborhood: d.neighborhood || "",
        city: d.city || "",
        sqMeters: String(d.sqMeters || ""),
        rooms: String(d.rooms || ""),
        aiSummary: d.aiSummary || "",
        ref: d.ref || "",
        details: d.details || "",
      });
      if (d.listingType === "sale" || d.listingType === "rent") setListingType(d.listingType);
      // Agregar las imágenes subidas a la galería
      setScrapedImages(prev => [...prev, ...uploadedUrls]);
      setCameFromImage(true);
      setStep("manual");
      toast.success("¡Datos extraídos de las imágenes con IA!");
    } catch (err) {
      console.error("Image analysis error:", err);
      toast.error("Error al analizar las imágenes. Intentá de nuevo.");
    } finally {
      setIsAnalyzingImages(false);
      if (imageAnalysisRef.current) imageAnalysisRef.current.value = "";
    }
  };

  /**
   * Scrapea una URL y extrae datos con IA.
   */
  const handleScrape = async () => {
    if (!url.trim()) return;
    setIsLoading(true);
    try {
      const { data: existing } = await supabase
        .from("properties")
        .select("id")
        .eq("source_url", url.trim())
        .limit(1);
      if (existing && existing.length > 0) {
        toast.error("Esta publicación ya fue ingresada anteriormente.");
        setIsLoading(false);
        return;
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
        setStep("manual");
        setIsLoading(false);
        return;
      }

      const d = data.data;
      setScrapedImages(d.images || []);
      setForm({
        title: d.title || "",
        priceRent: String(d.priceRent || ""),
        priceExpenses: String(d.priceExpenses || ""),
        currency: d.currency || "ARS",
        neighborhood: d.neighborhood || "",
        city: d.city || "",
        sqMeters: String(d.sqMeters || ""),
        rooms: String(d.rooms || ""),
        aiSummary: d.aiSummary || "",
        ref: d.ref || "",
        details: d.details || "",
      });
      if (d.listingType === "sale" || d.listingType === "rent") {
        setListingType(d.listingType);
      }
      setStep("manual");
      toast.success("¡Datos extraídos con IA!");
    } catch (err) {
      console.error("Scrape error:", err);
      toast.error("Error al conectar con el servicio de scraping");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Image analysis ---
  const handleScreenshotSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith("image/")) {
      toast.error("Seleccioná una imagen");
      return;
    }
    setScreenshotFile(file);
    setScreenshotPreview(URL.createObjectURL(file));
  };

  const handleAnalyzeImage = async () => {
    if (!screenshotFile) return;
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Debés estar logueado"); setIsLoading(false); return; }

      // Upload screenshot to storage
      const ext = screenshotFile.name.split(".").pop() || "jpg";
      const path = `${user.id}/screenshot-${safeUUID()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("property-images").upload(path, screenshotFile);
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from("property-images").getPublicUrl(path);
      const imageUrl = urlData.publicUrl;

      // Call extract-from-image
      const { data, error } = await supabase.functions.invoke("extract-from-image", {
        body: { imageUrl, role: "user" },
      });

      if (error || !data?.success) {
        const errMsg = data?.error || "No pudimos extraer datos de la imagen. Completá manualmente.";
        toast.info("📋 " + errMsg, { duration: 8000 });
        setCameFromImage(true);
        setStep("manual");
        setIsLoading(false);
        return;
      }

      const d = data.data;
      setScrapedImages(d.images || []);
      setForm({
        title: d.title || "",
        priceRent: d.priceRent ? String(d.priceRent) : "",
        priceExpenses: d.priceExpenses ? String(d.priceExpenses) : "",
        currency: d.currency || "USD",
        neighborhood: d.neighborhood || "",
        city: d.city || "",
        sqMeters: d.sqMeters ? String(d.sqMeters) : "",
        rooms: d.rooms ? String(d.rooms) : "",
        aiSummary: d.aiSummary || "",
        ref: d.ref || "",
        details: d.details || "",
      });
      if (d.listingType === "sale" || d.listingType === "rent") {
        setListingType(d.listingType);
      }
      setCameFromImage(true);
      setStep("manual");
      toast.success("¡Datos extraídos de la imagen!");
    } catch (err) {
      console.error("Image analysis error:", err);
      toast.error("Error al analizar la imagen");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Debés estar logueado"); return; }

      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${user.id}/${safeUUID()}.${ext}`;
        const { error } = await supabase.storage.from("property-images").upload(path, file);
        if (error) { console.error("Upload error:", error); continue; }
        const { data: urlData } = supabase.storage.from("property-images").getPublicUrl(path);
        uploaded.push(urlData.publicUrl);
      }
      if (uploaded.length > 0) {
        setScrapedImages(prev => [...prev, ...uploaded]);
        toast.success(`${uploaded.length} foto(s) subida(s)`);
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Error al subir fotos");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const checkDuplicateUrl = async (urlToCheck: string) => {
    if (!urlToCheck.trim()) { setUrlDuplicated(false); return; }
    setIsCheckingUrl(true);
    try {
      const { data } = await supabase.from("properties").select("id").eq("url", urlToCheck.trim()).limit(1);
      setUrlDuplicated(!!(data && data.length > 0));
    } catch { setUrlDuplicated(false); }
    finally { setIsCheckingUrl(false); }
  };

  const handleSubmit = () => {
    const isRent = listingType === "rent";
    onAdd({
      url: url || "",
      title: form.title,
      priceRent: isRent ? (Number(form.priceRent) || 0) : (Number(form.priceRent) || 0),
      priceExpenses: isRent ? (Number(form.priceExpenses) || 0) : 0,
      currency: form.currency,
      neighborhood: form.neighborhood,
      city: form.city,
      sqMeters: Number(form.sqMeters) || 0,
      rooms: Number(form.rooms) || 1,
      aiSummary: form.aiSummary,
      images: scrapedImages,
      groupId: selectedGroupId,
      listingType,
      ref: form.ref,
      details: form.details,
    });
    handleClose();
  };

  const handleClose = () => {
    setUrl("");
    setForm({ title: "", priceRent: "", priceExpenses: "", currency: "USD", neighborhood: "", city: "", sqMeters: "", rooms: "", aiSummary: "", ref: "", details: "" });
    setScrapedImages([]);
    setManualImageUrl("");
    setUrlDuplicated(false);
    setListingType("rent");
    setStep("url");
    setCameFromImage(false);
    setScreenshotFile(null);
    setScreenshotPreview(null);
    setIsLoading(false);
    onClose();
  };

  const isFormValid = form.title && form.neighborhood && form.priceRent && !urlDuplicated;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {step === "url"
              ? "Agregar Propiedad"
              : step === "image-upload"
                ? "Analizar captura de RRSS"
                : "Detalles de la Propiedad"}
          </DialogTitle>
        </DialogHeader>

        <ScraperInput
          step={step}
          url={url}
          setUrl={setUrl}
          isLoading={isLoading}
          isAnalyzingUnified={isAnalyzingUnified}
          handleScrape={handleScrape}
          unifiedImageRef={unifiedImageRef}
          handleUnifiedImageAnalysis={handleUnifiedImageAnalysis}
          setStep={setStep}
          screenshotInputRef={screenshotInputRef}
          screenshotFile={screenshotFile}
          screenshotPreview={screenshotPreview}
          handleScreenshotSelect={handleScreenshotSelect}
          setScreenshotFile={setScreenshotFile}
          setScreenshotPreview={setScreenshotPreview}
          handleAnalyzeImage={handleAnalyzeImage}
          setCameFromImage={setCameFromImage}
        />

        {step === "manual" && (
          <PropertyFormManual
            form={form}
            setForm={setForm}
            listingType={listingType}
            setListingType={setListingType}
            cameFromImage={cameFromImage}
            scrapedImages={scrapedImages}
            setScrapedImages={setScrapedImages}
            manualImageUrl={manualImageUrl}
            setManualImageUrl={setManualImageUrl}
            fileInputRef={fileInputRef}
            handleFileUpload={handleFileUpload}
            isUploading={isUploading}
            url={url}
            setUrl={setUrl}
            urlDuplicated={urlDuplicated}
            setUrlDuplicated={setUrlDuplicated}
            checkDuplicateUrl={checkDuplicateUrl}
            groups={groups}
            selectedGroupId={selectedGroupId}
            setSelectedGroupId={setSelectedGroupId}
            setStep={setStep}
            handleSubmit={handleSubmit}
            isFormValid={isFormValid}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
