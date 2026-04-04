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
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

interface DeletePropertyDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (reason: string) => void;
    title: string;
}

/**
 * Diálogo modular para confirmar la eliminación de una propiedad.
 * Siguiendo la Regla 2.
 */
export function DeletePropertyDialog({ open, onOpenChange, onConfirm, title }: DeletePropertyDialogProps) {
    const [reason, setReason] = useState("");

    const handleConfirm = () => {
        onConfirm(reason);
        setReason("");
        onOpenChange(false);
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar esta propiedad?</AlertDialogTitle>
                    <AlertDialogDescription>
                        La propiedad "<span className="font-medium">{title}</span>" será eliminada permanentemente junto con sus comentarios. Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <Textarea
                    placeholder="Motivo de la eliminación..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    maxLength={30}
                    className="resize-none text-sm min-h-[80px] rounded-xl"
                />
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setReason("")}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirm}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        Eliminar
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
