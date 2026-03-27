import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  normalizeUrl,
  getExistingPropertyByUrl,
  checkUrlStatus,
  hasActiveAgentPublicationForOrg,
  hasUserListingsForProperty,
} from "@/lib/duplicateCheck";
import { useToast } from "@/hooks/use-toast";
import { resolveGeoIds } from "@/lib/resolveGeoIds";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Sparkles } from "lucide-react";
import { toast as sonnerToast } from "sonner";
import { PropertyFormManual } from "./add-property/PropertyFormManual";
import { ScraperInput } from "./add-property/ScraperInput";
import type { DbListingType, CurrencyCode } from "@/types/supabase";

/** Genera un UUID compatible con contextos no seguros */
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
  orgId: string;
  onPublished: () => void;
  propertyToEdit?: any;
}

export function PublishPropertyModal({ open, onClose, orgId, onPublished, propertyToEdit }: PublishPropertyModalProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"url" | "image-upload" | "manual">("url");
  const [url, setUrl] = useState("");
  const [scrapedImages, setScrapedImages] = useState<string[]>([]);
  const [manualImageUrl, setManualImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [urlDuplicated, setUrlDuplicated] = useState(false);
  const [urlInApp, setUrlInApp] = useState<{ firstAddedAt: string; usersCount: number } | null>(null);
  const [isAddingExistingFromApp, setIsAddingExistingFromApp] = useState(false);
  const [cameFromImage, setCameFromImage] = useState(false);
  /** Mismo cartel; etiqueta inferior caso1 (duplicado agente) o caso4 (usuarios ya ingresaron). */
  const [duplicateAgentModalOpen, setDuplicateAgentModalOpen] = useState(false);
  const [duplicateAgentModalTag, setDuplicateAgentModalTag] = useState<"caso1" | "caso4">("caso1");

  const openDuplicateAgentModal = (tag: "caso1" | "caso4") => {
    setDuplicateAgentModalTag(tag);
    setDuplicateAgentModalOpen(true);
  };

  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isAnalyzingUnified, setIsAnalyzingUnified] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const privateFileInputRef = useRef<HTMLInputElement>(null);
  const [privateImages, setPrivateImages] = useState<string[]>([]);
  const screenshotInputRef = useRef<HTMLInputElement>(null);
  const unifiedImageRef = useRef<HTMLInputElement>(null);

  const [listingType, setListingType] = useState<"rent" | "sale">("rent");
  const [form, setForm] = useState({
    title: "",
    priceRent: "",
    priceExpenses: "",
    currency: "UYU",
    neighborhood: "",
    neighborhood_id: "",
    city: "",
    city_id: "",
    department: "",
    department_id: "",
    address: "",
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
          priceRent: String(propertyToEdit.priceRent || propertyToEdit.price_amount || ""),
          priceExpenses: String(propertyToEdit.priceExpenses || propertyToEdit.price_expenses || ""),
          currency: propertyToEdit.currency || "UYU",
          neighborhood: propertyToEdit.neighborhood || "",
          neighborhood_id: propertyToEdit.neighborhood_id || "",
          city: propertyToEdit.city || "",
          city_id: propertyToEdit.city_id || "",
          department: propertyToEdit.department || "",
          department_id: propertyToEdit.department_id || "",
          address: propertyToEdit.address || "",
          sqMeters: String(propertyToEdit.sqMeters || propertyToEdit.m2_total || ""),
          rooms: String(propertyToEdit.rooms || ""),
          aiSummary: propertyToEdit.aiSummary || propertyToEdit.description || "",
          ref: propertyToEdit.ref || "",
          details: propertyToEdit.details || propertyToEdit.description || "",
        });
        setUrl(propertyToEdit.url || propertyToEdit.source_url || "");
      } else {
        setStep("url");
        setUrl("");
        setScrapedImages([]);
        setListingType("rent");
        setForm({ title: "", priceRent: "", priceExpenses: "", currency: "UYU", neighborhood: "", neighborhood_id: "", city: "", city_id: "", department: "", department_id: "", address: "", sqMeters: "", rooms: "", aiSummary: "", ref: "", details: "" });
        setCameFromImage(false);
        setUrlInApp(null);
        setScreenshotFile(null);
        setScreenshotPreview(null);
        setDuplicateAgentModalOpen(false);
      }
    }
  }, [open, propertyToEdit]);

  useEffect(() => {
    if (!propertyToEdit) {
      setForm((prev) => ({ ...prev, currency: listingType === "sale" ? "USD" : "UYU" }));
    }
  }, [listingType, propertyToEdit]);

  const handleScrape = async () => {
    if (!url.trim()) return;
    setIsLoading(true);
    setUrlInApp(null);
    try {
      // Antes del scraping: estado de URL en app y duplicado en agent_publications (caso 1).
      const urlStatus = await checkUrlStatus(url.trim(), orgId);
      if (urlStatus.case === "in_app") {
        const existingForInApp = await getExistingPropertyByUrl(url.trim());
        if (existingForInApp) {
          if (await hasActiveAgentPublicationForOrg(existingForInApp.id, orgId)) {
            openDuplicateAgentModal("caso1");
            setIsLoading(false);
            return;
          }
          if (await hasUserListingsForProperty(existingForInApp.id)) {
            openDuplicateAgentModal("caso4");
            setIsLoading(false);
            return;
          }
        }
        setUrlInApp({
          firstAddedAt: urlStatus.firstAddedAt,
          usersCount: urlStatus.usersCount,
        });
        setIsLoading(false);
        return;
      }

      // Si existe en properties pero no en user_listings (ej. solo agent_publications), reutilizar
      const existing = await getExistingPropertyByUrl(url);
      if (existing) {
        if (await hasActiveAgentPublicationForOrg(existing.id, orgId)) {
          openDuplicateAgentModal("caso1");
          setIsLoading(false);
          return;
        }
        if (await hasUserListingsForProperty(existing.id)) {
          openDuplicateAgentModal("caso4");
          setIsLoading(false);
          return;
        }
        setScrapedImages((existing.images as string[]) || []);
        setForm({
          title: existing.title || "",
          priceRent: String(existing.price_amount ?? ""),
          priceExpenses: String(existing.price_expenses ?? ""),
          currency: (existing.currency as string) || "UYU",
          neighborhood: existing.neighborhood || "",
          neighborhood_id: (existing as any).neighborhood_id || "",
          city: existing.city || "",
          city_id: (existing as any).city_id || "",
          department: (existing as any).department || "",
          department_id: (existing as any).department_id || "",
          address: (existing as any).address || "",
          sqMeters: String(existing.m2_total ?? ""),
          rooms: String(existing.rooms ?? ""),
          aiSummary: existing.details || "",
          ref: existing.ref || "",
          details: existing.details || "",
        });
        setUrlDuplicated(true);
        setStep("manual");
        sonnerToast.info("Esta propiedad ya existe en el sistema. Podés publicarla en tu marketplace.");
        setIsLoading(false);
        return;
      }

      // Solo si no hubo duplicado ni property reutilizable sin scrape: scrape remoto.
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
      
      // Resolver IDs geográficos desde texto
      const geoIds = await resolveGeoIds({
        department: d.department || "",
        city: d.city || "",
        neighborhood: d.neighborhood || "",
      });
      
      setForm({
        title: d.title || "",
        priceRent: String(d.priceRent || ""),
        priceExpenses: String(d.priceExpenses || ""),
        currency: d.currency || "UYU",
        neighborhood: geoIds.neighborhood || d.neighborhood || "",
        neighborhood_id: geoIds.neighborhood_id || "",
        city: geoIds.city || d.city || "",
        city_id: geoIds.city_id || "",
        department: geoIds.department || d.department || "",
        department_id: geoIds.department_id || "",
        address: d.address || "",
        sqMeters: String(d.sqMeters || ""),
        rooms: String(d.rooms || ""),
        aiSummary: d.aiSummary || "",
        ref: d.ref || "",
        details: d.details || "",
      });
      if (d.listingType === "sale" || d.listingType === "rent") setListingType(d.listingType);
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
        const path = `organizations/${orgId}/captures/${safeUUID()}.${ext}`;
        const { error } = await supabase.storage.from("property-images").upload(path, file);
        if (error) continue;
        const { data: urlData } = supabase.storage.from("property-images").getPublicUrl(path);
        uploadedUrls.push(urlData.publicUrl);
      }

      if (uploadedUrls.length === 0) { sonnerToast.error("No se pudieron subir las imágenes."); return; }

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
      const geoIds = await resolveGeoIds({ department: d.department || "", city: d.city || "", neighborhood: d.neighborhood || "" });
      setForm({
        title: d.title || "", priceRent: d.priceRent ? String(d.priceRent) : "", priceExpenses: d.priceExpenses ? String(d.priceExpenses) : "",
        currency: d.currency || "UYU", neighborhood: geoIds.neighborhood || d.neighborhood || "", neighborhood_id: geoIds.neighborhood_id || "",
        city: geoIds.city || d.city || "", city_id: geoIds.city_id || "", department: geoIds.department || d.department || "", department_id: geoIds.department_id || "",
        address: d.address || "", sqMeters: d.sqMeters ? String(d.sqMeters) : "", rooms: d.rooms ? String(d.rooms) : "",
        aiSummary: d.aiSummary || "", ref: d.ref || "", details: d.details || "",
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
    if (!file.type.startsWith("image/")) { sonnerToast.error("Seleccioná una imagen"); return; }
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
      const path = `organizations/${orgId}/captures/${safeUUID()}.${ext}`;
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
      const geoIds = await resolveGeoIds({ department: d.department || "", city: d.city || "", neighborhood: d.neighborhood || "" });
      setForm({
        title: d.title || "", priceRent: d.priceRent ? String(d.priceRent) : "", priceExpenses: d.priceExpenses ? String(d.priceExpenses) : "",
        currency: d.currency || "UYU", neighborhood: geoIds.neighborhood || d.neighborhood || "", neighborhood_id: geoIds.neighborhood_id || "",
        city: geoIds.city || d.city || "", city_id: geoIds.city_id || "", department: geoIds.department || d.department || "", department_id: geoIds.department_id || "",
        address: d.address || "", sqMeters: d.sqMeters ? String(d.sqMeters) : "", rooms: d.rooms ? String(d.rooms) : "",
        aiSummary: d.aiSummary || "", ref: d.ref || "", details: d.details || "",
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
        const path = `organizations/${orgId}/${crypto.randomUUID()}.${ext}`;
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

  const handlePrivateFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { sonnerToast.error("Debés estar logueado"); return; }
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        const ext = file.name.split(".").pop() || "jpg";
        const path = `organizations/${orgId}/private-${safeUUID()}.${ext}`;
        const { error } = await supabase.storage.from("property-images").upload(path, file);
        if (error) { console.error("Upload error:", error); continue; }
        const { data: urlData } = supabase.storage.from("property-images").getPublicUrl(path);
        uploaded.push(urlData.publicUrl);
      }
      if (uploaded.length > 0) {
        setPrivateImages(prev => [...prev, ...uploaded]);
        sonnerToast.success(`${uploaded.length} foto(s) privada(s) agregada(s)`);
      }
    } catch (err) {
      console.error("Upload error:", err);
      sonnerToast.error("Error al subir fotos");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddExistingFromApp = async () => {
    if (!url.trim()) return;
    setIsAddingExistingFromApp(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const existing = await getExistingPropertyByUrl(url);
      if (!existing) {
        sonnerToast.error("No se encontró la propiedad");
        return;
      }

      if (await hasActiveAgentPublicationForOrg(existing.id, orgId)) {
        openDuplicateAgentModal("caso1");
        return;
      }
      if (await hasUserListingsForProperty(existing.id)) {
        openDuplicateAgentModal("caso4");
        return;
      }

      const { error: pubError } = await (supabase
        .from("agent_publications") as any)
        .insert({
          property_id: existing.id,
          org_id: orgId,
          listing_type: "rent" as DbListingType,
          description: existing.details || "",
          published_by: user.id,
        });

      if (pubError) throw pubError;

      setUrlInApp(null);
      toast({ title: "Publicada", description: "La propiedad fue publicada en el marketplace." });
      handleClose();
      onPublished();
    } catch (e: unknown) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "No se pudo publicar", variant: "destructive" });
    } finally {
      setIsAddingExistingFromApp(false);
    }
  };

  const checkDuplicateUrl = async (urlToCheck: string) => {
    if (!urlToCheck.trim()) { setUrlDuplicated(false); return; }
    try {
      const existing = await getExistingPropertyByUrl(urlToCheck);
      setUrlDuplicated(!!existing);
    } catch { setUrlDuplicated(false); }
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const priceRent = Number(form.priceRent) || 0;
      const priceExpenses = listingType === "rent" ? (Number(form.priceExpenses) || 0) : 0;

      if (propertyToEdit) {
        // Update agent_publications
        const { error } = await (supabase
          .from("agent_publications") as any)
          .update({
            description: form.aiSummary || form.details || "",
            listing_type: listingType as DbListingType,
          })
          .eq("id", propertyToEdit.id);
        if (error) throw error;

        // Update underlying properties table
        const propertyId = propertyToEdit.propertyId || propertyToEdit.property_id;
        if (propertyId) {
          const { error: propErr } = await (supabase
            .from("properties") as any)
            .update({
              title: form.title.trim(),
              price_amount: priceRent,
              price_expenses: priceExpenses,
              total_cost: priceRent + priceExpenses,
              currency: form.currency as CurrencyCode,
              address: form.address?.trim() || "",
              neighborhood: form.neighborhood.trim(),
              neighborhood_id: form.neighborhood_id || null,
              city: form.city.trim(),
              city_id: form.city_id || null,
              department: (form as any).department?.trim() || "",
              department_id: (form as any).department_id || null,
              m2_total: Number(form.sqMeters) || 0,
              rooms: Number(form.rooms) || 1,
              images: scrapedImages,
              ref: form.ref || "",
              details: form.aiSummary || form.details || "",
              source_url: url.trim() || null,
            } as any)
            .eq("id", propertyId);
          if (propErr) console.warn("Error updating property:", propErr);
        }

        toast({ title: "Actualizada", description: "La publicación fue actualizada correctamente." });
      } else {
        // Insert: reutilizar property existente si la URL ya existe, sino crear nueva
        let propertyId: string;
        const normalizedUrl = url.trim() ? normalizeUrl(url.trim()) : null;

        if (normalizedUrl) {
          const existing = await getExistingPropertyByUrl(url);
          if (existing) {
            if (await hasActiveAgentPublicationForOrg(existing.id, orgId)) {
              openDuplicateAgentModal("caso1");
              setSaving(false);
              return;
            }
            if (await hasUserListingsForProperty(existing.id)) {
              openDuplicateAgentModal("caso4");
              setSaving(false);
              return;
            }
            propertyId = existing.id;
          } else {
            const { data: prop, error: propError } = await (supabase
              .from("properties") as any)
              .insert({
                source_url: normalizedUrl,
                title: form.title.trim(),
                price_amount: priceRent,
                price_expenses: priceExpenses,
                total_cost: priceRent + priceExpenses,
                currency: form.currency as CurrencyCode,
                address: form.address?.trim() || "",
                neighborhood: form.neighborhood.trim(),
                city: form.city.trim(),
                city_id: (form as any).city_id,
                department: ((form as any).department || "").trim(),
                department_id: (form as any).department_id,
                neighborhood_id: (form as any).neighborhood_id,
                m2_total: Number(form.sqMeters) || 0,
                rooms: Number(form.rooms) || 1,
                images: scrapedImages,
                created_by: user.id,
                ref: form.ref || "",
                details: form.aiSummary || form.details || "",
              } as any)
              .select()
              .single();
            if (propError) throw propError;
            propertyId = prop.id;
          }
        } else {
          const { data: prop, error: propError } = await (supabase
            .from("properties") as any)
            .insert({
              source_url: null,
              title: form.title.trim(),
              price_amount: priceRent,
              price_expenses: priceExpenses,
              total_cost: priceRent + priceExpenses,
              currency: form.currency as CurrencyCode,
              neighborhood: form.neighborhood.trim(),
              city: form.city.trim(),
              city_id: (form as any).city_id,
              department: ((form as any).department || "").trim(),
              department_id: (form as any).department_id,
              neighborhood_id: (form as any).neighborhood_id,
              m2_total: Number(form.sqMeters) || 0,
              rooms: Number(form.rooms) || 1,
              images: scrapedImages,
              created_by: user.id,
              ref: form.ref || "",
              details: form.aiSummary || form.details || "",
            } as any)
            .select()
            .single();
          if (propError) throw propError;
          propertyId = prop.id;
        }

        const { error: pubError } = await (supabase
          .from("agent_publications") as any)
          .insert({
            property_id: propertyId,
            org_id: orgId,
            listing_type: listingType as DbListingType,
            description: form.aiSummary || form.details || "",
            published_by: user.id,
          });

        if (pubError) throw pubError;
        toast({ title: "Publicada", description: "La propiedad fue publicada en el marketplace." });
      }

      handleClose();
      onPublished();
    } catch (e: unknown) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "No se pudo guardar la propiedad", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => { onClose(); };

  const isFormValid = form.title && form.neighborhood && form.priceRent;

  return (
    <>
    <AlertDialog open={duplicateAgentModalOpen} onOpenChange={setDuplicateAgentModalOpen}>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Aviso ya ingresado</AlertDialogTitle>
          <AlertDialogDescription>
            Este aviso ya fue ingresado.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <AlertDialogAction className="rounded-xl w-full sm:w-auto">Entendido</AlertDialogAction>
          <p className="text-center text-[10px] text-muted-foreground">{duplicateAgentModalTag}</p>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {step === "url" ? "Agregar Propiedad" : step === "image-upload" ? "Analizar captura de RRSS" : (propertyToEdit ? "Editar Propiedad" : "Detalles de la Propiedad")}
          </DialogTitle>
        </DialogHeader>

        <ScraperInput
          step={step} url={url} setUrl={(v) => { setUrl(v); setUrlInApp(null); }} isLoading={isLoading} isAnalyzingUnified={isAnalyzingUnified}
          handleScrape={handleScrape} unifiedImageRef={unifiedImageRef} handleUnifiedImageAnalysis={handleUnifiedImageAnalysis}
          setStep={setStep} screenshotInputRef={screenshotInputRef} screenshotFile={screenshotFile} screenshotPreview={screenshotPreview}
          handleScreenshotSelect={handleScreenshotSelect} setScreenshotFile={setScreenshotFile} setScreenshotPreview={setScreenshotPreview}
          handleAnalyzeImage={handleAnalyzeImage} setCameFromImage={setCameFromImage}
          urlInApp={urlInApp}
          isAgent={true}
          onAddExistingFromApp={handleAddExistingFromApp}
          isAddingExistingFromApp={isAddingExistingFromApp}
        />

        {step === "manual" && (
          <PropertyFormManual
            form={form} setForm={setForm} listingType={listingType} setListingType={setListingType}
            cameFromImage={cameFromImage} scrapedImages={scrapedImages} setScrapedImages={setScrapedImages}
            privateImages={privateImages} setPrivateImages={setPrivateImages}
            privateFileInputRef={privateFileInputRef} handlePrivateFileUpload={handlePrivateFileUpload}
            manualImageUrl={manualImageUrl} setManualImageUrl={setManualImageUrl} fileInputRef={fileInputRef}
            handleFileUpload={handleFileUpload} isUploading={isUploading} url={url} setUrl={setUrl}
            urlDuplicated={urlDuplicated} setUrlDuplicated={setUrlDuplicated}
            groups={[]} selectedGroupId={null} setSelectedGroupId={() => {}} setStep={setStep}
            handleSubmit={handleSubmit} isFormValid={isFormValid && !saving}
          />
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}
