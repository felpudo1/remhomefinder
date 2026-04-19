import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link, Sparkles, Loader2, ImageIcon, X, QrCode } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { QrScannerModal } from "./QrScannerModal";
import { DuplicateAlertDialog } from "./DuplicateAlertDialog";
import type {
  AgentMarketplaceListingForUser,
} from "@/lib/duplicateCheck";

export interface ScraperInputProps {
    step: "url" | "image-upload" | "manual";
    url: string;
    setUrl: (url: string) => void;
    isLoading: boolean;
    /** Solo se usaba en el paso URL antiguo; opcional por compatibilidad. */
    isAnalyzingUnified?: boolean;
    handleScrape: () => void;
    unifiedImageRef?: React.RefObject<HTMLInputElement | null>;
    handleUnifiedImageAnalysis?: (files: FileList | null) => void;
    setStep: (step: "url" | "image-upload" | "manual") => void;
    // Para image-upload
    screenshotInputRef: React.RefObject<HTMLInputElement>;
    screenshotFile: File | null;
    screenshotPreview: string | null;
    handleScreenshotSelect: (files: FileList | null) => void;
    setScreenshotFile: (f: File | null) => void;
    setScreenshotPreview: (p: string | null) => void;
    handleAnalyzeImage: () => void;
    setCameFromImage: (v: boolean) => void;
    urlInFamily?: { addedByName: string; addedAt: string; status: string; userListingId: string } | null;
    setUrlInFamily?: (v: { addedByName: string; addedAt: string; status: string; userListingId: string } | null) => void;
    urlInApp?: { firstAddedAt: string; usersCount: number; users?: import('@/types/duplicate-cases').UserWithListing[] } | null;
    setUrlInApp?: (v: { firstAddedAt: string; usersCount: number; users?: import('@/types/duplicate-cases').UserWithListing[] } | null) => void;
    /** Si true, muestra texto específico para agentes en el bloque urlInApp */
    isAgent?: boolean;
    /** Agente: la URL ya está publicada por esta agencia (no duplicar agent_publications) */
    agentOwnDuplicate?: { publishedByName: string; createdAt: string; id?: string } | null;
    setAgentOwnDuplicate?: (v: { publishedByName: string; createdAt: string; id?: string } | null) => void;
    onOpenExistingAgentPublication?: (agentPublicationId: string) => void;
    /** Usuario: URL ya en marketplace (caso 2 — contactar agencia por WhatsApp) */
    userAgentMarketplace?: AgentMarketplaceListingForUser | null;
    setUserAgentMarketplace?: (v: AgentMarketplaceListingForUser | null) => void;
    onOpenExisting?: (userListingId: string) => void;
    onAddExistingFromApp?: () => void;
    isAddingExistingFromApp?: boolean;
    /** Callback para cerrar el modal padre (AddPropertyModal) */
    onCloseParent?: () => void;
    /** Nombre de la app (desde system_config) */
    appName?: string;
}

