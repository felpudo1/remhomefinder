import { useRef, useState, useEffect } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { formatDaysAgo, type InAppResult } from "@/lib/duplicateCheck";
import { toast } from "sonner";
import { ScraperInput } from "./add-property/ScraperInput";
import { PropertyFormManual } from "./add-property/PropertyFormManual";
import { DuplicateAlert } from "./add-property/DuplicateAlert";
import { usePropertyExtractor } from "@/hooks/usePropertyExtractor";
import { useImageUploader } from "@/hooks/useImageUploader";
import { useAddPropertyForm, type FormState } from "@/hooks/useAddPropertyForm";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, ImageIcon, X } from "lucide-react";

/** Estado inicial del formulario cuando el scrape falla y el usuario completa con capturas o a mano */
const EMPTY_FORM: FormState = {
  title: "",
  priceRent: "",
  priceExpenses: "",
  currency: "USD",
  neighborhood: "",
  neighborhood_id: "",
  city: "",
  city_id: "",
  department: "",
  department_id: "",
  sqMeters: "",
  rooms: "",
  aiSummary: "",
  ref: "",
  details: "",
  contactName: "",
  contactPhone: "",
};

interface AddPropertyModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (form: any) => void;
  activeGroupId?: string | null;
  scraper?: "firecrawl" | "zenrows";
  onOpenExisting?: (userListingId: string) => void;
}

