/**
 * useAddContactPhone
 * Permite a un miembro de la familia agregar el celular de contacto a un user_listing
 * cuando éste fue ingresado sin teléfono (típicamente vía scraping).
 *
 * Reglas:
 * - Se guarda en formato internacional con prefijo "+" y solo dígitos.
 * - Si el usuario ingresa un número local uruguayo (8 dígitos empezando con 9),
 *   se asume +598 automáticamente.
 * - Una vez guardado, no se permite editarlo desde la tarjeta (idempotente).
 */
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Normaliza un input de teléfono a formato internacional "+<digitos>".
 * Devuelve null si no es válido.
 */
export function normalizeInternationalPhone(raw: string): string | null {
    if (!raw) return null;
    const trimmed = raw.trim();
    const startsWithPlus = trimmed.startsWith("+");
    const digits = trimmed.replace(/\D/g, "");
    if (digits.length < 8) return null;

    // Si ya viene con "+" o tiene >=10 dígitos, asumimos que incluye código de país
    if (startsWithPlus || digits.length >= 10) {
        return `+${digits}`;
    }
    // Caso UY local: 8-9 dígitos sin prefijo → asumimos +598
    return `+598${digits}`;
}

export function useAddContactPhone(listingId: string) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isSaving, setIsSaving] = useState(false);

    const saveContactPhone = async (rawPhone: string, contactName?: string): Promise<boolean> => {
        const normalized = normalizeInternationalPhone(rawPhone);
        if (!normalized) {
            toast({
                title: "Número inválido",
                description: "Ingresá al menos 8 dígitos. Ej: 099123456 o +59899123456",
                variant: "destructive",
            });
            return false;
        }
        setIsSaving(true);
        try {
            const update: Record<string, any> = { contact_phone: normalized };
            if (contactName?.trim()) update.contact_name = contactName.trim();

            const { error } = await (supabase as any)
                .from("user_listings")
                .update(update)
                .eq("id", listingId);

            if (error) throw error;

            queryClient.invalidateQueries({ queryKey: ["user_listings"] });
            toast({ title: "Celular guardado" });
            return true;
        } catch (err: any) {
            console.error("Error guardando celular:", err);
            toast({
                title: "No se pudo guardar el celular",
                description: err?.message || "Intenta nuevamente",
                variant: "destructive",
            });
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    return { saveContactPhone, isSaving };
}
