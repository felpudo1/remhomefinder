import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Sparkles } from "lucide-react";
import { toast as sonnerToast } from "sonner";
import { PropertyFormManual } from "./add-property/PropertyFormManual";
import { ScraperInput } from "./add-property/ScraperInput";

/** Genera un UUID compatible con contextos no seguros (HTTP en red local) */
function safeUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface PublishPropertyModalProps {
  open: boolean;
  onClose: () => void;
  agencyId: string;
  onPublished: () => void;
  propertyToEdit?: any;
}

export function PublishPropertyModal({ open, onClose, agencyId, onPublished, propertyToEdit }: PublishPropertyModalProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"url" | "image-upload" | "manual">("url");
  const [url, setUrl] = useState("");
  const [scrapedImages, setScrapedImages] = useState<string[]>([]);
  const [manualImageUrl, setManualImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [urlDuplicated, setUrlDuplicated] = useState(false);
  const [cameFromImage, setCameFromImage] = useState(false);

  // Image analysis state
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isAnalyzingUnified, setIsAnalyzingUnified] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const screenshotInputRef = useRef<HTMLInputElement>(null);
  const unifiedImageRef = useRef<HTMLInputElement>(null);

  const [listingType, setListingType] = useState<"rent" | "sale">("rent");
  const [form, setForm] = useState({
    title: "",
    priceRent: "",
    priceExpenses: "",
    currency: "UYU",
    neighborhood: "",
    city: "",
    sqMeters: "",
    rooms: "",
    aiSummary: "",
    ref: "",
    details: "",
  });

  useEffect(() => {
    if (open) {
      if (propertyToEdit) {
        setStep("manual");
        setScrapedImages(propertyToEdit.images || []);
        setListingType(propertyToEdit.listingType || propertyToEdit.listing_type || "rent");
        setForm({
          title: propertyToEdit.title || "",
          priceRent: String(propertyToEdit.priceRent || propertyToEdit.price_rent || ""),
          priceExpenses: String(propertyToEdit.priceExpenses || propertyToEdit.price_expenses || ""),
          currency: propertyToEdit.currency || "UYU",
          neighborhood: propertyToEdit.neighborhood || "",
          city: propertyToEdit.city || "",
          sqMeters: String(propertyToEdit.sqMeters || propertyToEdit.sq_meters || ""),
          rooms: String(propertyToEdit.rooms || ""),
          aiSummary: propertyToEdit.aiSummary || propertyToEdit.ai_summary || "",
          ref: propertyToEdit.ref || propertyToEdit.ref || "",
          details: propertyToEdit.details || propertyToEdit.description || "",
        });
        setUrl(propertyToEdit.url || "");
      } else {
        setStep("url");
        setUrl("");
        setScrapedImages([]);
        setListingType("rent");
        setForm({
          title: "",
          priceRent: "",
          priceExpenses: "",
          currency: "UYU",
          neighborhood: "",
          city: "",
          sqMeters: "",
          rooms: "",
          aiSummary: "",
          ref: "",
          details: "",
        });
        setCameFromImage(false);
        setScreenshotFile(null);
        setScreenshotPreview(null);
      }
    }
  }, [open, propertyToEdit]);

  // Auto-ajustar moneda según tipo de operación
  useEffect(() => {
    if (!propertyToEdit) {
      setForm((prev) => ({
        ...prev,
        currency: listingType === "sale" ? "USD" : "UYU",
      }));
    }
  }, [listingType, propertyToEdit]);

  const handleScrape = async () => {
    if (!url.trim()) return;
    setIsLoading(true);
    try {
      const { data: existing } = await supabase
        .from("marketplace_properties")
        .select("id")
        .eq("url", url.trim())
        .limit(1);

      if (existing && existing.length > 0) {
        sonnerToast.error("Esta propiedad ya está publicada en el marketplace.");
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("scrape-property", {
        body: { url: url.trim(), role: "agent" },
      });

      if (error || !data?.success) {
        sonnerToast.info("No pudimos extraer datos automáticamente. Completá los datos manualmente.");
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
        currency: d.currency || "UYU",
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
      sonnerToast.success("¡Datos extraídos con IA!");
    } catch (err) {
      console.error("Scrape error:", err);
      sonnerToast.error("Error al conectar con el servicio de scraping");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnifiedImageAnalysis = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsAnalyzingUnified(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { sonnerToast.error("Debés estar logueado"); return; }

      const uploadedUrls: string[] = [];
      for (const file of Array.from(files).slice(0, 3)) {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `agencies/${agencyId}/captures/${safeUUID()}.${ext}`;
        const { error } = await supabase.storage.from("property-images").upload(path, file);
        if (error) continue;
        const { data: urlData } = supabase.storage.from("property-images").getPublicUrl(path);
        uploadedUrls.push(urlData.publicUrl);
      }

      if (uploadedUrls.length === 0) {
        sonnerToast.error("No se pudieron subir las imágenes.");
        return;
      }

      const { data, error } = await supabase.functions.invoke("extract-from-image", {
        body: { imageUrls: uploadedUrls, role: "agent" },
      });

      if (error || !data?.success) {
        sonnerToast.info("No pudimos extraer datos de las imágenes. Completá manualmente.");
        setCameFromImage(true);
        setStep("manual");
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
      setScrapedImages(prev => [...prev, ...uploadedUrls]);
      setCameFromImage(true);
      setStep("manual");
      sonnerToast.success("¡IA analizó tus fotos!");
    } catch (err) {
      console.error(err);
      sonnerToast.error("Error al analizar imágenes");
    } finally {
      setIsAnalyzingUnified(false);
    }
  };

  const handleScreenshotSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith("image/")) {
      sonnerToast.error("Seleccioná una imagen");
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
      if (!user) { sonnerToast.error("Debés estar logueado"); return; }

      const ext = screenshotFile.name.split(".").pop() || "jpg";
      const path = `agencies/${agencyId}/captures/${safeUUID()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("property-images").upload(path, screenshotFile);
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from("property-images").getPublicUrl(path);
      const imageUrl = urlData.publicUrl;

      const { data, error } = await supabase.functions.invoke("extract-from-image", {
        body: { imageUrl, role: "agent" },
      });

      if (error || !data?.success) {
        sonnerToast.info("No pudimos extraer datos de la imagen. Completá manualmente.");
        setCameFromImage(true);
        setStep("manual");
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
      setScrapedImages(prev => [...prev, imageUrl]);
      setCameFromImage(true);
      setStep("manual");
      sonnerToast.success("¡Datos extraídos de la imagen!");
    } catch (err) {
      console.error(err);
      sonnerToast.error("Error al analizar la imagen");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { sonnerToast.error("Debés estar logueado"); return; }

      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        const ext = file.name.split(".").pop() || "jpg";
        const path = `agencies/${agencyId}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("property-images").upload(path, file);
        if (error) { console.error("Upload error:", error); continue; }
        const { data: urlData } = supabase.storage.from("property-images").getPublicUrl(path);
        uploaded.push(urlData.publicUrl);
      }
      if (uploaded.length > 0) {
        setScrapedImages(prev => [...prev, ...uploaded]);
        sonnerToast.success(`${uploaded.length} foto(s) subida(s)`);
      }
    } catch (err) {
      console.error("Upload error:", err);
      sonnerToast.error("Error al subir fotos");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const checkDuplicateUrl = async (urlToCheck: string) => {
    if (!urlToCheck.trim()) { setUrlDuplicated(false); return; }
    try {
      const { data } = await supabase.from("marketplace_properties").select("id").eq("url", urlToCheck.trim()).limit(1);
      setUrlDuplicated(!!(data && data.length > 0));
    } catch { setUrlDuplicated(false); }
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) return;

    setSaving(true);
    try {
      const priceRent = Number(form.priceRent) || 0;
      const priceExpenses = listingType === "rent" ? (Number(form.priceExpenses) || 0) : 0;

      const payload = {
        agency_id: agencyId,
        title: form.title.trim(),
        description: form.aiSummary || form.details || "",
        url: url.trim(),
        price_rent: priceRent,
        price_expenses: priceExpenses,
        total_cost: priceRent + priceExpenses,
        currency: form.currency,
        neighborhood: form.neighborhood.trim(),
        city: form.city.trim(),
        sq_meters: Number(form.sqMeters) || 0,
        rooms: Number(form.rooms) || 1,
        images: scrapedImages,
        listing_type: listingType,
      };

      if (propertyToEdit) {
        const { error } = await supabase.from("marketplace_properties").update(payload).eq("id", propertyToEdit.id);
        if (error) throw error;
        toast({ title: "Actualizada", description: "La propiedad fue actualizada correctamente." });
      } else {
        // Validación de seguridad (REGLA 2) - Verificar límite antes de insertar
        const { count, error: countErr } = await supabase
          .from("marketplace_properties")
          .select("*", { count: "exact", head: true })
          .eq("agency_id", agencyId);

        if (countErr) throw countErr;

        const { data: profile } = await supabase.from("profiles").select("plan_type").eq("user_id", (await supabase.auth.getUser()).data.user?.id).single();
        const { data: config } = await supabase.from("system_config").select("value").eq("key", "agent_free_plan_publish_limit").maybeSingle();

        const isPremium = profile?.plan_type === "premium";
        const limit = parseInt(config?.value || "3");

        if (!isPremium && count !== null && count >= limit) {
          throw new Error(`Has alcanzado el límite de ${limit} publicaciones permitidas en el plan gratuito.`);
        }

        const { error } = await supabase.from("marketplace_properties").insert(payload as any);
        if (error) throw error;
        toast({ title: "Publicada", description: "La propiedad fue publicada en el marketplace." });
      }

      handleClose();
      onPublished();
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "No se pudo guardar la propiedad", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  const isFormValid = form.title && form.neighborhood && form.priceRent && !urlDuplicated;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {step === "url"
              ? "Agregar Propiedad"
              : step === "image-upload"
                ? "Analizar captura de RRSS"
                : (propertyToEdit ? "Editar Propiedad" : "Detalles de la Propiedad")}
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
            groups={[]}
            selectedGroupId={null}
            setSelectedGroupId={() => { }}
            setStep={setStep}
            handleSubmit={handleSubmit}
            isFormValid={isFormValid && !saving}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
