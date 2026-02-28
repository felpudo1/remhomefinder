import { useState } from "react";
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
import { Loader2 } from "lucide-react";

interface PublishPropertyModalProps {
  open: boolean;
  onClose: () => void;
  agencyId: string;
  onPublished: () => void;
}

export function PublishPropertyModal({ open, onClose, agencyId, onPublished }: PublishPropertyModalProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    url: "",
    priceRent: "",
    priceExpenses: "",
    currency: "ARS",
    neighborhood: "",
    sqMeters: "",
    rooms: "1",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    setSaving(true);
    try {
      const priceRent = Number(form.priceRent) || 0;
      const priceExpenses = Number(form.priceExpenses) || 0;

      const { error } = await supabase.from("marketplace_properties").insert({
        agency_id: agencyId,
        title: form.title.trim(),
        description: form.description.trim(),
        url: form.url.trim(),
        price_rent: priceRent,
        price_expenses: priceExpenses,
        total_cost: priceRent + priceExpenses,
        currency: form.currency,
        neighborhood: form.neighborhood.trim(),
        sq_meters: Number(form.sqMeters) || 0,
        rooms: Number(form.rooms) || 1,
      });

      if (error) throw error;

      toast({ title: "Publicada", description: "La propiedad fue publicada en el marketplace." });
      setForm({ title: "", description: "", url: "", priceRent: "", priceExpenses: "", currency: "ARS", neighborhood: "", sqMeters: "", rooms: "1" });
      onPublished();
      onClose();
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "No se pudo publicar", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle>Publicar propiedad</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Título *</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ej: Depto 3 amb en Palermo" className="rounded-xl" />
          </div>

          <div className="space-y-1.5">
            <Label>Descripción</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descripción de la propiedad..." className="rounded-xl resize-none min-h-[80px]" />
          </div>

          <div className="space-y-1.5">
            <Label>URL de la publicación</Label>
            <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://..." className="rounded-xl" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Alquiler mensual</Label>
              <Input type="number" value={form.priceRent} onChange={(e) => setForm({ ...form, priceRent: e.target.value })} placeholder="0" className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label>Expensas</Label>
              <Input type="number" value={form.priceExpenses} onChange={(e) => setForm({ ...form, priceExpenses: e.target.value })} placeholder="0" className="rounded-xl" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Moneda</Label>
              <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ARS">ARS</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Barrio</Label>
              <Input value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} placeholder="Palermo" className="rounded-xl" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>m²</Label>
              <Input type="number" value={form.sqMeters} onChange={(e) => setForm({ ...form, sqMeters: e.target.value })} placeholder="0" className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label>Ambientes</Label>
              <Input type="number" value={form.rooms} onChange={(e) => setForm({ ...form, rooms: e.target.value })} placeholder="1" className="rounded-xl" />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">Cancelar</Button>
            <Button type="submit" disabled={saving || !form.title.trim()} className="rounded-xl gap-1.5">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Publicar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
