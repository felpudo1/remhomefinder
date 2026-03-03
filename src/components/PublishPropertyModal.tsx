import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Sparkles, Link as LinkIcon, Plus, X, ImageIcon, Upload } from "lucide-react";
import { toast as sonnerToast } from "sonner";

interface PublishPropertyModalProps {
  open: boolean;
  onClose: () => void;
  agencyId: string;
  onPublished: () => void;
}

export function PublishPropertyModal({ open, onClose, agencyId, onPublished }: PublishPropertyModalProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"url" | "manual">("url");
  const [url, setUrl] = useState("");
  const [scrapedImages, setScrapedImages] = useState<string[]>([]);
  const [manualImageUrl, setManualImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [listingType, setListingType] = useState<"rent" | "sale">("rent");
  const [form, setForm] = useState({
    title: "",
    description: "",
    priceRent: "",
    priceExpenses: "",
    currency: "ARS",
    neighborhood: "",
    sqMeters: "",
    rooms: "1",
  });

  const handleScrape = async () => {
    if (!url.trim()) return;
    setIsLoading(true);
    try {
      // Verificar si ya existe en el marketplace
      const { data: existing } = await supabase
        .from("marketplace_properties")
        .select("id")
        .eq("url", url.trim())
        .limit(1);

      if (existing && existing.length > 0) {
        sonnerToast.error("Esta propiedad ya está publicada en el marketplace.");
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("scrape-property", {
        body: { url: url.trim() },
      });

      // supabase.functions.invoke puts non-2xx response body into error.context
      if (error || !data?.success) {
        let errorMsg = "No pudimos extraer datos automáticamente. Completá los datos manualmente.";
        try {
          const errBody = typeof error?.context === "string" ? JSON.parse(error.context) : error?.context;
          if (errBody?.error === "MARKETPLACE_MANUAL" || errBody?.message) {
            errorMsg = errBody.message || errorMsg;
          } else if (data?.message) {
            errorMsg = data.message;
          } else if (data?.error && data.error !== "MARKETPLACE_MANUAL") {
            errorMsg = data.error;
          }
        } catch {
          if (data?.message) errorMsg = data.message;
          else if (data?.error && data.error !== "MARKETPLACE_MANUAL") errorMsg = data.error;
        }

        sonnerToast.info(`📋 ${errorMsg}`);
        setStep("manual");
        setIsLoading(false);
        return;
      }

      const d = data.data;
      setScrapedImages(d.images || []);
      setForm({
        title: d.title || "",
        description: d.aiSummary || "",
        priceRent: String(d.priceRent || ""),
        priceExpenses: String(d.priceExpenses || ""),
        currency: d.currency || "ARS",
        neighborhood: d.neighborhood || "",
        sqMeters: String(d.sqMeters || ""),
        rooms: String(d.rooms || "1"),
      });
      setStep("manual");
      sonnerToast.success("¡Datos extraídos con IA!");
    } catch (err) {
      console.error("Scrape error:", err);
      sonnerToast.error("Error al conectar con el servicio de scraping");
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
        const path = `agencies/${agencyId}/${crypto.randomUUID()}.${ext}`;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    setSaving(true);
    try {
      const priceRent = Number(form.priceRent) || 0;
      const priceExpenses = listingType === "rent" ? (Number(form.priceExpenses) || 0) : 0;

      const { error } = await supabase.from("marketplace_properties").insert({
        agency_id: agencyId,
        title: form.title.trim(),
        description: form.description.trim(),
        url: url.trim(),
        price_rent: priceRent,
        price_expenses: priceExpenses,
        total_cost: priceRent + priceExpenses,
        currency: form.currency,
        neighborhood: form.neighborhood.trim(),
        sq_meters: Number(form.sqMeters) || 0,
        rooms: Number(form.rooms) || 1,
        images: scrapedImages,
        listing_type: listingType,
      } as any);

      if (error) throw error;

      toast({ title: "Publicada", description: "La propiedad fue publicada en el marketplace." });
      handleClose();
      onPublished();
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "No se pudo publicar", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setStep("url");
    setUrl("");
    setScrapedImages([]);
    setListingType("rent");
    setForm({
      title: "",
      description: "",
      priceRent: "",
      priceExpenses: "",
      currency: "ARS",
      neighborhood: "",
      sqMeters: "",
      rooms: "1",
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {step === "url" ? "Publicar con IA" : "Confirmar Publicación"}
          </DialogTitle>
        </DialogHeader>

        {step === "url" ? (
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Pegá la URL de la propiedad</Label>
              <div className="relative">
                <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="url"
                  placeholder="https://www.zonaprop.com.ar/propiedades/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="pl-10 h-12 rounded-2xl bg-muted/50 border-0 focus-visible:ring-primary"
                  onKeyDown={(e) => e.key === "Enter" && handleScrape()}
                />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Nuestra IA extraerá fotos, precios, barrio y descripción automáticamente para que no tengas que cargar nada a mano.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={handleScrape}
                className="h-12 rounded-2xl gap-2 text-md shadow-lg shadow-primary/20"
                disabled={!url.trim() || isLoading}
              >
                {isLoading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Procesando...</>
                ) : (
                  <><Sparkles className="w-5 h-5" /> Extraer datos del aviso</>
                )}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setStep("manual")}
                className="h-12 rounded-2xl text-muted-foreground hover:text-foreground"
              >
                Omitir e ingresar manualmente
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 py-2">
            {/* Tipo de operación */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tipo de operación</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant={listingType === "rent" ? "default" : "outline"} size="sm" className="rounded-xl" onClick={() => setListingType("rent")}>Alquiler</Button>
                <Button type="button" variant={listingType === "sale" ? "default" : "outline"} size="sm" className="rounded-xl" onClick={() => setListingType("sale")}>Venta</Button>
              </div>
            </div>
            {/* Galería de imágenes extraídas */}
            {scrapedImages.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fotos ({scrapedImages.length})</Label>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                  {scrapedImages.map((img, i) => (
                    <div key={i} className="relative shrink-0 group">
                      <img
                        src={img}
                        alt=""
                        className="w-24 h-20 rounded-xl object-cover border border-border"
                        onError={(e) => (e.currentTarget.style.display = "none")}
                      />
                      <button
                        type="button"
                        onClick={() => setScrapedImages(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute -top-1.5 -right-1.5 bg-destructive text-white rounded-full w-5 h-5 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFileUpload(e.target.files)} />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="w-24 h-20 rounded-xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:bg-muted/50 transition-colors"
                    >
                      {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      <span className="text-[10px] font-medium">Subir</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Título *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ej: Depto 3 amb en Palermo" className="rounded-xl h-10" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Descripción</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Descripción detallada de la propiedad..."
                className="rounded-xl resize-none min-h-[100px] text-sm leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{listingType === "sale" ? "Precio de venta" : "Alquiler"}</Label>
                <div className="relative">
                  <Input type="number" value={form.priceRent} onChange={(e) => setForm({ ...form, priceRent: e.target.value })} placeholder="0" className="rounded-xl h-10" />
                </div>
              </div>
              {listingType === "rent" && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Expensas</Label>
                  <Input type="number" value={form.priceExpenses} onChange={(e) => setForm({ ...form, priceExpenses: e.target.value })} placeholder="0" className="rounded-xl h-10" />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Moneda</Label>
                <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                  <SelectTrigger className="rounded-xl h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ARS">ARS</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Barrio</Label>
                <Input value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} placeholder="Palermo" className="rounded-xl h-10" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">m² Totales</Label>
                <Input type="number" value={form.sqMeters} onChange={(e) => setForm({ ...form, sqMeters: e.target.value })} placeholder="0" className="rounded-xl h-10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ambientes</Label>
                <Input type="number" value={form.rooms} onChange={(e) => setForm({ ...form, rooms: e.target.value })} placeholder="1" className="rounded-xl h-10" />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setStep("url")} className="flex-1 h-12 rounded-2xl">Atrás</Button>
              <Button type="submit" disabled={saving || !form.title.trim()} className="flex-1 h-12 rounded-2xl gap-2 shadow-lg shadow-primary/20">
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                Publicar Ahora
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
