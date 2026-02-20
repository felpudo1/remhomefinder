import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, Sparkles, Loader2, Plus, X, ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  }) => void;
}

export function AddPropertyModal({ open, onClose, onAdd }: AddPropertyModalProps) {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"url" | "manual">("url");
  const [scrapedImages, setScrapedImages] = useState<string[]>([]);
  const [manualImageUrl, setManualImageUrl] = useState("");
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
      const { data, error } = await supabase.functions.invoke("scrape-property", {
        body: { url: url.trim() },
      });

      if (error || !data?.success) {
        // Scraping failed — go to manual form so user can fill in details
        toast.info("No pudimos extraer datos automáticamente. Completá los datos manualmente.", { duration: 5000 });
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
      setStep("manual");
      toast.success("¡Datos extraídos con IA!");
    } catch (err) {
      console.error("Scrape error:", err);
      toast.error("Error al conectar con el servicio de scraping");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = () => {
    onAdd({
      url: url || "",
      title: form.title,
      priceRent: Number(form.priceRent) || 0,
      priceExpenses: Number(form.priceExpenses) || 0,
      currency: form.currency,
      neighborhood: form.neighborhood,
      sqMeters: Number(form.sqMeters) || 0,
      rooms: Number(form.rooms) || 1,
      aiSummary: form.aiSummary,
      images: scrapedImages,
    });
    handleClose();
  };

  const handleClose = () => {
    setUrl("");
    setForm({ title: "", priceRent: "", priceExpenses: "", currency: "USD", neighborhood: "", sqMeters: "", rooms: "", aiSummary: "" });
    setScrapedImages([]);
    setManualImageUrl("");
    setStep("url");
    setIsLoading(false);
    onClose();
  };

  const isFormValid = form.title && form.neighborhood && form.priceRent;

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
            </div>

            <Button onClick={handleScrape} disabled={!url.trim() || isLoading} className="w-full rounded-xl gap-2">
              {isLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Extrayendo detalles...</>
              ) : (
                <><Sparkles className="w-4 h-4" />Extraer con IA</>
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
                <Label className="text-xs font-medium">Alquiler *</Label>
                <Input type="number" value={form.priceRent} onChange={(e) => setForm({ ...form, priceRent: e.target.value })} placeholder="850" className="rounded-xl text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Expensas</Label>
                <Input type="number" value={form.priceExpenses} onChange={(e) => setForm({ ...form, priceExpenses: e.target.value })} placeholder="120" className="rounded-xl text-sm" />
              </div>
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
              <p className="text-[10px] text-muted-foreground">Pegá URLs de fotos y presioná Enter o +</p>
            </div>

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