export function ScraperInput({
    step,
    url,
    setUrl,
    isLoading,
    handleScrape,
    unifiedImageRef: _unifiedImageRef,
    handleUnifiedImageAnalysis: _handleUnifiedImageAnalysis,
    setStep,
    screenshotInputRef,
    screenshotFile,
    screenshotPreview,
    handleScreenshotSelect,
    setScreenshotFile,
    setScreenshotPreview,
    handleAnalyzeImage,
    setCameFromImage,
    urlInFamily,
    setUrlInFamily,
    urlInApp,
    setUrlInApp,
    isAgent: _isAgent = false,
    agentOwnDuplicate = null,
    setAgentOwnDuplicate,
    onOpenExistingAgentPublication,
    userAgentMarketplace = null,
    setUserAgentMarketplace,
    onOpenExisting,
    onAddExistingFromApp,
    isAddingExistingFromApp = false,
    onCloseParent,
    appName = "HomeFinder",
}: ScraperInputProps) {
    const isFamilyLocked = Boolean(urlInFamily);
    const isInAppLocked = Boolean(urlInApp);
    const isAgentOwnDupLocked = Boolean(agentOwnDuplicate);
    const isUserAgentMarketplaceLocked = Boolean(userAgentMarketplace);
    const [qrOpen, setQrOpen] = useState(false);
    const isUrlActionsLocked =
        isFamilyLocked || isInAppLocked || isAgentOwnDupLocked || isUserAgentMarketplaceLocked;
    // urlInApp data used in DuplicateAlertDialog below via props

    const navigate = useNavigate();
    const { toast } = useToast();

    // --- INTERCEPTOR INTELIGENTE DE QR ---
    const handleQrIntercept = (scannedUrl: string) => {
        try {
            const urlObj = new URL(scannedUrl);
            const currentOrigin = window.location.origin;
            
            // Evaluamos si es una URL generada por nuestra propia App (RemHomeFinder)
            // Se fija que empiece con /p/ y tenga source=qr
            if (
                (urlObj.origin === currentOrigin || urlObj.hostname.includes("remhomefinder")) 
                && urlObj.pathname.startsWith('/p/') 
                && urlObj.searchParams.has('source')
            ) {
                console.log("💎 QR Interno detectado, cerrando modal y navegando...", scannedUrl);
                toast({
                    title: "¡Propiedad de red detectada!",
                    description: "Abriendo ficha de la propiedad para vista inmediata...",
                    variant: "default"
                });
                setQrOpen(false);
                if (onCloseParent) onCloseParent(); // Cierra el "AddPropertyModal" si estuviese abierto
                navigate(urlObj.pathname + urlObj.search); // Nos lleva directito a PublicPropertyView
                return;
            }
        } catch (e) {
            // URL inparseable o cualquier error sintáctico, seguimos el flujo natural
        }
        
        // Flujo tradicional: es un enlace de rematador o externo
        setUrl(scannedUrl);
        setQrOpen(false);
    };

    if (step === "url") {
        return (
            <div className="space-y-5 py-2">
                <div className="space-y-2">
                    <Label className="text-sm font-medium">Pegá la URL del aviso</Label>
                    <div className="relative flex gap-2">
                        <div className="relative flex-1">
                            <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                type="url"
                                placeholder="http://infocasas.com.uy..."
                                value={url}
                                onChange={(e) => {
                                    setUrl(e.target.value);
                                    if(e.target.value.includes('/p/') && e.target.value.includes('source=')) {
                                        handleQrIntercept(e.target.value);
                                    }
                                }}
                                className="pl-9 rounded-xl"
                                disabled={isUrlActionsLocked || isLoading}
                                onKeyDown={(e) => !isUrlActionsLocked && !isLoading && e.key === "Enter" && handleScrape()}
                            />
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="rounded-xl shrink-0"
                            onClick={() => setQrOpen(true)}
                            disabled={isUrlActionsLocked || isLoading}
                            title="Escanear código QR"
                        >
                            <QrCode className="w-4 h-4" />
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Pegá cualquier URL de un aviso inmobiliario y nuestra IA extraerá todos los detalles automáticamente.
                    </p>
                </div>

                <QrScannerModal
                    open={qrOpen}
                    onClose={() => setQrOpen(false)}
                    onScan={handleQrIntercept}
                />

                {/* -- Duplicate Alert Dialog (replaces inline notices) -- */}
                {/* Orden de prioridad: C2a > C3 > C1 > C2b > C4 */}
                
                {userAgentMarketplace && urlInFamily && (
                  /* C2a: Ya está en marketplace Y en el listado del usuario */
                  <DuplicateAlertDialog
                    case="C2a"
                    agencyName={userAgentMarketplace.agencyName}
                    agentName={userAgentMarketplace.agentName}
                    whatsappDigits={userAgentMarketplace.whatsappDigits}
                    listingUrl={url.trim() || ""}
                    userListingId={urlInFamily.userListingId}
                    onClose={() => {
                      setUserAgentMarketplace?.(null);
                    }}
                    onCloseParent={onCloseParent}
                  />
                )}
                {!userAgentMarketplace && urlInFamily && (
                  /* C3: Solo en el listado familiar (sin marketplace) */
                  <DuplicateAlertDialog
                    case="C3"
                    addedByName={urlInFamily.addedByName}
                    addedAt={urlInFamily.addedAt}
                    status={urlInFamily.status}
                    userListingId={urlInFamily.userListingId}
                    appName={appName}
                    onClose={() => {
                      setUrlInFamily?.(null);
                    }}
                    onOpenListing={onOpenExisting}
                    onCloseParent={onCloseParent}
                  />
                )}
                {agentOwnDuplicate && (
                  <DuplicateAlertDialog
                    case="C1"
                    publishedByName={agentOwnDuplicate.publishedByName}
                    createdAt={agentOwnDuplicate.createdAt}
                    agentPublicationId={agentOwnDuplicate.id}
                    onClose={() => {
                      setAgentOwnDuplicate?.(null);
                    }}
                    onCloseParent={onCloseParent}
                    onOpenAgentPublication={onOpenExistingAgentPublication}
                  />
                )}
                {userAgentMarketplace && !urlInFamily && (
                  /* C2b: Ya está en marketplace pero NO en el listado del usuario */
                  <DuplicateAlertDialog
                    case="C2b"
                    agencyName={userAgentMarketplace.agencyName}
                    agentName={userAgentMarketplace.agentName}
                    whatsappDigits={userAgentMarketplace.whatsappDigits}
                    listingUrl={url.trim() || ""}
                    onClose={() => {
                      setUserAgentMarketplace?.(null);
                    }}
                    onCloseParent={onCloseParent}
                    onSaveToListing={onAddExistingFromApp}
                    isSaving={isAddingExistingFromApp}
                  />
                )}
                {urlInApp && !userAgentMarketplace && (
                  <DuplicateAlertDialog
                    case="C4"
                    usersCount={urlInApp.usersCount}
                    users={urlInApp.users || []}
                    onAddExisting={onAddExistingFromApp || (() => {})}
                    isAdding={isAddingExistingFromApp}
                    onClose={() => {
                      setUrlInApp?.(null);
                    }}
                  />
                )}

                <Button onClick={handleScrape} disabled={!url.trim() || isLoading || isUrlActionsLocked} className="w-full rounded-xl gap-2">
                    {isLoading ? (
                        <><Loader2 className="w-4 h-4 animate-spin" />Extrayendo datos...</>
                    ) : (
                        <><Sparkles className="w-4 h-4" />Extraer datos de la publicación</>
                    )}
                </Button>

                <p className="text-[11px] text-muted-foreground text-center leading-snug">
                    Si el link es de redes sociales o no se puede leer automático, en el siguiente paso podrás pegar capturas de pantalla y la IA completará lo que pueda.
                </p>
            </div>
        );
    }

    if (step === "image-upload") {
        return (
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
        );
    }

    return null;
}
