import { useEffect, useState } from "react";
import { Info, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useSystemConfig } from "@/hooks/useSystemConfig";
import {
  MARKETPLACE_CONTACT_TIP_INTERVAL_DEFAULT,
  MARKETPLACE_CONTACT_TIP_INTERVAL_KEY,
} from "@/lib/config-keys";

/**
 * Configura cada cuántos guardados en marketplace se vuelve a mostrar
 * el modal de tip de contacto al usuario.
 */
export const AdminMarketplaceTips = () => {
  const { toast } = useToast();
  const {
    value: intervalValue,
    isLoading,
    setValue,
    isSaving,
  } = useSystemConfig(
    MARKETPLACE_CONTACT_TIP_INTERVAL_KEY,
    MARKETPLACE_CONTACT_TIP_INTERVAL_DEFAULT
  );

  const [draft, setDraft] = useState(intervalValue);

  useEffect(() => {
    setDraft(intervalValue);
  }, [intervalValue]);

  const parsed = Number(draft);
  const isValid = Number.isInteger(parsed) && parsed >= 1 && parsed <= 20;

  const handleSave = async () => {
    if (!isValid) {
      toast({
        title: "Valor inválido",
        description: "Ingresá un número entero entre 1 y 20.",
        variant: "destructive",
      });
      return;
    }

    try {
      await setValue(String(parsed));
      toast({
        title: "Frecuencia guardada",
        description: "El tip se mostrará con la nueva frecuencia en marketplace.",
      });
    } catch (error: any) {
      toast({
        title: "Error al guardar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-3 pt-4 border-t border-border">
      <div className="flex items-center gap-2">
        <Info className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider text-[11px]">
          Tip de Contacto en Marketplace
        </h3>
        {(isLoading || isSaving) && (
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        )}
      </div>
      <p className="text-[10px] text-muted-foreground pl-6 leading-relaxed max-w-2xl">
        Controlá cada cuántos avisos guardados se vuelve a mostrar el modal. El
        primer guardado siempre lo muestra (si el usuario no marcó "No mostrar más").
      </p>
      <div className="flex gap-2 pl-6 max-w-md">
        <Input
          type="number"
          min={1}
          max={20}
          step={1}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={isLoading || isSaving}
          className="rounded-xl border-border bg-card"
        />
        <Button
          onClick={handleSave}
          disabled={isLoading || isSaving || !isValid || String(parsed) === intervalValue}
          className="rounded-xl shrink-0"
          size="sm"
        >
          Guardar
        </Button>
      </div>
    </div>
  );
};
