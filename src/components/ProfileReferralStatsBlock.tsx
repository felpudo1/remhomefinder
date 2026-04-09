import { Users, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useReferralCountForUser, useReferrerFullInfo } from "@/hooks/useReferralQueries";
import { useProfile } from "@/hooks/useProfile";
import { cn } from "@/lib/utils";

interface ProfileReferralStatsBlockProps {
  countForUserId: string | null | undefined;
  referredById: string | null | undefined;
  variant?: "compact" | "card";
  countLabel?: string;
}

export function ProfileReferralStatsBlock({
  countForUserId,
  referredById,
  variant = "compact",
  countLabel = "Cantidad de referidos",
}: ProfileReferralStatsBlockProps) {
  const { data: viewerProfile } = useProfile();
  const { data: referralCount = 0, isLoading: countLoading } = useReferralCountForUser(countForUserId);
  const { data: referrerInfo, isLoading: infoLoading } = useReferrerFullInfo(
    referredById,
    viewerProfile?.userId
  );

  const referredByLine =
    !referredById
      ? "No tenés un referidor registrado."
      : infoLoading
        ? "Cargando…"
        : referrerInfo?.referrerDisplayName
          ? `Referido por: ${referrerInfo.referrerDisplayName}`
          : "Referidor no disponible (dato antiguo o eliminado).";

  const agencyBlock = referrerInfo?.agencyName ? (
    <div className="flex items-center gap-1.5 mt-1 ml-0.5">
      {referrerInfo.agencyLogoUrl ? (
        <Avatar className="w-5 h-5">
          <AvatarImage src={referrerInfo.agencyLogoUrl} alt={referrerInfo.agencyName} />
          <AvatarFallback className="text-[8px]">{referrerInfo.agencyName.charAt(0)}</AvatarFallback>
        </Avatar>
      ) : null}
      <span className="text-xs text-muted-foreground">{referrerInfo.agencyName}</span>
    </div>
  ) : null;

  if (variant === "card") {
    return (
      <div className="rounded-xl border border-border/80 bg-muted/30 p-4 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-primary" />
          Programa de referidos
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-foreground">{countLabel}</span>
          <Badge variant="secondary" className="font-mono tabular-nums">
            {countLoading ? "…" : referralCount}
          </Badge>
        </div>
        <div className="text-sm text-foreground/90 flex flex-col">
          <div className="flex items-start gap-2">
            <UserPlus className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
            <span>{referredByLine}</span>
          </div>
          {agencyBlock}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "space-y-2 rounded-xl border border-border/60 bg-muted/20 px-3 py-3",
        "text-xs sm:text-sm"
      )}
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-muted-foreground font-medium">{countLabel}</span>
        <Badge variant="outline" className="tabular-nums font-semibold">
          {countLoading ? "…" : referralCount}
        </Badge>
      </div>
      <p className="text-muted-foreground leading-snug">{referredByLine}</p>
      {agencyBlock}
    </div>
  );
}
