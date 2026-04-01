import { Loader2, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import type { UserProfile } from "./adminUsuariosTypes";

interface AdminUsuariosDeleteDialogProps {
  deletingUser: UserProfile | null;
  confirmDeleteValue: string;
  deleteReason: string;
  isActionInProgress: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmDeleteValueChange: (value: string) => void;
  onDeleteReasonChange: (value: string) => void;
  onConfirmDelete: () => void;
}

/**
 * Aísla el diálogo destructivo para no mezclar su estado visual con la tabla.
 */
export function AdminUsuariosDeleteDialog({
  deletingUser,
  confirmDeleteValue,
  deleteReason,
  isActionInProgress,
  onOpenChange,
  onConfirmDeleteValueChange,
  onDeleteReasonChange,
  onConfirmDelete,
}: AdminUsuariosDeleteDialogProps) {
  return (
    <AlertDialog open={!!deletingUser} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive">
            ⚠️ Borrado físico permanente
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Estás a punto de eliminar <strong>permanentemente</strong> al usuario{" "}
              <strong>{deletingUser?.display_name}</strong> ({deletingUser?.email}).
            </p>
            <p className="text-destructive font-semibold">
              Esta acción NO se puede deshacer. Se borrarán todos sus datos: propiedades,
              comentarios, calificaciones, membresías y su registro de autenticación.
            </p>
            <div className="pt-2">
              <label className="text-xs font-medium">
                Motivo <span className="text-destructive">*</span>
              </label>
              <Input
                value={deleteReason}
                onChange={(event) => onDeleteReasonChange(event.target.value)}
                placeholder="Ej: cuenta duplicada, spam, solicitud del usuario..."
                className="mt-1 text-sm"
              />
            </div>
            <div className="pt-2">
              <label className="text-xs font-medium">
                Escribí <strong>ELIMINAR</strong> para confirmar:
              </label>
              <Input
                value={confirmDeleteValue}
                onChange={(event) => onConfirmDeleteValueChange(event.target.value)}
                placeholder="ELIMINAR"
                className="mt-1 text-sm"
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isActionInProgress}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={
              confirmDeleteValue !== "ELIMINAR" ||
              isActionInProgress ||
              !deleteReason.trim()
            }
            onClick={onConfirmDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isActionInProgress ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Trash2 className="w-4 h-4 mr-2" />
            )}
            Eliminar permanentemente
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
