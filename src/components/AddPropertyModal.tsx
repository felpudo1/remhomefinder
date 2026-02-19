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
import { Link, Sparkles, Loader2 } from "lucide-react";
import { Property } from "@/types/property";

interface AddPropertyModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (property: Property) => void;
}

export function AddPropertyModal({ open, onClose, onAdd }: AddPropertyModalProps) {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"url" | "manual">("url");

  // Manual form state
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

    // Simulate AI scraping delay
    await new Promise((r) => setTimeout(r, 1800));

    // Mock extracted data based on URL
    setForm({
      title: "Hermoso departamento encontrado en el aviso",
      priceRent: "750",
      priceExpenses: "100",
      currency: "USD",
      neighborhood: "Palermo Soho",
      sqMeters: "55",
      rooms: "2",
      aiSummary:
        "IA extrajo: Departamento luminoso y amplio con terminaciones modernas. Cocina abierta, ventanas grandes y pisos de parquet. Edificio con ascensor y seguridad. Cerca del transporte público.",
    });

    setIsLoading(false);
    setStep("manual");
  };

  const handleSubmit = () => {
    const rent = Number(form.priceRent) || 0;
    const expenses = Number(form.priceExpenses) || 0;

    const newProperty: Property = {
      id: Date.now().toString(),
      url: url || "#",
      title: form.title,
      priceRent: rent,
      priceExpenses: expenses,
      totalCost: rent + expenses,
      currency: form.currency,
      neighborhood: form.neighborhood,
      sqMeters: Number(form.sqMeters) || 0,
      rooms: Number(form.rooms) || 1,
      status: "contacted",
      images: [],
      aiSummary: form.aiSummary,
      comments: [],
      createdAt: new Date(),
    };

    onAdd(newProperty);
    handleClose();
  };

  const handleClose = () => {
    setUrl("");
    setForm({ title: "", priceRent: "", priceExpenses: "", currency: "USD", neighborhood: "", sqMeters: "", rooms: "", aiSummary: "" });
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
            {/* Smart Capture */}
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

            <Button
              onClick={handleScrape}
              disabled={!url.trim() || isLoading}
              className="w-full rounded-xl gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Extrayendo detalles...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Extraer con IA
                </>
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-background px-3 text-xs text-muted-foreground">or</span>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => setStep("manual")}
              className="w-full rounded-xl"
            >
              Agregar manualmente
            </Button>
          </div>
        )}

        {step === "manual" && (
          <div className="space-y-4 py-2">
            {form.aiSummary && (
              <div className="bg-muted rounded-xl p-3 text-xs text-muted-foreground flex gap-2">
                <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary" />
                <p className="leading-relaxed">{form.aiSummary}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Título *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="ej. 2 ambientes en Palermo"
                className="rounded-xl text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Barrio *</Label>
              <Input
                value={form.neighborhood}
                onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
                placeholder="ej. Palermo, Recoleta..."
                className="rounded-xl text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Alquiler *</Label>
                <Input
                  type="number"
                  value={form.priceRent}
                  onChange={(e) => setForm({ ...form, priceRent: e.target.value })}
                  placeholder="850"
                  className="rounded-xl text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Expensas</Label>
                <Input
                  type="number"
                  value={form.priceExpenses}
                  onChange={(e) => setForm({ ...form, priceExpenses: e.target.value })}
                  placeholder="120"
                  className="rounded-xl text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Moneda</Label>
                <Input
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  placeholder="USD"
                  className="rounded-xl text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">m²</Label>
                <Input
                  type="number"
                  value={form.sqMeters}
                  onChange={(e) => setForm({ ...form, sqMeters: e.target.value })}
                  placeholder="58"
                  className="rounded-xl text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Ambientes</Label>
                <Input
                  type="number"
                  value={form.rooms}
                  onChange={(e) => setForm({ ...form, rooms: e.target.value })}
                  placeholder="2"
                  className="rounded-xl text-sm"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setStep("url")}
                className="flex-1 rounded-xl"
              >
                Volver
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!isFormValid}
                className="flex-1 rounded-xl"
              >
                Agregar Propiedad
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
