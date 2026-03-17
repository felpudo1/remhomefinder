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
import { checkUrlStatus, getExistingPropertyByUrl, formatDaysAgo } from "@/lib/duplicateCheck";
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
    /** Fotos privadas (solo familia) - van a user_listing_attachments */
    privateImages?: string[];
    groupId?: string | null;
    listingType?: string;
    ref?: string;
    details?: string;
  }) => void;
  activeGroupId?: string | null;
  scraper?: "firecrawl" | "zenrows";
  /** Al detectar que ya está en la familia, abrir ese aviso en lugar de agregar */
  onOpenExisting?: (userListingId: string) => void;
}

export function AddPropertyModal({ open, onClose, onAdd, activeGroupId, scraper = "firecrawl", onOpenExisting }: AddPropertyModalProps) {
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
  const [privateImages, setPrivateImages] = useState<string[]>([]);
  const [manualImageUrl, setManualImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [urlDuplicated, setUrlDuplicated] = useState(false);
  const [urlAddedByName, setUrlAddedByName] = useState<string | null>(null);
  /** Caso 1: ya en familia - bloquear y mostrar mensaje con link */
  const [urlInFamily, setUrlInFamily] = useState<{ addedByName: string; addedAt: string; status: string; userListingId: string } | null>(null);
  /** Caso 2: existe en app - mensaje informativo */
  const [urlInAppMsg, setUrlInAppMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const privateFileInputRef = useRef<HTMLInputElement>(null);
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
   * Scrapea una URL o pre-llena si otra familia ya la ingresó.
   * Caso 1: ya en familia → bloquear. Caso 2: en app (otra familia) → pre-llenar con mensaje.
   */
  const handleScrape = async () => {
    if (!url.trim()) return;
    setIsLoading(true);
    setUrlInFamily(null);
    setUrlInAppMsg(null);
    try {
      const orgId = selectedGroupId || null;
      const result = await checkUrlStatus(url.trim(), orgId);

      if (result.case === "in_family") {
        setUrlInFamily({
          addedByName: result.addedByName,
          addedAt: result.addedAt,
          status: result.status,
          userListingId: result.userListingId,
        });
        setUrlDuplicated(true);
        setIsLoading(false);
        return;
      }

      if (result.case === "in_app") {
        const existing = await getExistingPropertyByUrl(url.trim());
        if (existing) {
          setScrapedImages(existing.images || []);
          setForm({
            title: existing.title || "",
            priceRent: String(existing.price_amount ?? ""),
            priceExpenses: String(existing.price_expenses ?? ""),
            currency: existing.currency || "USD",
            neighborhood: existing.neighborhood || "",
            city: existing.city || "",
            sqMeters: String(existing.m2_total ?? ""),
            rooms: String(existing.rooms ?? ""),
            aiSummary: existing.details || "",
            ref: existing.ref || "",
            details: existing.details || "",
          });
          setStep("manual");
          setUrlDuplicated(false);
          setUrlInAppMsg(`Este aviso ya existe en la APP, fue ingresado ${formatDaysAgo(result.firstAddedAt)} y ${result.usersCount} usuario${result.usersCount !== 1 ? "s" : ""} lo han guardado para evaluar.`);
          toast.success("Revisá los datos y agregalo a tu familia.");
        }
        setIsLoading(false);
        return;
      }

      // Caso none: scrapear

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

  const handlePrivateFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Debés estar logueado"); return; }
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${user.id}/private-${safeUUID()}.${ext}`;
        const { error } = await supabase.storage.from("property-images").upload(path, file);
        if (error) { console.error("Upload error:", error); continue; }
        const { data: urlData } = supabase.storage.from("property-images").getPublicUrl(path);
        uploaded.push(urlData.publicUrl);
      }
      if (uploaded.length > 0) {
        setPrivateImages(prev => [...prev, ...uploaded]);
        toast.success(`${uploaded.length} foto(s) privada(s) agregada(s)`);
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Error al subir fotos");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!url.trim()) {
      toast.error("La URL de la publicación es obligatoria.");
      return;
    }
    const orgId = selectedGroupId || null;
    const result = await checkUrlStatus(url.trim(), orgId);
    if (result.case === "in_family") {
      toast.error(`Este aviso fue ingresado por ${result.addedByName} ${formatDaysAgo(result.addedAt)}. Su estado es ${result.status}.`);
      return;
    }
    const isRent = listingType === "rent";
    // Manual/cameFromImage: fotos van a privadas. Scraped: fotos públicas + privadas separadas
    const publicImages = cameFromImage ? [] : scrapedImages;
    const familyImages = cameFromImage ? scrapedImages : privateImages;
    const formData = {
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
      images: publicImages,
      privateImages: familyImages.length > 0 ? familyImages : undefined,
      groupId: selectedGroupId,
      listingType,
      ref: form.ref,
      details: form.details,
    };
    if (result.case === "in_app") {
      (formData as any)._successMessage = `Este aviso ya fue ingresado hace ${formatDaysAgo(result.firstAddedAt)} y ${result.usersCount} usuario${result.usersCount !== 1 ? "s" : ""} lo tienen entre sus favoritos.`;
    }
    try {
      await onAdd(formData);
      handleClose();
    } catch {
      // Error ya mostrado por handleAddProperty; modal permanece abierto
    }
  };

  const handleClose = () => {
    setUrl("");
    setForm({ title: "", priceRent: "", priceExpenses: "", currency: "USD", neighborhood: "", city: "", sqMeters: "", rooms: "", aiSummary: "", ref: "", details: "" });
    setScrapedImages([]);
    setPrivateImages([]);
    setManualImageUrl("");
    setUrlDuplicated(false);
    setUrlAddedByName(null);
    setUrlInFamily(null);
    setUrlInAppMsg(null);
    setListingType("rent");
    setStep("url");
    setCameFromImage(false);
    setScreenshotFile(null);
    setScreenshotPreview(null);
    setIsLoading(false);
    onClose();
  };

  const isFormValid = url.trim() && form.title && form.neighborhood && form.priceRent && !urlDuplicated && !urlInFamily;

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
          setUrl={(v) => { setUrl(v); setUrlInFamily(null); setUrlInAppMsg(null); }}
          isLoading={isLoading}
          urlInFamily={urlInFamily}
          onOpenExisting={onOpenExisting}
          formatDaysAgo={formatDaysAgo}
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
            privateImages={privateImages}
            setPrivateImages={setPrivateImages}
            privateFileInputRef={privateFileInputRef}
            handlePrivateFileUpload={handlePrivateFileUpload}
            manualImageUrl={manualImageUrl}
            setManualImageUrl={setManualImageUrl}
            fileInputRef={fileInputRef}
            handleFileUpload={handleFileUpload}
            isUploading={isUploading}
            url={url}
            setUrl={(v) => { setUrl(v); setUrlInFamily(null); setUrlInAppMsg(null); }}
            urlDuplicated={urlDuplicated}
            urlAddedByName={urlAddedByName}
            urlInFamily={urlInFamily}
            urlInAppMsg={urlInAppMsg}
            formatDaysAgo={formatDaysAgo}
            setUrlDuplicated={setUrlDuplicated}
            groups={groups}
            selectedGroupId={selectedGroupId}
            setSelectedGroupId={setSelectedGroupId}
            setStep={setStep}
            handleSubmit={handleSubmit}
            isFormValid={isFormValid}
            onExtractFromUrl={handleScrape}
            isExtracting={isLoading}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
