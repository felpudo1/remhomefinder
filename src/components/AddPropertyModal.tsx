import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { formatDaysAgo } from "@/lib/duplicateCheck";
import { toast } from "sonner";
import { ScraperInput } from "./add-property/ScraperInput";
import { PropertyFormManual } from "./add-property/PropertyFormManual";
import { DuplicateAlert } from "./add-property/DuplicateAlert";
import { usePropertyExtractor } from "@/hooks/usePropertyExtractor";
import { useImageUploader } from "@/hooks/useImageUploader";
import { useAddPropertyForm } from "@/hooks/useAddPropertyForm";

interface AddPropertyModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (form: any) => void;
  activeGroupId?: string | null;
  scraper?: "firecrawl" | "zenrows";
  onOpenExisting?: (userListingId: string) => void;
}

export function AddPropertyModal({ open, onClose, onAdd, activeGroupId, scraper = "firecrawl", onOpenExisting }: AddPropertyModalProps) {
  // Hooks de lógica extraída
  const { isLoading, isAnalyzingUnified, handleScrape, handleImagesExtractor } = usePropertyExtractor();
  const { isUploading, screenshotFile, screenshotPreview, handleScreenshotSelect, uploadFiles, uploadScreenshot, resetUploader } = useImageUploader();
  const { 
    form, setForm, updateForm, url, setUrl, step, setStep, listingType, setListingType, cameFromImage, setCameFromImage, 
    selectedGroupId, setSelectedGroupId, scrapedImages, setScrapedImages, privateImages, setPrivateImages, 
    urlDuplicated, setUrlDuplicated, urlInFamily, setUrlInFamily, urlInApp, setUrlInApp, 
    manualLinkRequiredError, setManualLinkRequiredError, isFormValid, manualSubmitBlockers, resetForm, groups 
  } = useAddPropertyForm(activeGroupId);

  const [isAddingFromApp, setIsAddingFromApp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const unifiedImageRef = useRef<HTMLInputElement>(null);
  const screenshotInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const privateFileInputRef = useRef<HTMLInputElement>(null);

  /** Cierre y limpieza del modal */
  const handleClose = () => {
    resetForm();
    resetUploader();
    setIsAddingFromApp(false);
    setIsSubmitting(false);
    onClose();
  };

  /** Flujo de Scraping desde URL */
  const onHandleScrape = async () => {
    const result = await handleScrape(url, selectedGroupId, scraper);
    if (!result) return;
    if (result.duplicateResult) {
      if (result.duplicateResult.case === "in_family") {
        setUrlInFamily(result.duplicateResult as any);
        setUrlDuplicated(true);
      } else if (result.duplicateResult.case === "in_app") {
        setUrlInApp(result.duplicateResult as any);
      }
      return;
    }
    if (result.data) {
      updateForm(result.data);
      if (result.data.listingType) setListingType(result.data.listingType);
      setScrapedImages(result.data.images || []);
      setStep("manual");
    }
  };

  /** Flujo de Análisis de Imágenes (IA Vision) */
  const onHandleImageAnalysis = async (files: FileList | null) => {
    const result = await handleImagesExtractor(files, true);
    if (!result) return;
    if (result.data) {
      updateForm(result.data);
      if (result.data.listingType) setListingType(result.data.listingType);
      setScrapedImages(result.data.images || []);
      setCameFromImage(true);
      setStep("manual");
    }
  };

  /** Flujo de Envío Final */
  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!url.trim()) { setManualLinkRequiredError(true); return; }
    setIsSubmitting(true);
    
    const publicImages = cameFromImage ? [] : scrapedImages;
    const familyImages = cameFromImage ? scrapedImages : privateImages;
    
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
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md rounded-2xl overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {step === "url" ? "Agregar Propiedad" : "Detalles de la Propiedad"}
          </DialogTitle>
        </DialogHeader>

        <ScraperInput
          step={step}
          url={url}
          setUrl={(v) => { setUrl(v); setUrlInFamily(null); setUrlInApp(null); }}
          isLoading={isLoading}
          urlInFamily={urlInFamily}
          urlInApp={urlInApp}
          onOpenExisting={onOpenExisting}
          formatDaysAgo={formatDaysAgo}
          isAnalyzingUnified={isAnalyzingUnified}
          handleScrape={onHandleScrape}
          unifiedImageRef={unifiedImageRef}
          handleUnifiedImageAnalysis={onHandleImageAnalysis}
          setStep={setStep}
          screenshotInputRef={screenshotInputRef}
          screenshotFile={screenshotFile}
          screenshotPreview={screenshotPreview}
          handleScreenshotSelect={handleScreenshotSelect}
          setScreenshotFile={() => {}} 
          setScreenshotPreview={() => {}} 
          handleAnalyzeImage={async () => {
            if (!screenshotFile) return;
            const result = await handleImagesExtractor([screenshotFile], true);
            if (result?.data) {
              updateForm(result.data);
              if (result.data.listingType) setListingType(result.data.listingType);
              setScrapedImages(result.data.images || []);
              setCameFromImage(true);
              setStep("manual");
            }
          }}
          setCameFromImage={setCameFromImage}
          onAddExistingFromApp={async () => {
             setIsAddingFromApp(true);
             await onAdd({ url: url.trim(), groupId: selectedGroupId, listingType, _successMessage: "Publicación agregada correctamente." });
             handleClose();
          }}
          isAddingExistingFromApp={isAddingFromApp}
        />

          {step === "manual" && (
            <>
              <DuplicateAlert urlInFamily={urlInFamily} urlInApp={urlInApp} onOpenExisting={onOpenExisting} formatDaysAgo={formatDaysAgo} />
              <PropertyFormManual
                form={form} setForm={setForm} listingType={listingType} setListingType={setListingType} cameFromImage={cameFromImage}
                scrapedImages={scrapedImages} setScrapedImages={setScrapedImages} privateImages={privateImages} setPrivateImages={setPrivateImages}
                privateFileInputRef={privateFileInputRef} 
                handlePrivateFileUpload={async (f) => {
                  const urls = await uploadFiles(f, true);
                  setPrivateImages(prev => [...prev, ...urls]);
                }}
                manualImageUrl={""} setManualImageUrl={() => {}} fileInputRef={fileInputRef} 
                handleFileUpload={async (f) => {
                  const urls = await uploadFiles(f, false);
                  setScrapedImages(prev => [...prev, ...urls]);
                }}
                isUploading={isUploading} url={url} setUrl={setUrl} linkRequiredError={manualLinkRequiredError} urlDuplicated={urlDuplicated}
                urlAddedByName={null} urlInFamily={urlInFamily} urlInAppMsg={null} formatDaysAgo={formatDaysAgo} setUrlDuplicated={setUrlDuplicated}
                groups={groups} selectedGroupId={selectedGroupId} setSelectedGroupId={setSelectedGroupId} setStep={setStep} handleSubmit={handleSubmit}
                isFormValid={isFormValid} manualSubmitBlockers={manualSubmitBlockers} onExtractFromUrl={onHandleScrape} isExtracting={isLoading}
              />
            </>
          )}
      </DialogContent>
    </Dialog>
  );
}
