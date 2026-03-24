import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Camera, Sparkles, ImageIcon, X, Plus, Upload, Link, Users } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatDaysAgo } from "@/lib/duplicateCheck";

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
    /** True si el usuario intentó agregar sin link (campo obligatorio al confirmar). */
    linkRequiredError?: boolean;
    urlDuplicated: boolean;
    urlAddedByName?: string | null;
    urlInFamily?: { addedByName: string; addedAt: string; status: string; userListingId: string } | null;
    urlInAppMsg?: string | null;
    formatDaysAgo?: (isoDate: string) => string;
    setUrlDuplicated: (d: boolean) => void;
    groups: any[];
    selectedGroupId: string | null;
    setSelectedGroupId: (id: string | null) => void;
    setStep: (step: "url" | "image-upload" | "manual") => void;
    /** En el flujo lineal: volver al paso de URL (no se edita el link en este paso). */
    onBackToUrl?: () => void;
    /** Si true, el link ya quedó fijado en el paso anterior y no se puede editar aquí. */
    urlLocked?: boolean;
    handleSubmit: () => void | Promise<void>;
    isFormValid: boolean;
    /** Si el botón está deshabilitado, qué falta (misma lógica que AddPropertyModal). */
    manualSubmitBlockers?: string[];
    onExtractFromUrl?: () => void | Promise<void>;
    isExtracting?: boolean;
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
    linkRequiredError = false,
    urlDuplicated,
    urlAddedByName,
    urlInFamily,
    urlInAppMsg,
    setUrlDuplicated,
    groups,
    selectedGroupId,
    setSelectedGroupId,
    setStep,
    onBackToUrl,
    urlLocked = false,
    handleSubmit,
    isFormValid,
    manualSubmitBlockers = [],
    onExtractFromUrl,
    isExtracting,
}: PropertyFormManualProps) {
    const safeCurrency = form.currency === "USD" || form.currency === "UYU" ? form.currency : "UYU";
    
    // Geographical State
    const [deptsList, setDeptsList] = useState<any[]>([]);
    const [citiesList, setCitiesList] = useState<any[]>([]);
    const [neighborhoodsList, setNeighborhoodsList] = useState<any[]>([]);

    // Fetch departments initially
    useEffect(() => {
        supabase.from("departments").select("id, name, country").order("country").order("name").then(({ data }) => setDeptsList((data as any[]) || []));
    }, []);

    // Fetch cities when department changes
    useEffect(() => {
        if (form.department_id) {
            supabase.from("cities").select("id, name").eq("department_id", form.department_id).order("name").then(({ data }) => setCitiesList((data as any[]) || []));
        } else {
            setCitiesList([]);
        }
    }, [form.department_id]);

    // Fetch neighborhoods when city changes
    useEffect(() => {
        if (form.city_id) {
            supabase.from("neighborhoods").select("id, name").eq("city_id", form.city_id).order("name").then(({ data }) => setNeighborhoodsList((data as any[]) || []));
        } else {
            setNeighborhoodsList([]);
        }
    }, [form.city_id]);

    return (
        <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto">
            {/* URL fijada en el paso anterior o editable solo si no está bloqueada */}
            <div className="space-y-1.5">
                <Label className="text-xs font-medium">Link de la publicación *</Label>
                {urlLocked ? (
                    <div className="flex items-start gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm text-foreground break-all">
                        <Link className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground" />
                        <span>{url || "—"}</span>
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                type="url"
                                value={url}
                                onChange={(e) => {
                                    setUrl(e.target.value);
                                    setUrlDuplicated(false);
                                }}
                                placeholder="http://intocasas.com.uy"
                                className={`pl-9 rounded-xl text-sm ${urlDuplicated || linkRequiredError ? "border-destructive focus-visible:ring-destructive" : ""}`}
                                aria-invalid={linkRequiredError || undefined}
                            />
                        </div>
                        {onExtractFromUrl && (
                            <Button type="button" onClick={onExtractFromUrl} disabled={!url.trim() || isExtracting} className="rounded-xl gap-1.5 shrink-0">
                                {isExtracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                {isExtracting ? "Verificando..." : "Extraer datos"}
                            </Button>
                        )}
                    </div>
                )}
                {linkRequiredError && !url.trim() && (
                    <p className="text-xs text-destructive font-medium">Dato obligatorio</p>
                )}
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
            <div className="space-y-1.5 bg-primary/5 border border-primary/20 rounded-xl p-3 opacity-60">
                <Label className="text-xs font-medium flex items-center gap-1">
                    <ImageIcon className="w-3 h-3" />
                    Fotos privadas (solo tu familia)
                </Label>
                <p className="text-[10px] text-muted-foreground">Esta función está temporalmente deshabilitada.</p>
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
                <input ref={privateFileInputRef} type="file" accept="image/*" multiple className="hidden" disabled />
                <Button type="button" variant="outline" size="sm" className="rounded-xl gap-1.5 text-xs" disabled>
                    {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                    Deshabilitado
                </Button>
            </div>

            <div className="space-y-1.5">
                <Label className="text-xs font-medium">Título *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ej: Apartamento en Buceo" className="rounded-xl text-sm" />
            </div>

            <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Departamento *</Label>
                    <Select
                        value={form.department_id || ""}
                        onValueChange={(val) => {
                            const deptObj = deptsList.find((d) => d.id === val);
                            setForm({ ...form, department_id: val, department: deptObj ? deptObj.name : "", city_id: "", city: "", neighborhood_id: "", neighborhood: "" });
                        }}
                    >
                        <SelectTrigger className="rounded-xl text-sm">
                            <SelectValue placeholder="Depto." />
                        </SelectTrigger>
                        <SelectContent>
                            {deptsList.map((d) => (
                                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Ciudad *</Label>
                    <Select
                        value={form.city_id || ""}
                        onValueChange={(val) => {
                            const cityObj = citiesList.find((c) => c.id === val);
                            setForm({ ...form, city_id: val, city: cityObj ? cityObj.name : "", neighborhood_id: "", neighborhood: "" });
                        }}
                        disabled={!form.department_id}
                    >
                        <SelectTrigger className="rounded-xl text-sm">
                            <SelectValue placeholder="Ciudad" />
                        </SelectTrigger>
                        <SelectContent>
                            {citiesList.map((c) => (
                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Barrio *</Label>
                    <Select
                        value={form.neighborhood_id || ""}
                        onValueChange={(val) => {
                            const neighObj = neighborhoodsList.find((n) => n.id === val);
                            setForm({ ...form, neighborhood_id: val, neighborhood: neighObj ? neighObj.name : "" });
                        }}
                        disabled={!form.city_id}
                    >
                        <SelectTrigger className="rounded-xl text-sm">
                            <SelectValue placeholder="Barrio" />
                        </SelectTrigger>
                        <SelectContent>
                            {neighborhoodsList.map((n) => (
                                <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
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
                    <Select
                        value={safeCurrency}
                        onValueChange={(value) => setForm({ ...form, currency: value })}
                    >
                        <SelectTrigger className="rounded-xl text-sm">
                            <SelectValue placeholder="Moneda" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="UYU">$U</SelectItem>
                            <SelectItem value="USD">US$</SelectItem>
                        </SelectContent>
                    </Select>
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

            {/* Contacto del aviso */}
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Nombre de contacto</Label>
                    <Input value={form.contactName || ""} onChange={(e) => setForm({ ...form, contactName: e.target.value })} placeholder="Ej: Juan Pérez" className="rounded-xl text-sm" />
                </div>
                <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Teléfono de contacto</Label>
                    <Input value={form.contactPhone || ""} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} placeholder="Ej: 099 123 456" className="rounded-xl text-sm" />
                </div>
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

            <div className="flex flex-col gap-2 pt-2">
                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                            if (onBackToUrl) onBackToUrl();
                            else setStep(cameFromImage ? "image-upload" : "url");
                        }}
                        className="flex-1 rounded-xl"
                    >
                        Volver
                    </Button>
                    <Button type="button" onClick={handleSubmit} disabled={!isFormValid} className="flex-1 rounded-xl">
                        Guardar publicación
                    </Button>
                </div>
                {!isFormValid && manualSubmitBlockers.length > 0 && (
                    <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-2.5 text-center" role="status">
                        <p className="text-xs text-destructive font-medium leading-snug">
                            ⚠️ Faltan datos obligatorios: {manualSubmitBlockers.join(", ")}.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
