import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Camera, Sparkles, ImageIcon, X, Plus, Upload, Link, Users } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export interface PropertyFormManualProps {
    form: any;
    setForm: (f: any) => void;
    listingType: "rent" | "sale";
    setListingType: (t: "rent" | "sale") => void;
    cameFromImage: boolean;
    scrapedImages: string[];
    setScrapedImages: React.Dispatch<React.SetStateAction<string[]>>;
    privateImages: string[];
    setPrivateImages: React.Dispatch<React.SetStateAction<string[]>>;
    privateFileInputRef: React.RefObject<HTMLInputElement>;
    handlePrivateFileUpload: (files: FileList | null) => void;
    manualImageUrl: string;
    setManualImageUrl: (url: string) => void;
    fileInputRef: React.RefObject<HTMLInputElement>;
    handleFileUpload: (files: FileList | null) => void;
    isUploading: boolean;
    url: string;
    setUrl: (url: string) => void;
    urlDuplicated: boolean;
    urlAddedByName?: string | null;
    urlInFamily?: { addedByName: string; addedAt: string; status: string; userListingId: string } | null;
    urlInAppMsg?: string | null;
    formatDaysAgo?: (isoDate: string) => string;
    setUrlDuplicated: (d: boolean) => void;
    checkDuplicateUrl: (url: string) => void;
    groups: any[];
    selectedGroupId: string | null;
    setSelectedGroupId: (id: string | null) => void;
    setStep: (step: "url" | "image-upload" | "manual") => void;
    handleSubmit: () => void | Promise<void>;
    isFormValid: boolean;
}

export function PropertyFormManual({
    form,
    setForm,
    listingType,
    setListingType,
    cameFromImage,
    scrapedImages,
    setScrapedImages,
    privateImages,
    setPrivateImages,
    privateFileInputRef,
    handlePrivateFileUpload,
    manualImageUrl,
    setManualImageUrl,
    fileInputRef,
    handleFileUpload,
    isUploading,
    url,
    setUrl,
    urlDuplicated,
    urlAddedByName,
    urlInFamily,
    urlInAppMsg,
    setUrlDuplicated,
    checkDuplicateUrl,
    groups,
    selectedGroupId,
    setSelectedGroupId,
    setStep,
    handleSubmit,
    isFormValid,
}: PropertyFormManualProps) {
    return (
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

            {/* Fotos section */}
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
                                        onClick={() => setScrapedImages((prev) => prev.filter((_, idx) => idx !== i))}
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

            {/* Fotos privadas (solo tu familia) */}
            <div className="space-y-1.5 bg-primary/5 border border-primary/20 rounded-xl p-3">
                <Label className="text-xs font-medium flex items-center gap-1">
                    <ImageIcon className="w-3 h-3" />
                    Fotos privadas (solo tu familia)
                </Label>
                <p className="text-[10px] text-muted-foreground">Fotos de visitas, capturas, etc. Solo las ve tu familia.</p>
                {privateImages.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2 mt-2">
                        {privateImages.map((img, i) => (
                            <div key={i} className="group relative aspect-square rounded-xl overflow-hidden border border-border bg-muted">
                                <img src={img} alt={`Privada ${i + 1}`} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).parentElement?.classList.add('hidden'); }} />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button type="button" onClick={() => setPrivateImages((prev) => prev.filter((_, idx) => idx !== i))} className="bg-destructive text-destructive-foreground p-1.5 rounded-full" title="Eliminar">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : null}
                <input ref={privateFileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { handlePrivateFileUpload(e.target.files); e.target.value = ""; }} />
                <Button type="button" variant="outline" size="sm" className="rounded-xl gap-1.5 text-xs" disabled={isUploading} onClick={() => privateFileInputRef.current?.click()}>
                    {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                    {isUploading ? "Subiendo..." : "Agregar fotos privadas"}
                </Button>
            </div>

            {/* Link de la publicación (obligatorio) */}
            <div className="space-y-1.5">
                <Label className="text-xs font-medium">Link de la publicación *</Label>
                <div className="relative">
                    <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input type="url" value={url} onChange={(e) => { setUrl(e.target.value); setUrlDuplicated(false); }} onBlur={() => checkDuplicateUrl(url)} placeholder="http://intocasas.com.uy" className={`pl-9 rounded-xl text-sm ${urlDuplicated ? "border-destructive" : ""}`} />
                </div>
                {urlInFamily && (
                    <p className="text-xs text-destructive font-medium">
                        Este aviso fue ingresado por {urlInFamily.addedByName} {formatDaysAgo && urlInFamily.addedAt ? formatDaysAgo(urlInFamily.addedAt) : ""}. Su estado es {urlInFamily.status}.
                    </p>
                )}
                {urlDuplicated && !urlInFamily && (
                    <p className="text-xs text-destructive font-medium">
                        ⚠️ {urlAddedByName ? `${urlAddedByName} ya ingresó esa publicación.` : "Esta URL ya fue ingresada en tu familia."}
                    </p>
                )}
                {urlInAppMsg && !urlDuplicated && (
                    <p className="text-xs text-primary font-medium bg-primary/5 border border-primary/20 rounded-lg p-2">
                        {urlInAppMsg}
                    </p>
                )}
            </div>

            <div className="space-y-1.5">
                <Label className="text-xs font-medium">Título *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ej: Apartamento en Buceo" className="rounded-xl text-sm" />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Barrio *</Label>
                    <Input value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} placeholder="Ej: Buceo" className="rounded-xl text-sm" />
                </div>
                <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Ciudad</Label>
                    <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Ej: Montevideo" className="rounded-xl text-sm" />
                </div>
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

            {/* Ref */}
            <div className="space-y-1.5">
                <Label className="text-xs font-medium">Referencia</Label>
                <Input value={form.ref} onChange={(e) => setForm({ ...form, ref: e.target.value })} placeholder="Ej: REF-12345" className="rounded-xl text-sm" />
            </div>

            {/* Detalles */}
            <div className="space-y-1.5">
                <Label className="text-xs font-medium">Detalles</Label>
                <textarea
                    value={form.details}
                    onChange={(e) => setForm({ ...form, details: e.target.value })}
                    placeholder="Detalles adicionales extraídos por IA o ingresados manualmente..."
                    className="w-full min-h-[60px] rounded-xl text-sm border border-input bg-background px-3 py-2 resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
            </div>
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
    );
}
