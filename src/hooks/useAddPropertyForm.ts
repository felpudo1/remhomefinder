import { useState, useEffect } from "react";
import { useGroups } from "@/hooks/useGroups";
import type { AgentMarketplaceListingForUser } from "@/lib/duplicateCheck";

export type FormState = {
  title: string;
  priceRent: string;
  priceExpenses: string;
  currency: "USD" | "UYU" | "UI";
  neighborhood: string;
  neighborhood_id: string;
  city: string;
  city_id: string;
  department: string;
  department_id: string;
  sqMeters: string;
  rooms: string;
  aiSummary: string;
  ref: string;
  details: string;
  contactName: string;
  contactPhone: string;
  onBehalfOfUserId?: string;
  onBehalfOfOrgId?: string;
};

export function useAddPropertyForm(activeGroupId?: string | null) {
  const { groups } = useGroups();
  
  const getDefaultFamilyGroupId = () => {
    const firstFamilyGroup = groups.find((group) => group.type === "family");
    return firstFamilyGroup?.id ?? null;
  };

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(activeGroupId || getDefaultFamilyGroupId());
  const [listingType, setListingType] = useState<"rent" | "sale">("rent");
  const [url, setUrl] = useState("");
  const [step, setStep] = useState<"url" | "image-upload" | "manual">("url");
  const [cameFromImage, setCameFromImage] = useState(false);
  
  // Scraped/Manual Images
  const [scrapedImages, setScrapedImages] = useState<string[]>([]);
  const [privateImages, setPrivateImages] = useState<string[]>([]);
  const [manualImageUrl, setManualImageUrl] = useState("");

  // Duplicate states
  const [urlDuplicated, setUrlDuplicated] = useState(false);
  const [urlAddedByName, setUrlAddedByName] = useState<string | null>(null);
  const [urlInFamily, setUrlInFamily] = useState<{ addedByName: string; addedAt: string; status: string; userListingId: string } | null>(null);
  const [urlInApp, setUrlInApp] = useState<{ firstAddedAt: string; usersCount: number } | null>(null);
  /** Caso 2: URL ya publicada por agente — cartel azul + WhatsApp */
  const [userAgentMarketplace, setUserAgentMarketplace] = useState<AgentMarketplaceListingForUser | null>(null);
  const [urlInAppMsg, setUrlInAppMsg] = useState<string | null>(null);
  const [manualLinkRequiredError, setManualLinkRequiredError] = useState(false);

  const [form, setForm] = useState<FormState>({
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
    onBehalfOfUserId: undefined,
    onBehalfOfOrgId: undefined,
  });

  // Sync with activeGroupId or groups change
  useEffect(() => {
    if (activeGroupId) {
      setSelectedGroupId(activeGroupId);
    } else {
      setSelectedGroupId((current) => current ?? getDefaultFamilyGroupId());
    }
  }, [activeGroupId, groups]);

  const resetForm = () => {
    setUrl("");
    setForm({
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
      onBehalfOfUserId: undefined,
      onBehalfOfOrgId: undefined,
    });
    setScrapedImages([]);
    setPrivateImages([]);
    setManualImageUrl("");
    setUrlDuplicated(false);
    setUrlAddedByName(null);
    setUrlInFamily(null);
    setUrlInApp(null);
    setUserAgentMarketplace(null);
    setUrlInAppMsg(null);
    setManualLinkRequiredError(false);
    setListingType("rent");
    setStep("url");
    setCameFromImage(false);
  };

  const updateForm = (newData: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...newData }));
  };

  const hasTitle = String(form.title || "").trim().length > 0;
  const hasPrice = String(form.priceRent || "").trim().length > 0;
  const hasLocation = Boolean(form.department_id && form.city_id && form.neighborhood_id);
  const hasUrl = String(url || "").trim().length > 0;
  const hasAgent = Boolean(form.onBehalfOfUserId);

  const isFormValid = hasTitle && hasPrice && hasLocation && hasUrl && hasAgent && !urlDuplicated && !urlInFamily;

  const getManualSubmitBlockers = () => {
    const blockers: string[] = [];
    if (!hasUrl) blockers.push("link de la publicación");
    if (!hasLocation) blockers.push("departamento, ciudad y barrio");
    if (!hasTitle) blockers.push("título");
    if (!hasPrice) blockers.push(listingType === "sale" ? "precio de venta" : "alquiler");
    if (!hasAgent) blockers.push("agente asignado");
    if (urlDuplicated || urlInFamily) blockers.push("esta URL ya está en tu familia");
    return blockers;
  };

  return {
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
    manualImageUrl,
    setManualImageUrl,
    urlDuplicated,
    setUrlDuplicated,
    urlAddedByName,
    setUrlAddedByName,
    urlInFamily,
    setUrlInFamily,
    urlInApp,
    setUrlInApp,
    userAgentMarketplace,
    setUserAgentMarketplace,
    urlInAppMsg,
    setUrlInAppMsg,
    manualLinkRequiredError,
    setManualLinkRequiredError,
    isFormValid,
    manualSubmitBlockers: getManualSubmitBlockers(),
    resetForm,
    groups
  };
}