export function AddPropertyModal({ open, onClose, onAdd, activeGroupId, scraper = "firecrawl", onOpenExisting }: AddPropertyModalProps) {
  const { isLoading, isAnalyzingUnified, handleScrape, handleImagesExtractor } = usePropertyExtractor();
  const { isUploading, resetUploader, uploadFiles } = useImageUploader();
  const {
    form,
    setForm,
    updateForm,
    url,
    setUrl,
    step,
    setStep,
    listingType,
    setListingType,
    cameFromImage,
    setCameFromImage,
    selectedGroupId,
    setSelectedGroupId,
    scrapedImages,
    setScrapedImages,
    privateImages,
    setPrivateImages,
    urlDuplicated,
    setUrlDuplicated,
    urlInFamily,
    setUrlInFamily,
    urlInApp,
    setUrlInApp,
    manualLinkRequiredError,
    setManualLinkRequiredError,
    isFormValid,
    manualSubmitBlockers,
    resetForm,
    groups,
  } = useAddPropertyForm(activeGroupId);

  const [isAddingFromApp, setIsAddingFromApp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  /** Caso 2: aviso ya en marketplace por agencia; mostrar modal con nombre(s) */
  const [agentListingModalOpen, setAgentListingModalOpen] = useState(false);
  const [agentListingAgencyNames, setAgentListingAgencyNames] = useState("");
  /** Caso 3: mismo usuario/familia ya ingresó el aviso (properties + user_listings) */
  const [familyDuplicateModalOpen, setFamilyDuplicateModalOpen] = useState(false);
  /** Tras fallar el scrape: mostrar bloque de capturas + analizar con IA */
  const [showImageFallback, setShowImageFallback] = useState(false);
  /** Archivos locales elegidos o pegados antes de subir (máx. 3) */
  const [pendingScreenFiles, setPendingScreenFiles] = useState<File[]>([]);
  const [screenPreviewUrls, setScreenPreviewUrls] = useState<string[]>([]);

  const pendingScreensInputRef = useRef<HTMLInputElement>(null);
  const privateFileInputRef = useRef<HTMLInputElement>(null);
  const formFileInputRef = useRef<HTMLInputElement>(null);
  const screenshotInputRef = useRef<HTMLInputElement>(null);

  /** Previews locales con revoke al cambiar o desmontar */
  useEffect(() => {
    const urls = pendingScreenFiles.map((f) => URL.createObjectURL(f));
    setScreenPreviewUrls(urls);
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [pendingScreenFiles]);

  const handleClose = () => {
    resetForm();
    resetUploader();
    setIsAddingFromApp(false);
    setIsSubmitting(false);
    setShowImageFallback(false);
    setPendingScreenFiles([]);
    setAgentListingModalOpen(false);
    setAgentListingAgencyNames("");
    setFamilyDuplicateModalOpen(false);
    onClose();
  };

  /** Vuelve al paso URL: el usuario puede corregir el link; limpiamos el formulario para no mezclar datos de otro intento */
  const handleBackToUrl = () => {
    setStep("url");
    setShowImageFallback(false);
    setCameFromImage(false);
    setPendingScreenFiles([]);
    setUrlInFamily(null);
    setUrlInApp(null);
    setUrlDuplicated(false);
    setFamilyDuplicateModalOpen(false);
    setForm(EMPTY_FORM);
    setScrapedImages([]);
    setListingType("rent");
    setManualLinkRequiredError(false);
  };

  /** Flujo de scraping: éxito → detalles con link fijo; fallo → mismo paso con bloque de capturas */
  const onHandleScrape = async () => {
    const result = await handleScrape(url, selectedGroupId, scraper);
    if (!result) return;
    if (result.duplicateResult) {
      if (result.duplicateResult.case === "in_family") {
        setFamilyDuplicateModalOpen(true);
        return;
      } else if (result.duplicateResult.case === "in_app") {
        const dr = result.duplicateResult as InAppResult;
        if (dr.agentAgencyNames?.length) {
          setAgentListingAgencyNames(dr.agentAgencyNames.join(", "));
          setAgentListingModalOpen(true);
          return;
        }
        setUrlInApp(result.duplicateResult as any);
      }
      return;
    }
    if (result.data) {
      setShowImageFallback(false);
      updateForm(result.data);
      if (result.data.listingType) setListingType(result.data.listingType);
      setScrapedImages(result.data.images || []);
      setCameFromImage(false);
      setStep("manual");
      return;
    }
    if ("error" in result && result.error) {
      setForm(EMPTY_FORM);
      setScrapedImages([]);
      setCameFromImage(false);
      setListingType("rent");
      setManualLinkRequiredError(false);
      setShowImageFallback(true);
      setPendingScreenFiles([]);
      setStep("manual");
    }
  };

  /** Agrega imágenes pegadas o elegidas hasta 3 */
  const addPendingImageFiles = (files: File[]) => {
    const next = [...pendingScreenFiles];
    for (const f of files) {
      if (next.length >= 3) break;
      if (f.type.startsWith("image/")) next.push(f);
    }
    setPendingScreenFiles(next.slice(0, 3));
  };

  const handlePasteScreens = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items?.length) return;
    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind !== "file") continue;
      const f = item.getAsFile();
      if (f?.type.startsWith("image/")) files.push(f);
    }
    if (files.length) {
      e.preventDefault();
      addPendingImageFiles(files);
    }
  };

  const onAnalyzePendingScreens = async () => {
    if (pendingScreenFiles.length === 0) {
      toast.info("Agregá al menos una captura o elegí imágenes del dispositivo.");
      return;
    }
    const result = await handleImagesExtractor(pendingScreenFiles, true);
    if (result && "data" in result && result.data) {
      updateForm(result.data);
      if (result.data.listingType) setListingType(result.data.listingType);
      setScrapedImages(result.data.images || []);
      setCameFromImage(true);
      setShowImageFallback(false);
      setPendingScreenFiles([]);
      return;
    }
    if (result && "uploadedUrls" in result && Array.isArray(result.uploadedUrls) && result.uploadedUrls.length > 0) {
      setScrapedImages((prev) => [...new Set([...prev, ...result.uploadedUrls!])]);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!url.trim()) {
      setManualLinkRequiredError(true);
      return;
    }
    setIsSubmitting(true);

    const publicImages = cameFromImage ? [] : scrapedImages;
    const familyImages = cameFromImage ? scrapedImages : privateImages;

    const hasContact = !!(form.contactName?.trim() || form.contactPhone?.trim());
    let contactSource: string | undefined;
    if (hasContact) {
      contactSource = cameFromImage ? "image_ocr" : scrapedImages.length > 0 ? "scrape" : "manual";
    }

    const formData = {
      ...form,
      url: url || "",
      priceRent: Number(form.priceRent) || 0,
      priceExpenses: Number(form.priceExpenses) || 0,
      sqMeters: Number(form.sqMeters) || 0,
      rooms: Number(form.rooms) || 1,
      images: publicImages,
      privateImages: familyImages.length > 0 ? familyImages : undefined,
      groupId: selectedGroupId,
      listingType,
      contactName: form.contactName?.trim() || undefined,
      contactPhone: form.contactPhone?.trim() || undefined,
      contactSource,
    };

    try {
      await onAdd(formData);
      handleClose();
    } catch (err) {
      console.error("Submit error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
    <AlertDialog open={agentListingModalOpen} onOpenChange={setAgentListingModalOpen}>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Aviso ya ingresado</AlertDialogTitle>
          <AlertDialogDescription>
            Agencia {agentListingAgencyNames}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <AlertDialogAction className="rounded-xl w-full sm:w-auto">Entendido</AlertDialogAction>
          <p className="text-center text-[10px] text-muted-foreground">caso2</p>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <AlertDialog open={familyDuplicateModalOpen} onOpenChange={setFamilyDuplicateModalOpen}>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Aviso ya ingresado</AlertDialogTitle>
          <AlertDialogDescription>
            Este aviso ya fue ingresado.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <AlertDialogAction className="rounded-xl w-full sm:w-auto">Entendido</AlertDialogAction>
          <p className="text-center text-[10px] text-muted-foreground">caso3</p>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md rounded-2xl overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {step === "url" ? "Agregar Propiedad" : "Detalles de la Propiedad"}
          </DialogTitle>
        </DialogHeader>

        {step === "url" && (
          <ScraperInput
            step={step}
            url={url}
            setUrl={(v) => {
              setUrl(v);
              setUrlInFamily(null);
              setUrlInApp(null);
            }}
            isLoading={isLoading}
            urlInFamily={urlInFamily}
            urlInApp={urlInApp}
            onOpenExisting={onOpenExisting}
            formatDaysAgo={formatDaysAgo}
            handleScrape={onHandleScrape}
            setStep={setStep}
            screenshotInputRef={screenshotInputRef}
            screenshotFile={null}
            screenshotPreview={null}
            handleScreenshotSelect={() => {}}
            setScreenshotFile={() => {}}
            setScreenshotPreview={() => {}}
            handleAnalyzeImage={() => {}}
            setCameFromImage={setCameFromImage}
            onAddExistingFromApp={async () => {
              setIsAddingFromApp(true);
              await onAdd({ url: url.trim(), groupId: selectedGroupId, listingType, _successMessage: "Publicación agregada correctamente." });
              handleClose();
            }}
            isAddingExistingFromApp={isAddingFromApp}
          />
        )}

        {step === "manual" && (
          <>
            <DuplicateAlert urlInFamily={urlInFamily} urlInApp={urlInApp} onOpenExisting={onOpenExisting} formatDaysAgo={formatDaysAgo} />

            {showImageFallback && (
              <div
                className="space-y-3 rounded-xl border border-primary/25 bg-primary/5 p-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                tabIndex={0}
                onPaste={handlePasteScreens}
              >
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-primary shrink-0" />
                  <Label className="text-sm font-medium leading-tight">Capturas del aviso (hasta 3)</Label>
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Sacá screenshot del aviso (Instagram, Facebook, etc.) y pegalo acá con <strong>Ctrl+V</strong>, o tocá el botón para elegir fotos. Después tocá <strong>Analizar imágenes</strong> y revisá los datos abajo.
                </p>
                <input
                  ref={pendingScreensInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const list = e.target.files;
                    if (!list?.length) return;
                    addPendingImageFiles(Array.from(list));
                    e.target.value = "";
                  }}
                />
                {screenPreviewUrls.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {screenPreviewUrls.map((src, i) => (
                      <div key={src} className="relative aspect-square rounded-lg overflow-hidden border border-border bg-muted">
                        <img src={src} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          className="absolute top-1 right-1 rounded-full bg-destructive text-destructive-foreground p-1"
                          onClick={() => setPendingScreenFiles((prev) => prev.filter((_, idx) => idx !== i))}
                          aria-label="Quitar captura"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => pendingScreensInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-border rounded-xl py-6 text-sm text-muted-foreground hover:border-primary/40 transition-colors"
                  >
                    Tocá para elegir imágenes (o pegá con Ctrl+V en esta caja)
                  </button>
                )}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-xl flex-1"
                    disabled={pendingScreenFiles.length >= 3}
                    onClick={() => pendingScreensInputRef.current?.click()}
                  >
                    Elegir del dispositivo
                  </Button>
                  <Button
                    type="button"
                    className="rounded-xl flex-1 gap-2"
                    disabled={pendingScreenFiles.length === 0 || isAnalyzingUnified}
                    onClick={onAnalyzePendingScreens}
                  >
                    {isAnalyzingUnified ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Analizando…
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Analizar imágenes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

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
              handlePrivateFileUpload={async (f) => {
                const urls = await uploadFiles(f, true);
                setPrivateImages((prev) => [...prev, ...urls]);
              }}
              manualImageUrl={""}
              setManualImageUrl={() => {}}
              fileInputRef={formFileInputRef}
              handleFileUpload={async (f) => {
                const urls = await uploadFiles(f, false);
                setScrapedImages((prev) => [...prev, ...urls]);
              }}
              isUploading={isUploading}
              url={url}
              setUrl={setUrl}
              linkRequiredError={manualLinkRequiredError}
              urlDuplicated={urlDuplicated}
              urlAddedByName={null}
              urlInFamily={urlInFamily}
              urlInAppMsg={null}
              formatDaysAgo={formatDaysAgo}
              setUrlDuplicated={setUrlDuplicated}
              groups={groups}
              selectedGroupId={selectedGroupId}
              setSelectedGroupId={setSelectedGroupId}
              setStep={setStep}
              onBackToUrl={handleBackToUrl}
              urlLocked
              handleSubmit={handleSubmit}
              isFormValid={isFormValid && !isSubmitting}
              manualSubmitBlockers={manualSubmitBlockers}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}
