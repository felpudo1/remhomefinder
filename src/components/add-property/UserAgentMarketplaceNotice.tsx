import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export interface UserAgentMarketplaceNoticeProps {
  agencyName: string;
  agentName: string;
  whatsappDigits: string | null;
  /** URL del aviso para prellenar el mensaje a WhatsApp */
  listingUrl: string;
}

/**
 * Cartel azul (caso 2 usuario): la propiedad ya está en cartera de una agencia en el marketplace.
 */
export function UserAgentMarketplaceNotice({
  agencyName,
  agentName,
  whatsappDigits,
  listingUrl,
}: UserAgentMarketplaceNoticeProps) {
  const defaultMsg = `Hola ${agentName}, vi el aviso ${listingUrl.trim()} en ${agencyName} y quiero más información.`;

  const handleWhatsApp = () => {
    if (!whatsappDigits) return;
    const url = buildWhatsAppUrl(whatsappDigits, defaultMsg);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="bg-blue-50 border border-blue-300 rounded-xl p-4 space-y-3 text-center">
      <div className="space-y-2 text-blue-900 text-center">
        <p className="text-sm font-semibold">
          <strong className="text-2xl md:text-3xl leading-tight block">
            ESTA PUBLICACIÓN YA FUE INGRESADA
          </strong>
        </p>
        <p className="text-base font-medium leading-snug">
          Esta propiedad forma parte de la cartera de <strong>{agencyName}</strong> y{" "}
          <strong>{agentName}</strong> es su agente.
        </p>
      </div>
      <div className="flex justify-center">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-xl gap-2 border-blue-400 text-blue-800 hover:bg-blue-100"
          onClick={handleWhatsApp}
          disabled={!whatsappDigits}
        >
          <MessageCircle className="w-4 h-4" />
          Hacé click para mandar un mensaje
        </Button>
      </div>
    </div>
  );
}
