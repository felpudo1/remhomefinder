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
    sqMeters: number;
    rooms: number;
    aiSummary: string;
    images: string[];
    groupId?: string | null;
    listingType?: string;
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
    sqMeters: "",
    rooms: "",
    aiSummary: "",
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
        sqMeters: d.sqMeters ? String(d.sqMeters) : "",
        rooms: d.rooms ? String(d.rooms) : "",
        aiSummary: d.aiSummary || "",
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
        sqMeters: String(d.sqMeters || ""),
        rooms: String(d.rooms || ""),
        aiSummary: d.aiSummary || "",
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
        .eq("url", url.trim())
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
        sqMeters: String(d.sqMeters || ""),
        rooms: String(d.rooms || ""),
        aiSummary: d.aiSummary || "",
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
        sqMeters: d.sqMeters ? String(d.sqMeters) : "",
        rooms: d.rooms ? String(d.rooms) : "",
        aiSummary: d.aiSummary || "",
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
      sqMeters: Number(form.sqMeters) || 0,
      rooms: Number(form.rooms) || 1,
      aiSummary: form.aiSummary,
      images: scrapedImages,
      groupId: selectedGroupId,
      listingType,
    });
    handleClose();
  };

  const handleClose = () => {
    setUrl("");
    setForm({ title: "", priceRent: "", priceExpenses: "", currency: "USD", neighborhood: "", sqMeters: "", rooms: "", aiSummary: "" });
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
            {step === "url" ? "Agregar Propiedad" : step === "image-upload" ? "Analizar captura de RRSS" : "Detalles de la Propiedad"}
          </DialogTitle>
        </DialogHeader>

        {step === "url" && (
          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Pegá la URL del aviso</Label>
              <div className="relative">
                <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="url"
                  placeholder="http://intocasas.com.uy"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="pl-9 rounded-xl"
                  onKeyDown={(e) => e.key === "Enter" && handleScrape()}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Pegá cualquier URL de un aviso inmobiliario y nuestra IA extraerá todos los detalles automáticamente.
              </p>
            </div>

            {/* Aviso importante sobre Marketplace y RRSS */}
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 text-xs text-destructive font-medium leading-relaxed">
              <strong>AVISO:</strong> Para ingresar publicaciones de MARKETPLACE y redes sociales, debe sacar captura con los datos y click en <strong>Analizar fotos de RRSS</strong> o agregar las publicaciones manualmente.
            </div>

            <Button onClick={handleScrape} disabled={!url.trim() || isLoading} className="w-full rounded-xl gap-2">
              {isLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Extrayendo datos...</>
              ) : (
                <><Sparkles className="w-4 h-4" />Extraer datos de la publicación</>
              )}
            </Button>

            {/* Input oculto para nuevo botón unificado (máx 3) */}
            <input
              ref={unifiedImageRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleUnifiedImageAnalysis(e.target.files)}
            />

            {/* Separador */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center"><span className="bg-background px-3 text-xs text-muted-foreground">o</span></div>
            </div>

            {/* NUEVO botón unificado: sube a Storage + extract-from-image con prompt DB */}
            <Button
              variant="secondary"
              onClick={() => unifiedImageRef.current?.click()}
              disabled={isAnalyzingUnified || isAnalyzingImages || isLoading}
              className="w-full rounded-xl gap-2"
            >
              {isAnalyzingUnified ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Analizando imágenes...</>
              ) : (
                <><Camera className="w-4 h-4" />Analizar fotos de RRSS (1-3 imágenes)</>
              )}
            </Button>

            {/* BACKUP: Input oculto para selección de screenshots (máx 3) — LEGACY
            <input
              ref={imageAnalysisRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleImageAnalysis(e.target.files)}
            />

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center"><span className="bg-background px-3 text-xs text-muted-foreground">o</span></div>
            </div>

            <Button
              variant="outline"
              onClick={() => imageAnalysisRef.current?.click()}
              disabled={isAnalyzingImages || isLoading}
              className="w-full rounded-xl gap-2 opacity-60"
            >
              {isAnalyzingImages ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Analizando imágenes...</>
              ) : (
                <><Camera className="w-4 h-4" />Ingresar imágenes para analizar (IG, FB)</>
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center"><span className="bg-background px-3 text-xs text-muted-foreground">o</span></div>
            </div>

            <Button variant="outline" onClick={() => setStep("image-upload")} className="w-full rounded-xl gap-2 opacity-60">
              <Camera className="w-4 h-4" />
              Ingresar captura de RRSS para analizar
            </Button>
            END BACKUP */}

            {/* Separador */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center"><span className="bg-background px-3 text-xs text-muted-foreground">o</span></div>
            </div>

            <Button
              variant="secondary"
              onClick={() => setStep("manual")}
              className="w-full rounded-xl gap-2"
            >
              <Plus className="w-4 h-4" />
              Agregar manualmente
            </Button>
          </div>
        )}

        {step === "image-upload" && (
          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Subí una captura de pantalla del aviso</Label>
              <p className="text-xs text-muted-foreground">
                Seleccioná una captura de Instagram, Facebook Marketplace u otra red social. La IA extraerá los datos que pueda detectar.
              </p>
            </div>

            <input
              ref={screenshotInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleScreenshotSelect(e.target.files)}
            />

            {screenshotPreview ? (
              <div className="relative">
                <img
                  src={screenshotPreview}
                  alt="Captura"
                  className="w-full max-h-64 object-contain rounded-xl border border-border"
                />
                <button
                  type="button"
                  onClick={() => { setScreenshotFile(null); setScreenshotPreview(null); }}
                  className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => screenshotInputRef.current?.click()}
                className="w-full border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center gap-2 hover:border-primary/50 transition-colors"
              >
                <ImageIcon className="w-8 h-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Tocá para seleccionar la captura</span>
              </button>
            )}

            <Button
              onClick={handleAnalyzeImage}
              disabled={!screenshotFile || isLoading}
              className="w-full rounded-xl gap-2"
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Analizando imagen...</>
              ) : (
                <><Sparkles className="w-4 h-4" />Analizar con IA</>
              )}
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setStep("url"); setScreenshotFile(null); setScreenshotPreview(null); }} className="flex-1 rounded-xl">
                Volver
              </Button>
              <Button variant="ghost" onClick={() => { setCameFromImage(true); setStep("manual"); }} className="flex-1 rounded-xl text-muted-foreground text-sm">
                Saltar y completar manual
              </Button>
            </div>
          </div>
        )}

        {step === "manual" && (
          <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto">
            {/* Nota cuando viene de análisis de imagen */}
            {cameFromImage && (
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-xs text-amber-800 dark:text-amber-200 flex gap-2">
                <Camera className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <p>Datos extraídos desde captura. <strong>Revisá y completá</strong> los campos faltantes. Agregá fotos reales de la propiedad abajo.</p>
              </div>
            )}

            {/* Tipo de operación */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Tipo de operación</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant={listingType === "rent" ? "default" : "outline"} size="sm" className="rounded-xl" onClick={() => setListingType("rent")}>
                  Alquiler
                </Button>
                <Button type="button" variant={listingType === "sale" ? "default" : "outline"} size="sm" className="rounded-xl" onClick={() => setListingType("sale")}>
                  Venta
                </Button>
              </div>
            </div>


            {form.aiSummary && (
              <div className="bg-muted rounded-xl p-3 text-xs text-muted-foreground flex gap-2">
                <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary" />
                <p className="leading-relaxed">{form.aiSummary}</p>
              </div>
            )}

            {/* Fotos section - moved up, highlighted when coming from image */}
            <div className={`space-y-1.5 ${cameFromImage ? "bg-primary/5 border border-primary/20 rounded-xl p-3" : ""}`}>
              <Label className="text-xs font-medium flex items-center gap-1">
                <ImageIcon className="w-3 h-3" />
                {cameFromImage ? "📸 Agregá fotos reales de la propiedad" : "Fotos"}
              </Label>
              {cameFromImage && scrapedImages.length === 0 && (
                <p className="text-[10px] text-muted-foreground">La IA no puede extraer fotos desde capturas. Subí hasta 3 fotos reales.</p>
              )}
              {scrapedImages.length > 0 ? (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {scrapedImages.map((img, i) => (
                    <div key={i} className="group relative aspect-square rounded-xl overflow-hidden border border-border bg-muted shadow-sm hover:shadow-md transition-all duration-300">
                      <img
                        src={img}
                        alt={`Foto ${i + 1}`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={(e) => { (e.target as HTMLImageElement).parentElement?.classList.add('hidden'); }}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => setScrapedImages(prev => prev.filter((_, idx) => idx !== i))}
                          className="bg-destructive text-destructive-foreground p-1.5 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-transform"
                          title="Eliminar foto"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-dashed border-border rounded-xl p-4 text-center bg-muted/30">
                  <p className="text-[10px] text-muted-foreground italic">No hay fotos seleccionadas aún</p>
                </div>
              )}
              <div className="flex gap-2">
                <Input type="url" placeholder="https://... URL de la foto" value={manualImageUrl} onChange={(e) => setManualImageUrl(e.target.value)} className="rounded-xl text-sm flex-1" onKeyDown={(e) => { if (e.key === "Enter" && manualImageUrl.trim()) { e.preventDefault(); setScrapedImages(prev => [...prev, manualImageUrl.trim()]); setManualImageUrl(""); } }} />
                <Button type="button" variant="outline" size="icon" className="rounded-xl shrink-0" disabled={!manualImageUrl.trim()} onClick={() => { setScrapedImages(prev => [...prev, manualImageUrl.trim()]); setManualImageUrl(""); }}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex gap-2 items-center">
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFileUpload(e.target.files)} />
                <Button type="button" variant="outline" size="sm" className="rounded-xl gap-1.5 text-xs" disabled={isUploading} onClick={() => fileInputRef.current?.click()}>
                  {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                  {isUploading ? "Subiendo..." : "Subir desde dispositivo"}
                </Button>
                <p className="text-[10px] text-muted-foreground">o pegá URLs arriba</p>
              </div>
            </div>

            {/* Link de la publicación */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Link de la publicación</Label>
              <div className="relative">
                <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input type="url" value={url} onChange={(e) => { setUrl(e.target.value); setUrlDuplicated(false); }} onBlur={() => checkDuplicateUrl(url)} placeholder="http://intocasas.com.uy" className={`pl-9 rounded-xl text-sm ${urlDuplicated ? "border-destructive" : ""}`} />
              </div>
              {urlDuplicated && (
                <p className="text-xs text-destructive font-medium">⚠️ Esta URL ya fue ingresada. Revisá tus propiedades existentes.</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Título *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ej: Apartamento en Buceo" className="rounded-xl text-sm" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Barrio *</Label>
              <Input value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} placeholder="Ej: Buceo" className="rounded-xl text-sm" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{listingType === "sale" ? "Precio de venta *" : "Alquiler *"}</Label>
                <Input type="number" value={form.priceRent} onChange={(e) => setForm({ ...form, priceRent: e.target.value })} placeholder={listingType === "sale" ? "150000" : "850"} className="rounded-xl text-sm" />
              </div>
              {listingType === "rent" && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">G/C</Label>
                  <Input type="number" value={form.priceExpenses} onChange={(e) => setForm({ ...form, priceExpenses: e.target.value })} placeholder="120" className="rounded-xl text-sm" />
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Moneda</Label>
                <Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} placeholder="USD" className="rounded-xl text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">m²</Label>
                <Input type="number" value={form.sqMeters} onChange={(e) => setForm({ ...form, sqMeters: e.target.value })} placeholder="58" className="rounded-xl text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Ambientes</Label>
                <Input type="number" value={form.rooms} onChange={(e) => setForm({ ...form, rooms: e.target.value })} placeholder="2" className="rounded-xl text-sm" />
              </div>
            </div>

            {/* Warning banner */}
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-xs text-amber-800 dark:text-amber-200">
              ⚠️ Por favor chequeá y completá los datos antes de agregar la propiedad.
            </div>

            {/* Group selector */}
            {groups.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1">
                  <Users className="w-3 h-3" /> Agregar al grupo
                </Label>
                <Select value={selectedGroupId || "none"} onValueChange={(v) => setSelectedGroupId(v === "none" ? null : v)}>
                  <SelectTrigger className="rounded-xl text-sm">
                    <SelectValue placeholder="Sin grupo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin grupo (solo mío)</SelectItem>
                    {groups.map((g) => (
                      <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => { setStep(cameFromImage ? "image-upload" : "url"); }} className="flex-1 rounded-xl">Volver</Button>
              <Button onClick={handleSubmit} disabled={!isFormValid} className="flex-1 rounded-xl">Agregar Propiedad</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
