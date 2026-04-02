import { useState } from "react";
import { Users, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";
import { ProfileReferralStatsBlock } from "@/components/ProfileReferralStatsBlock";

interface UserReferralSectionProps {
  /** En el filtro lateral va separado con línea; en la pestaña dedicada no hace falta */
  showTopDivider?: boolean;
}

export function UserReferralSection({ showTopDivider = true }: UserReferralSectionProps) {
    const { toast } = useToast();
    const [copied, setCopied] = useState(false);
    const { data: profile } = useProfile();

    const referralLink = profile?.userId
        ? `${window.location.origin}/auth?ref=${profile.userId}`
        : "";

    const copyToClipboard = async () => {
        if (!referralLink) {
            toast({
                title: "Error",
                description: "No se pudo generar el link. Intentá de nuevo.",
                variant: "destructive",
            });
            return;
        }

        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(referralLink);
            } else {
                // Fallback para contextos no seguros o navegadores viejos
                const textArea = document.createElement("textarea");
                textArea.value = referralLink;
                textArea.style.position = "fixed";
                textArea.style.left = "-9999px";
                textArea.style.top = "0";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                textArea.remove();
            }

            setCopied(true);
            toast({
                title: "¡Link copiado! 🔗",
                description: "Compartilo con tus amigos para que se registren.",
            });
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Error al copiar:', err);
            toast({
                title: "Error al copiar",
                description: "Por favor, copialo manualmente.",
                variant: "destructive",
            });
        }
    };

    return (
        <div
            className={
                showTopDivider
                    ? "space-y-3 pt-4 border-t border-border/50"
                    : "space-y-3"
            }
        >
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3 h-3 text-primary" />
                Tus referidos
            </p>

            <ProfileReferralStatsBlock
                countForUserId={profile?.userId}
                referredById={profile?.referredById}
                variant="compact"
                countLabel="Cantidad de referidos"
            />

            <div className="space-y-2">
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Invitá a tus amigos y ayudalos a encontrar su próximo hogar.
                </p>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={copyToClipboard}
                    className="w-full h-24 sm:h-8 rounded-xl text-sm sm:text-[10px] font-bold uppercase tracking-wider gap-2 bg-muted/50 border-none hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                >
                    {copied ? (
                        <>
                            <Check className="w-3 h-3" />
                            Copiado
                        </>
                    ) : (
                        <>
                            <Copy className="w-3 h-3" />
                            Copiar Link
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
