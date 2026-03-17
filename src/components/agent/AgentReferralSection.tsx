import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Gift, Copy, Check, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Agency } from "./AgentProfile";

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

  const { data: referralCount = 0 } = useQuery({
    queryKey: ["agency-referral-count", agency.created_by],
    enabled: !!agency.created_by,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("referred_by_id", agency.created_by);
      if (error) throw error;
      return count || 0;
    },
  });

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
    const text = encodeURIComponent(`¡Hola! Te invito a ver mis propiedades destacadas en HomeFinder: ${referralLink}`);
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
            className="rounded-xl gap-2 h-10 transition-all hover:scale-[1.02] flex-1 sm:flex-none"
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
            className="rounded-xl gap-2 h-10 bg-[#25D366] hover:bg-[#20ba5a] text-white border-none shadow-sm transition-all hover:scale-[1.02] flex-1 sm:flex-none"
            onClick={shareWhatsApp}
          >
            <Users className="w-4 h-4" /> WhatsApp
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Los clientes que se registren con tu link quedarán vinculados a tu agencia.
        </p>
      </div>
    </div>
  );
}
