import { Users, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useReferralCountForUser, useReferrerDisplayName } from "@/hooks/useReferralQueries";
import { useProfile } from "@/hooks/useProfile";
import { cn } from "@/lib/utils";

interface ProfileReferralStatsBlockProps {
  /**
   * user_id bajo el cual se cuentan referidos (referred_by_id = este valor).
   * Usuarios: tu propio userId. Agencia: suele ser created_by del dueño (mismo link de invitación).
   */
  countForUserId: string | null | undefined;
  /** Tu referred_by_id: quién te refirió a vos. */
  referredById: string | null | undefined;
  /** Estilo visual */
  variant?: "compact" | "card";
  /** Texto encima del número (opcional) */
  countLabel?: string;
}

/**
 * Muestra cantidad de personas referidas y el nombre de quien te refirió (solo lectura).
 * Usado en modal de perfil y perfil de agencia.
 */
export function ProfileReferralStatsBlock({
  countForUserId,
  referredById,
  variant = "compact",
  countLabel = "Cantidad de referidos",
}: ProfileReferralStatsBlockProps) {
  const { data: viewerProfile } = useProfile();
  const { data: referralCount = 0, isLoading: countLoading } = useReferralCountForUser(countForUserId);
  const { data: referrerName, isLoading: nameLoading } = useReferrerDisplayName(
    referredById,
    viewerProfile?.userId
  );

  const referredByLine =
    !referredById
      ? "No tenés un referidor registrado."
      : nameLoading
        ? "Cargando…"
        : referrerName
          ? `Referido por: ${referrerName}`
          : "Referidor no disponible (dato antiguo o eliminado).";

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
        <p className="text-sm text-foreground/90 flex items-start gap-2">
          <UserPlus className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
          <span>{referredByLine}</span>
        </p>
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
    </div>
  );
}
