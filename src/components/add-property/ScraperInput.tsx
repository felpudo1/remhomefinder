import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link, Sparkles, Loader2, ImageIcon, X, ExternalLink, QrCode } from "lucide-react";
import { QrScannerModal } from "./QrScannerModal";
import { AgentOwnPublicationNotice } from "./AgentOwnPublicationNotice";
import { UserAgentMarketplaceNotice } from "./UserAgentMarketplaceNotice";
import { AgentUserListingsNotice } from "./AgentUserListingsNotice";
import type { AgentMarketplaceListingForUser } from "@/lib/duplicateCheck";

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
    urlInApp?: { firstAddedAt: string; usersCount: number } | null;
    /** Si true, muestra texto específico para agentes en el bloque urlInApp */
    isAgent?: boolean;
    /** Agente: la URL ya está publicada por esta agencia (no duplicar agent_publications) */
    agentOwnDuplicate?: { publishedByName: string; createdAt: string } | null;
    onOpenExistingAgentPublication?: () => void;
    /** Usuario: URL ya en marketplace (caso 2 — contactar agencia por WhatsApp) */
    userAgentMarketplace?: AgentMarketplaceListingForUser | null;
    onOpenExisting?: (userListingId: string) => void;
    onAddExistingFromApp?: () => void;
    isAddingExistingFromApp?: boolean;
}

export function ScraperInput({
    step,
    url,
    setUrl,
    isLoading,
    isAnalyzingUnified = false,
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
    urlInApp,
    isAgent = false,
    agentOwnDuplicate = null,
    onOpenExistingAgentPublication,
    userAgentMarketplace = null,
    onOpenExisting,
    onAddExistingFromApp,
    isAddingExistingFromApp = false,
}: ScraperInputProps) {
    const isFamilyLocked = Boolean(urlInFamily);
    const isInAppLocked = Boolean(urlInApp);
    const isAgentOwnDupLocked = Boolean(agentOwnDuplicate);
    const isUserAgentMarketplaceLocked = Boolean(userAgentMarketplace);
    const [qrOpen, setQrOpen] = useState(false);
    const isUrlActionsLocked =
        isFamilyLocked || isInAppLocked || isAgentOwnDupLocked || isUserAgentMarketplaceLocked;
    const formattedFirstAddedAt = urlInApp?.firstAddedAt
        ? new Date(urlInApp.firstAddedAt).toLocaleDateString("es-UY", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        })
        : "";

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
                                placeholder="http://intocasas.com.uy"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                className="pl-9 rounded-xl"
                                disabled={isUrlActionsLocked}
                                onKeyDown={(e) => !isUrlActionsLocked && e.key === "Enter" && handleScrape()}
                            />
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="rounded-xl shrink-0"
                            onClick={() => setQrOpen(true)}
                            disabled={isUrlActionsLocked}
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
                    onScan={(scannedUrl) => setUrl(scannedUrl)}
                />

                {urlInFamily ? (
                    <AgentOwnPublicationNotice
                        addedByName={urlInFamily.addedByName}
                        addedAtIso={urlInFamily.addedAt}
                        onViewClick={() => onOpenExisting?.(urlInFamily.userListingId)}
                        actionLabel="Para verlo hacé click acá"
                    />
                ) : agentOwnDuplicate ? (
                    <AgentOwnPublicationNotice
                        addedByName={agentOwnDuplicate.publishedByName}
                        addedAtIso={agentOwnDuplicate.createdAt}
                        onViewClick={() => onOpenExistingAgentPublication?.()}
                    />
                ) : userAgentMarketplace ? (
                    <UserAgentMarketplaceNotice
                        agencyName={userAgentMarketplace.agencyName}
                        agentName={userAgentMarketplace.agentName}
                        whatsappDigits={userAgentMarketplace.whatsappDigits}
                        listingUrl={url.trim() || ""}
                    />
                ) : urlInApp && isAgent && onAddExistingFromApp ? (
                    <AgentUserListingsNotice
                        usersCount={urlInApp.usersCount}
                        onPublish={onAddExistingFromApp}
                        isPublishing={isAddingExistingFromApp}
                    />
                ) : urlInApp ? (
                    <div className="bg-blue-50 border border-blue-300 rounded-xl p-4 space-y-3 text-center">
                        <div className="space-y-2 text-blue-900 text-center">
                            <p className="text-sm font-semibold">
                                <strong className="text-2xl md:text-3xl leading-tight block">
                                    💪🔥 ESTA PUBLICACIÓN
                                    <br />
                                    YA ESTÁ EN PUJA 🔥💪
                                </strong>
                            </p>
                            <p className="text-base font-bold">
                                INGRESADA EL DÍA: <span className="text-lg">{formattedFirstAddedAt}</span>
                            </p>
                            <p className="text-base font-bold">
                                <span className="text-lg">
                                    {urlInApp.usersCount} USUARIO{urlInApp.usersCount !== 1 ? "S" : ""} YA LO
                                    GUARDARON EN SU{urlInApp.usersCount !== 1 ? "S" : ""} LISTADO
                                    {urlInApp.usersCount !== 1 ? "S" : ""}
                                </span>
                            </p>
                            <p className="text-sm font-semibold">🔥🔥🔥CONTACTATE YA🔥🔥🔥</p>
                        </div>
                        {onAddExistingFromApp && (
                            <div className="flex justify-center">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-xl gap-2 border-blue-400 text-blue-800 hover:bg-blue-100"
                                    onClick={onAddExistingFromApp}
                                    disabled={isAddingExistingFromApp}
                                >
                                    {isAddingExistingFromApp ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" />Agregando...</>
                                    ) : (
                                        <><ExternalLink className="w-4 h-4" />Hace clik aca para ingresarlo en tu listado</>
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>
                ) : null}

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
