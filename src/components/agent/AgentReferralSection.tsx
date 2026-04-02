import { useState } from "react";
import { Gift, Copy, Check, Users, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Agency } from "./AgentProfile";
import { useSystemConfig } from "@/hooks/useSystemConfig";
import { APP_BRAND_NAME_DEFAULT, APP_BRAND_NAME_KEY } from "@/lib/config-keys";
import { useReferralCountForUser, useReferrerDisplayName } from "@/hooks/useReferralQueries";
import { useProfile } from "@/hooks/useProfile";

interface AgentReferralSectionProps {
  agency: Agency;
}

/**
 * Sección de referidos para agentes: invitar clientes con link y WhatsApp.
 * Usa agency.created_by como referrer (owner de la agencia).
 */
export function AgentReferralSection({ agency }: AgentReferralSectionProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const { value: appBrandName } = useSystemConfig(APP_BRAND_NAME_KEY, APP_BRAND_NAME_DEFAULT);
  const { data: profile } = useProfile();
  const { data: referralCount = 0 } = useReferralCountForUser(agency.created_by);
  const { data: referrerName, isLoading: referrerLoading } = useReferrerDisplayName(
    profile?.referredById,
    profile?.userId
  );

  const referredByLine = !profile?.referredById
    ? "No tenés un referidor registrado."
    : referrerLoading
      ? "Cargando quién te refirió…"
      : referrerName
        ? `Referido por: ${referrerName}`
        : "Referidor no disponible.";

  const referralLink = agency.created_by
    ? `${window.location.origin}/?ref=${agency.created_by}`
    : "";

  const copyToClipboard = async () => {
    if (!referralLink) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(referralLink);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = referralLink;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        textArea.remove();
      }
      setCopied(true);
      toast({ title: "¡Link copiado! 🔗", description: "Ya podés pegarlo donde quieras." });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Error al copiar:", err);
      toast({ title: "Error al copiar", description: "Por favor, copialo manualmente.", variant: "destructive" });
    }
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`¡Hola! Te invito a ver mis propiedades destacadas en ${appBrandName}: ${referralLink}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <Gift className="w-5 h-5 text-primary" />
        Invita clientes y obten beneficios
      </h3>

      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <p className="font-bold text-sm text-foreground leading-tight">Compartí tu link de referido</p>
            <div
              className="px-2 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm cursor-help"
              title="Clientes referenciados"
            >
              {referralCount} referidos
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl gap-2 h-28 sm:h-10 transition-all hover:scale-[1.02] flex-1 sm:flex-none text-base sm:text-sm"
            onClick={copyToClipboard}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" /> Copiado
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" /> Copiar Link
              </>
            )}
          </Button>
          <Button
            variant="default"
            size="sm"
            className="rounded-xl gap-2 h-20 sm:h-10 bg-[#25D366] hover:bg-[#20ba5a] text-white border-none shadow-sm transition-all hover:scale-[1.02] flex-1 sm:flex-none"
            onClick={shareWhatsApp}
          >
            <Users className="w-4 h-4" /> WhatsApp
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Los clientes que se registren con tu link quedarán vinculados a tu agencia.
        </p>
        <div className="flex items-start gap-2 rounded-xl border border-border/60 bg-background/60 px-3 py-2.5 text-xs text-foreground/90">
          <UserPlus className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary" />
          <span>{referredByLine}</span>
        </div>
      </div>
    </div>
  );
}
