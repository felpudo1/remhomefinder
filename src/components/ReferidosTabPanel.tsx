import { Users } from "lucide-react";
import { UserReferralSection } from "@/components/UserReferralSection";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ReferidosTabPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal de Referidos: link de invitación y contador.
 */
export function ReferidosTabPanel({ isOpen, onClose }: ReferidosTabPanelProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Users className="w-7 h-7 text-primary shrink-0" />
            Referidos
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm mt-1">
            Compartí tu link para que se registren con tu referido y encuentren su próximo hogar.
          </DialogDescription>
        </DialogHeader>
        <div className="bg-card rounded-2xl p-6 card-shadow border border-border/60">
          <UserReferralSection showTopDivider={false} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
