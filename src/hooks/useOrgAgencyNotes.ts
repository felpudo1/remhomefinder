/**
 * useOrgAgencyNotes — Notas rápidas (40 chars) por agencia, compartidas dentro
 * de la organización familiar. Una sola nota por (org, agency) que se
 * sobreescribe al editarla. Persistida en `org_agency_notes`.
 *
 * Devuelve:
 *   - notes: mapa "type:id" → { note, edited_by, edited_at, edited_by_name }
 *   - useNoteSaver(agencyType, agencyId): wrapper de useQuickNoteUpsert para
 *     un agency específico (compatible con <QuickNoteField onSave/isSaving />).
 *   - hasOrg: si el usuario tiene una org activa.
 */
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/contexts/AuthProvider";
import { useQuickNoteUpsert } from "@/hooks/useQuickNote";

export type OrgAgencyNote = {
    agency_type: string;
    agency_id: string;
    note: string;
    edited_at: string;
    edited_by: string;
    edited_by_name?: string | null;
};

type NotesMap = Record<string, OrgAgencyNote>;

const QUERY_KEY = "org-agency-notes";

export function useOrgAgencyNotes() {
    const { user } = useCurrentUser();
    const userId = user?.id ?? null;
    const [orgId, setOrgId] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        if (!userId) {
            setOrgId(null);
            return;
        }
        (async () => {
            const { data } = await supabase
                .from("organization_members")
                .select("org_id")
                .eq("user_id", userId)
                .eq("is_active", true)
                .limit(1)
                .maybeSingle();
            if (!cancelled) setOrgId((data as any)?.org_id ?? null);
        })();
        return () => {
            cancelled = true;
        };
    }, [userId]);

    const { data: notes = {} } = useQuery({
        queryKey: [QUERY_KEY, orgId],
        enabled: !!orgId,
        staleTime: 60_000,
        queryFn: async (): Promise<NotesMap> => {
            const { data, error } = await (supabase as any)
                .from("org_agency_notes")
                .select("agency_type, agency_id, note, edited_at, edited_by")
                .eq("org_id", orgId);
            if (error) throw error;

            const userIds: string[] = Array.from(
                new Set((data || []).map((r: any) => String(r.edited_by)))
            );
            let names: Record<string, string> = {};
            if (userIds.length > 0) {
                const { data: profiles } = await supabase
                    .from("profiles")
                    .select("user_id, display_name, email")
                    .in("user_id", userIds);
                names = Object.fromEntries(
                    (profiles || []).map((p: any) => [
                        p.user_id,
                        p.display_name || p.email || "Miembro",
                    ])
                );
            }

            const map: NotesMap = {};
            for (const row of data || []) {
                const r: any = row;
                map[`${r.agency_type}:${r.agency_id}`] = {
                    agency_type: r.agency_type,
                    agency_id: r.agency_id,
                    note: r.note || "",
                    edited_at: r.edited_at,
                    edited_by: r.edited_by,
                    edited_by_name: names[r.edited_by] ?? null,
                };
            }
            return map;
        },
    });

    return useMemo(
        () => ({
            notes: notes as NotesMap,
            hasOrg: !!orgId,
            orgId,
            getNote: (agencyType: string, agencyId: string) =>
                (notes as NotesMap)[`${agencyType}:${agencyId}`] ?? null,
        }),
        [notes, orgId]
    );
}

/** Hook por-agencia para conectar al QuickNoteField */
export function useOrgAgencyNoteSaver(params: {
    orgId: string | null;
    agencyType: string;
    agencyId: string;
}) {
    return useQuickNoteUpsert({
        table: "org_agency_notes",
        conflictTarget: "org_id,agency_type,agency_id",
        columns: { note: "note", by: "edited_by", at: "edited_at" },
        payload: {
            org_id: params.orgId,
            agency_type: params.agencyType,
            agency_id: params.agencyId,
        },
        invalidateKeys: [[QUERY_KEY, params.orgId || ""]],
        enabled: !!params.orgId,
    });
}
