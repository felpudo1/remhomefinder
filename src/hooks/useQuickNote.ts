/**
 * useQuickNote — Hook genérico de "nota rápida" colaborativa.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * 📚 DOCUMENTACIÓN PARA EL FUTURO (REGLA 2 — generalización):
 *
 * Este hook fue concebido originalmente para guardar una nota corta sobre un
 * `user_listing` (avisos del listado familiar), pero se generalizó para servir
 * a CUALQUIER entidad que admita una nota colaborativa (40 caracteres) que
 * sobreescribe la anterior y guarda quién y cuándo la editó.
 *
 * Casos de uso actuales:
 *   1. Notas sobre avisos personales (`user_listings.quick_note`)
 *      → wrapper: `useUserListingQuickNote(listingId)`
 *   2. Notas sobre agencias del directorio compartidas por la familia
 *      (`org_agency_notes`)
 *      → wrapper: `useOrgAgencyNote({ orgId, agencyType, agencyId })`
 *
 * Cómo agregar un nuevo caso de uso:
 *   - Si tu tabla tiene una sola fila por entidad: usar `useQuickNoteUpdate`
 *     pasando `{ table, match, columns }`.
 *   - Si tu tabla requiere upsert (clave compuesta): usar `useQuickNoteUpsert`
 *     pasando `{ table, conflictTarget, payload, columns }`.
 *
 * Cuando lo uses, conectalo al componente presentacional `QuickNoteField`
 * pasándole `{ initialNote, onSave, isSaving, editedByName, editedAt }`.
 * ────────────────────────────────────────────────────────────────────────────
 */
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/contexts/AuthProvider";

export const QUICK_NOTE_MAX_LENGTH = 40;

type QuickNoteColumns = {
    note: string;
    by: string;
    at: string;
};

const DEFAULT_COLUMNS: QuickNoteColumns = {
    note: "quick_note",
    by: "quick_note_by",
    at: "quick_note_at",
};

/**
 * Variante UPDATE: actualiza una fila ya existente identificada por `match`
 * (pares columna→valor). Útil cuando la nota vive como columnas en una tabla
 * que ya tiene una fila propia (ej: `user_listings`).
 */
export function useQuickNoteUpdate(opts: {
    table: string;
    match: Record<string, string>;
    columns?: Partial<QuickNoteColumns>;
    invalidateKeys?: string[][];
}) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { user } = useCurrentUser();
    const [isSaving, setIsSaving] = useState(false);

    const cols = { ...DEFAULT_COLUMNS, ...(opts.columns || {}) };

    const saveQuickNote = async (note: string): Promise<boolean> => {
        if (!user) {
            toast({ title: "No autenticado", variant: "destructive" });
            return false;
        }
        const trimmed = (note || "").slice(0, QUICK_NOTE_MAX_LENGTH);
        setIsSaving(true);
        try {
            let q: any = (supabase as any).from(opts.table).update({
                [cols.note]: trimmed,
                [cols.by]: user.id,
                [cols.at]: new Date().toISOString(),
            });
            for (const [k, v] of Object.entries(opts.match)) q = q.eq(k, v);
            const { error } = await q;
            if (error) throw error;
            (opts.invalidateKeys || []).forEach((key) =>
                queryClient.invalidateQueries({ queryKey: key })
            );
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

/**
 * Variante UPSERT: para tablas dedicadas a notas con clave compuesta
 * (ej: `org_agency_notes` → (org_id, agency_type, agency_id)).
 */
export function useQuickNoteUpsert(opts: {
    table: string;
    conflictTarget: string; // ej: "org_id,agency_type,agency_id"
    payload: Record<string, any>; // claves + cualquier campo extra (sin nota)
    columns?: Partial<QuickNoteColumns>;
    invalidateKeys?: string[][];
    enabled?: boolean;
}) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { user } = useCurrentUser();
    const [isSaving, setIsSaving] = useState(false);

    const cols = { ...DEFAULT_COLUMNS, ...(opts.columns || {}) };

    const saveQuickNote = async (note: string): Promise<boolean> => {
        if (!user) {
            toast({ title: "No autenticado", variant: "destructive" });
            return false;
        }
        if (opts.enabled === false) return false;
        const trimmed = (note || "").slice(0, QUICK_NOTE_MAX_LENGTH);
        setIsSaving(true);
        try {
            const { error } = await (supabase as any)
                .from(opts.table)
                .upsert(
                    {
                        ...opts.payload,
                        [cols.note]: trimmed,
                        [cols.by]: user.id,
                        [cols.at]: new Date().toISOString(),
                    },
                    { onConflict: opts.conflictTarget }
                );
            if (error) throw error;
            (opts.invalidateKeys || []).forEach((key) =>
                queryClient.invalidateQueries({ queryKey: key })
            );
            return true;
        } catch (err: any) {
            console.error("Error guardando nota rápida (upsert):", err);
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

/**
 * Wrapper LEGACY para mantener compatibilidad con `user_listings`.
 * Equivale a `useQuickNoteUpdate({ table: 'user_listings', match: { id } })`.
 */
export function useQuickNote(listingId: string) {
    return useQuickNoteUpdate({
        table: "user_listings",
        match: { id: listingId },
        invalidateKeys: [["user_listings"]],
    });
}
