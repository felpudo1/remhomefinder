import { Users } from "lucide-react";
import { UserReferralSection } from "@/components/UserReferralSection";

/**
 * Contenido de la pestaña Referidos: link de invitación y contador (antes al final del filtro).
 */
export function ReferidosTabPanel() {
  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <Users className="w-7 h-7 text-primary shrink-0" />
          Referidos
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Compartí tu link para que se registren con tu referido y encuentren su próximo hogar.
        </p>
      </div>
      <div className="bg-card rounded-2xl p-6 card-shadow border border-border/60">
        <UserReferralSection showTopDivider={false} />
      </div>
    </div>
  );
}
