/**
 * useQuickNote
 * Hook para guardar la "nota rápida" de gestión de un user_listing.
 * Cualquier miembro de la familia (organización dueña del listing) puede editarla.
 */
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/contexts/AuthProvider";

export const QUICK_NOTE_MAX_LENGTH = 30;

export function useQuickNote(listingId: string) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { user } = useCurrentUser();
    const [isSaving, setIsSaving] = useState(false);

    const saveQuickNote = async (note: string): Promise<boolean> => {
        if (!user) {
            toast({ title: "No autenticado", variant: "destructive" });
            return false;
        }
        const trimmed = (note || "").slice(0, QUICK_NOTE_MAX_LENGTH);
        setIsSaving(true);
        try {
            const { error } = await (supabase as any)
                .from("user_listings")
                .update({
                    quick_note: trimmed,
                    quick_note_by: user.id,
                    quick_note_at: new Date().toISOString(),
                })
                .eq("id", listingId);

            if (error) throw error;

            // Refrescar el listado para que aparezca la nota actualizada
            queryClient.invalidateQueries({ queryKey: ["user_listings"] });
            return true;
        } catch (err: any) {
            console.error("Error guardando nota rápida:", err);
            toast({
                title: "No se pudo guardar la nota",
                description: err?.message || "Intenta nuevamente",
                variant: "destructive",
            });
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    return { saveQuickNote, isSaving };
}
