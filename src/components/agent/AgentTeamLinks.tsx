import { useState } from "react";
import { Building2, Gift, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface AgentTeamLinksProps {
  inviteCode?: string;
  userId: string;
  isOwner: boolean;
}

export function AgentTeamLinks({ inviteCode, userId, isOwner }: AgentTeamLinksProps) {
  const { toast } = useToast();
  const [copiedOffice, setCopiedOffice] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);

  const officeLink = inviteCode ? `${window.location.origin}/join/${inviteCode}` : "";
  const referralLink = `${window.location.origin}/ref/${userId}`;

  const copyLink = async (link: string, type: "office" | "ref") => {
    try {
      await navigator.clipboard.writeText(link);
      if (type === "office") {
        setCopiedOffice(true);
        setTimeout(() => setCopiedOffice(false), 2000);
      } else {
        setCopiedRef(true);
        setTimeout(() => setCopiedRef(false), 2000);
      }
      toast({
        title: "¡Link copiado! 🔗",
        description: type === "office"
          ? "Compartilo solo con tus agentes."
          : "Compartilo con amigos o clientes.",
      });
    } catch {
      toast({ title: "Error al copiar", variant: "destructive" });
    }
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/* Office Link — Owner only */}
      {isOwner && inviteCode && (
        <div className="rounded-2xl border border-primary/20 bg-primary/[0.03] p-5 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Link de Oficina</p>
              <p className="text-[11px] text-muted-foreground">Solo para tus agentes</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Compartí este link con tus agentes para que se unan al equipo de trabajo. No lo compartas con clientes.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyLink(officeLink, "office")}
            className="w-full rounded-xl text-xs font-bold uppercase tracking-wider gap-2 border-primary/20 hover:bg-primary hover:text-primary-foreground transition-all"
          >
            {copiedOffice ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedOffice ? "Copiado" : "Copiar Link de Oficina"}
          </Button>
        </div>
      )}

      {/* Referral Link — Everyone */}
      <div className="rounded-2xl border border-green-500/20 bg-green-500/[0.03] p-5 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center">
            <Gift className="w-4.5 h-4.5 text-green-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Link de Recomendados</p>
            <p className="text-[11px] text-muted-foreground">Invitá clientes y ganá beneficios</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Invitá a conocidos y ganá créditos. Compartí este link con amigos o clientes.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => copyLink(referralLink, "ref")}
          className="w-full rounded-xl text-xs font-bold uppercase tracking-wider gap-2 border-green-500/20 hover:bg-green-600 hover:text-white transition-all"
        >
          {copiedRef ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copiedRef ? "Copiado" : "Copiar Link de Referidos"}
        </Button>
      </div>
    </div>
  );
}
