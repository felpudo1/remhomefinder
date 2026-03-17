import { useRef } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link, Sparkles, Loader2, Camera, Plus, ImageIcon, X, ExternalLink } from "lucide-react";

export interface ScraperInputProps {
    step: "url" | "image-upload" | "manual";
    url: string;
    setUrl: (url: string) => void;
    isLoading: boolean;
    isAnalyzingUnified: boolean;
    handleScrape: () => void;
    unifiedImageRef: React.RefObject<HTMLInputElement>;
    handleUnifiedImageAnalysis: (files: FileList | null) => void;
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
    onOpenExisting?: (userListingId: string) => void;
    formatDaysAgo?: (isoDate: string) => string;
}

export function ScraperInput({
    step,
    url,
    setUrl,
    isLoading,
    isAnalyzingUnified,
    handleScrape,
    unifiedImageRef,
    handleUnifiedImageAnalysis,
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
    onOpenExisting,
    formatDaysAgo,
}: ScraperInputProps) {
    if (step === "url") {
        return (
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

                {urlInFamily ? (
                    <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 space-y-3">
                        <p className="text-sm text-amber-900 font-medium">
                            Este aviso ya existe en tu listado familiar. Fue ingresado por <strong>{urlInFamily.addedByName}</strong> {formatDaysAgo ? formatDaysAgo(urlInFamily.addedAt) : ""}.
                        </p>
                        {onOpenExisting && (
                            <Button variant="outline" size="sm" className="rounded-xl gap-2 border-amber-400 text-amber-800 hover:bg-amber-100" onClick={() => { onOpenExisting(urlInFamily.userListingId); }}>
                                <ExternalLink className="w-4 h-4" />
                                Para verlo hacé click acá
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 text-xs text-destructive font-medium leading-relaxed">
                        <strong>AVISO:</strong> Para ingresar publicaciones de MARKETPLACE y redes sociales, debe sacar captura con los datos y click en <strong>Analizar fotos de RRSS</strong> o agregar las publicaciones manualmente.
                    </div>
                )}

                <Button onClick={handleScrape} disabled={!url.trim() || isLoading || !!urlInFamily} className="w-full rounded-xl gap-2">
                    {isLoading ? (
                        <><Loader2 className="w-4 h-4 animate-spin" />Extrayendo datos...</>
                    ) : (
                        <><Sparkles className="w-4 h-4" />Extraer datos de la publicación</>
                    )}
                </Button>

                <input
                    ref={unifiedImageRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleUnifiedImageAnalysis(e.target.files)}
                />

                <div className="relative">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                    <div className="relative flex justify-center"><span className="bg-background px-3 text-xs text-muted-foreground">o</span></div>
                </div>

                <Button
                    variant="secondary"
                    onClick={() => unifiedImageRef.current?.click()}
                    disabled={isAnalyzingUnified || isLoading}
                    className="w-full rounded-xl gap-2"
                >
                    {isAnalyzingUnified ? (
                        <><Loader2 className="w-4 h-4 animate-spin" />Analizando imágenes...</>
                    ) : (
                        <><Camera className="w-4 h-4" />Analizar fotos de RRSS (1-3 imágenes)</>
                    )}
                </Button>

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
