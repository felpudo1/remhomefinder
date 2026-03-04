import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, Sparkles, Loader2, Plus, X, ImageIcon, Upload, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGroups } from "@/hooks/useGroups";

interface AddPropertyModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (form: {
    url: string;
    title: string;
    priceRent: number;
    priceExpenses: number;
    currency: string;
    neighborhood: string;
    sqMeters: number;
    rooms: number;
    aiSummary: string;
    images: string[];
    groupId?: string | null;
    listingType?: string;
  }) => void;
  activeGroupId?: string | null;
  scraper?: "firecrawl" | "zenrows";
}

export function AddPropertyModal({ open, onClose, onAdd, activeGroupId, scraper = "firecrawl" }: AddPropertyModalProps) {
  const { groups } = useGroups();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(activeGroupId || null);
  const [listingType, setListingType] = useState<"rent" | "sale">("rent");
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"url" | "manual">("url");

  // Sync with activeGroupId when it changes or when modal opens
  useEffect(() => {
    if (open) {
      setSelectedGroupId(activeGroupId || null);
    }
  }, [open, activeGroupId]);
  const [scrapedImages, setScrapedImages] = useState<string[]>([]);
  const [manualImageUrl, setManualImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  // Estado para indicar si la URL ya existe en la base de datos
  const [urlDuplicated, setUrlDuplicated] = useState(false);
  const [isCheckingUrl, setIsCheckingUrl] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    title: "",
    priceRent: "",
    priceExpenses: "",
    currency: "USD",
    neighborhood: "",
    sqMeters: "",
    rooms: "",
    aiSummary: "",
  });

  const handleScrape = async () => {
    if (!url.trim()) return;
    setIsLoading(true);
    try {
      // Primero verificar si la URL ya existe en la base de datos antes de gastar créditos de scraping
      const { data: existing } = await supabase
        .from("properties")
        .select("id")
        .eq("url", url.trim())
        .limit(1);
      if (existing && existing.length > 0) {
        toast.error("Esta publicación ya fue ingresada anteriormente.");
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("scrape-property", {
        body: { url: url.trim(), scraper, role: "user" },
      });

      // supabase.functions.invoke puts non-2xx response body into error.context
      if (error || !data?.success) {
        let errorMsg = "No pudimos extraer datos automáticamente. Completá los datos manualmente.";
        // Try to get message from the error context (non-2xx responses)
        try {
          const errBody = typeof error?.context === "string" ? JSON.parse(error.context) : error?.context;
          if (errBody?.error === "MARKETPLACE_MANUAL" || errBody?.message) {
            errorMsg = errBody.message || errorMsg;
          } else if (data?.error === "MARKETPLACE_MANUAL" || data?.message) {
            errorMsg = data.message || errorMsg;
          }
        } catch {
          if (data?.message) errorMsg = data.message;
          else if (data?.error && data.error !== "MARKETPLACE_MANUAL") errorMsg = data.error;
        }
        toast.info("📋 " + errorMsg, { duration: 8000 });
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
        currency: d.currency || "ARS",
        neighborhood: d.neighborhood || "",
        sqMeters: String(d.sqMeters || ""),
        rooms: String(d.rooms || ""),
        aiSummary: d.aiSummary || "",
      });
      // Aplicar el tipo de operación detectado por la IA (sale o rent)
      if (d.listingType === "sale" || d.listingType === "rent") {
        setListingType(d.listingType);
      }
      setStep("manual");
      toast.success("¡Datos extraídos con IA!");
    } catch (err) {
      console.error("Scrape error:", err);
      toast.error("Error al conectar con el servicio de scraping");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Debés estar logueado"); return; }

      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("property-images").upload(path, file);
        if (error) { console.error("Upload error:", error); continue; }
        const { data: urlData } = supabase.storage.from("property-images").getPublicUrl(path);
        uploaded.push(urlData.publicUrl);
      }
      if (uploaded.length > 0) {
        setScrapedImages(prev => [...prev, ...uploaded]);
        toast.success(`${uploaded.length} foto(s) subida(s)`);
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Error al subir fotos");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  /**
   * Verifica si la URL ya existe en la base de datos
   * Se ejecuta cuando el usuario termina de escribir la URL en modo manual
   */
  const checkDuplicateUrl = async (urlToCheck: string) => {
    if (!urlToCheck.trim()) {
      setUrlDuplicated(false);
      return;
    }
    setIsCheckingUrl(true);
    try {
      const { data } = await supabase
        .from("properties")
        .select("id")
        .eq("url", urlToCheck.trim())
        .limit(1);
      setUrlDuplicated(!!(data && data.length > 0));
    } catch {
      setUrlDuplicated(false);
    } finally {
      setIsCheckingUrl(false);
    }
  };

  const handleSubmit = () => {
    const isRent = listingType === "rent";
    onAdd({
      url: url || "",
      title: form.title,
      priceRent: isRent ? (Number(form.priceRent) || 0) : (Number(form.priceRent) || 0),
      priceExpenses: isRent ? (Number(form.priceExpenses) || 0) : 0,
      currency: form.currency,
      neighborhood: form.neighborhood,
      sqMeters: Number(form.sqMeters) || 0,
      rooms: Number(form.rooms) || 1,
      aiSummary: form.aiSummary,
      images: scrapedImages,
      groupId: selectedGroupId,
      listingType,
    });
    handleClose();
  };

  const handleClose = () => {
    setUrl("");
    setForm({ title: "", priceRent: "", priceExpenses: "", currency: "USD", neighborhood: "", sqMeters: "", rooms: "", aiSummary: "" });
    setScrapedImages([]);
    setManualImageUrl("");
    setUrlDuplicated(false);
    setListingType("rent");
    setStep("url");
    setIsLoading(false);
    onClose();
  };

  // Validación: formulario válido solo si no hay URL duplicada
  const isFormValid = form.title && form.neighborhood && form.priceRent && !urlDuplicated;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {step === "url" ? "Agregar Propiedad" : "Detalles de la Propiedad"}
          </DialogTitle>
        </DialogHeader>

        {step === "url" && (
          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Pegá la URL del aviso</Label>
              <div className="relative">
                <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="url"
                  placeholder="https://zonaprop.com.ar/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="pl-9 rounded-xl"
                  onKeyDown={(e) => e.key === "Enter" && handleScrape()}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Pegá cualquier URL de un aviso inmobiliario y nuestra IA extraerá todos los detalles automáticamente.
              </p>
              <p className="text-xs text-amber-600 font-medium">
                Las publicaciones de MarketPlace, IG y RRSS hay que ingresarlas manualmente.
              </p>
            </div>

            <Button onClick={handleScrape} disabled={!url.trim() || isLoading} className="w-full rounded-xl gap-2">
              {isLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Extrayendo datos...</>
              ) : (
                <><Sparkles className="w-4 h-4" />Extraer datos de la publicación</>
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center"><span className="bg-background px-3 text-xs text-muted-foreground">o</span></div>
            </div>

            <Button variant="outline" onClick={() => setStep("manual")} className="w-full rounded-xl">
              Agregar manualmente
            </Button>
          </div>
        )}

        {step === "manual" && (
          <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto">
            {/* Tipo de operación */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Tipo de operación</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={listingType === "rent" ? "default" : "outline"}
                  size="sm"
                  className="rounded-xl"
                  onClick={() => setListingType("rent")}
                >
                  Alquiler
                </Button>
                <Button
                  type="button"
                  variant={listingType === "sale" ? "default" : "outline"}
                  size="sm"
                  className="rounded-xl"
                  onClick={() => setListingType("sale")}
                >
                  Venta
                </Button>
              </div>
            </div>
            {scrapedImages.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Fotos extraídas ({scrapedImages.length})</Label>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {scrapedImages.slice(0, 6).map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt={`Foto ${i + 1}`}
                      className="w-20 h-16 rounded-lg object-cover shrink-0 border border-border"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  ))}
                </div>
              </div>
            )}

            {form.aiSummary && (
              <div className="bg-muted rounded-xl p-3 text-xs text-muted-foreground flex gap-2">
                <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary" />
                <p className="leading-relaxed">{form.aiSummary}</p>
              </div>
            )}

            {/* Campo para pegar el link de la publicación (visible en modo manual) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Link de la publicación</Label>
              <div className="relative">
                <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="url"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    setUrlDuplicated(false);
                  }}
                  onBlur={() => checkDuplicateUrl(url)}
                  placeholder="https://zonaprop.com.ar/..."
                  className={`pl-9 rounded-xl text-sm ${urlDuplicated ? "border-destructive" : ""}`}
                />
              </div>
              {urlDuplicated && (
                <p className="text-xs text-destructive font-medium">
                  ⚠️ Esta URL ya fue ingresada. Revisá tus propiedades existentes.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Título *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="ej. 2 ambientes en Palermo" className="rounded-xl text-sm" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Barrio *</Label>
              <Input value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} placeholder="ej. Palermo, Recoleta..." className="rounded-xl text-sm" />
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

            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1">
                <ImageIcon className="w-3 h-3" /> Fotos
              </Label>
              {scrapedImages.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {scrapedImages.map((img, i) => (
                    <div key={i} className="relative shrink-0">
                      <img src={img} alt={`Foto ${i + 1}`} className="w-16 h-12 rounded-lg object-cover border border-border" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      <button type="button" onClick={() => setScrapedImages(prev => prev.filter((_, idx) => idx !== i))} className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full w-4 h-4 flex items-center justify-center">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  type="url"
                  placeholder="https://... URL de la foto"
                  value={manualImageUrl}
                  onChange={(e) => setManualImageUrl(e.target.value)}
                  className="rounded-xl text-sm flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && manualImageUrl.trim()) {
                      e.preventDefault();
                      setScrapedImages(prev => [...prev, manualImageUrl.trim()]);
                      setManualImageUrl("");
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="rounded-xl shrink-0"
                  disabled={!manualImageUrl.trim()}
                  onClick={() => {
                    setScrapedImages(prev => [...prev, manualImageUrl.trim()]);
                    setManualImageUrl("");
                  }}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex gap-2 items-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl gap-1.5 text-xs"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                  {isUploading ? "Subiendo..." : "Subir desde dispositivo"}
                </Button>
                <p className="text-[10px] text-muted-foreground">o pegá URLs arriba</p>
              </div>
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
              <Button variant="outline" onClick={() => setStep("url")} className="flex-1 rounded-xl">Volver</Button>
              <Button onClick={handleSubmit} disabled={!isFormValid} className="flex-1 rounded-xl">Agregar Propiedad</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
