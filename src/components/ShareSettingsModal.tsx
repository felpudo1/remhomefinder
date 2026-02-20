import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePropertyShares, SharePermission } from "@/hooks/usePropertyShares";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, UserPlus, Eye, MessageSquare, Pencil, Shield } from "lucide-react";

const PERMISSION_LABELS: Record<SharePermission, { label: string; icon: React.ReactNode }> = {
  view: { label: "Solo ver", icon: <Eye className="w-3.5 h-3.5" /> },
  comment: { label: "Ver + Comentar", icon: <MessageSquare className="w-3.5 h-3.5" /> },
  edit: { label: "Ver + Editar", icon: <Pencil className="w-3.5 h-3.5" /> },
  full: { label: "Acceso completo", icon: <Shield className="w-3.5 h-3.5" /> },
};

interface ShareSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function ShareSettingsModal({ open, onClose }: ShareSettingsModalProps) {
  const { shares, loading, addShare, removeShare, updatePermission } = usePropertyShares();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<SharePermission>("view");
  const [submitting, setSubmitting] = useState(false);

  const handleAdd = async () => {
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      await addShare(email.trim(), permission);
      setEmail("");
      setPermission("view");
      toast({ title: "Compartido", description: `Acceso otorgado a ${email}` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await removeShare(id);
      toast({ title: "Revocado", description: "Acceso eliminado" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handlePermissionChange = async (id: string, perm: SharePermission) => {
    try {
      await updatePermission(id, perm);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Compartir propiedades
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add form */}
          <div className="flex flex-col gap-2">
            <Input
              placeholder="Email del usuario..."
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <div className="flex gap-2">
              <Select value={permission} onValueChange={(v) => setPermission(v as SharePermission)}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(PERMISSION_LABELS) as [SharePermission, typeof PERMISSION_LABELS[SharePermission]][]).map(
                    ([key, cfg]) => (
                      <SelectItem key={key} value={key}>
                        <span className="flex items-center gap-2">
                          {cfg.icon} {cfg.label}
                        </span>
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
              <Button onClick={handleAdd} disabled={submitting || !email.trim()}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Compartir"}
              </Button>
            </div>
          </div>

          {/* Current shares */}
          <div className="space-y-1">
            <h4 className="text-sm font-medium text-muted-foreground">Personas con acceso</h4>
            {loading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : shares.length === 0 ? (
              <p className="text-xs text-muted-foreground py-3 text-center">
                Aún no compartiste con nadie
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {shares.map((share) => (
                  <div
                    key={share.id}
                    className="flex items-center justify-between gap-2 bg-muted rounded-lg px-3 py-2"
                  >
                    <span className="text-sm truncate flex-1">
                      {share.shared_email || share.shared_with_id.slice(0, 8) + "..."}
                    </span>
                    <Select
                      value={share.permission}
                      onValueChange={(v) => handlePermissionChange(share.id, v as SharePermission)}
                    >
                      <SelectTrigger className="w-auto h-7 text-xs gap-1 border-0 bg-transparent">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.entries(PERMISSION_LABELS) as [SharePermission, typeof PERMISSION_LABELS[SharePermission]][]).map(
                          ([key, cfg]) => (
                            <SelectItem key={key} value={key}>
                              <span className="flex items-center gap-2">
                                {cfg.icon} {cfg.label}
                              </span>
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => handleRemove(share.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
