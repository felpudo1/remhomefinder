import { useEffect, useState } from "react";
import { Palette, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useSystemConfig } from "@/hooks/useSystemConfig";
import { APP_BRAND_NAME_DEFAULT, APP_BRAND_NAME_KEY } from "@/lib/config-keys";

/**
 * Permite editar el nombre de marca de la app desde Admin > Sistema.
 * Se guarda en system_config para usarlo en textos dinámicos.
 */
export const AdminBranding = () => {
  const { toast } = useToast();
  const {
    value: brandName,
    isLoading,
    setValue,
    isSaving,
  } = useSystemConfig(APP_BRAND_NAME_KEY, APP_BRAND_NAME_DEFAULT);

  const [draft, setDraft] = useState(brandName);

  useEffect(() => {
    setDraft(brandName);
  }, [brandName]);

  const handleSave = async () => {
    const nextValue = draft.trim();
    if (!nextValue) {
      toast({
        title: "Nombre inválido",
        description: "Ingresá un nombre de marca válido.",
        variant: "destructive",
      });
      return;
    }

    try {
      await setValue(nextValue);
      toast({
        title: "Marca actualizada",
        description: `El nombre se guardó como "${nextValue}".`,
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
        <Palette className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider text-[11px]">
          Marca de la App
        </h3>
        {(isLoading || isSaving) && (
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        )}
      </div>

      <p className="text-[10px] text-muted-foreground pl-6 leading-relaxed max-w-2xl">
        Este valor se usa en textos dinámicos para mostrar el nombre comercial
        de la app sin tocar código.
      </p>

      <div className="flex gap-2 pl-6 max-w-md">
        <Input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={isLoading || isSaving}
          className="rounded-xl border-border bg-card"
          placeholder="Ej: HomeFinder"
        />
        <Button
          onClick={handleSave}
          disabled={isLoading || isSaving || draft.trim() === brandName}
          className="rounded-xl shrink-0"
          size="sm"
        >
          Guardar
        </Button>
      </div>
    </div>
  );
};
