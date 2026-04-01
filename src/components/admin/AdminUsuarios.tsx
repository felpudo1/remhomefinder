import { useState, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import type { OrgType } from "@/types/supabase";
import { AdminUsuariosDeleteDialog } from "@/components/admin/users/AdminUsuariosDeleteDialog";
import { AdminUsuariosTable } from "@/components/admin/users/AdminUsuariosTable";
import { AdminUsuariosToolbar } from "@/components/admin/users/AdminUsuariosToolbar";
import {
    type AdminUsuariosQueryData,
    type AdminUsuariosToast,
    type AgentRole,
    type UserProfile,
} from "@/components/admin/users/adminUsuariosTypes";
import {
    type ProfileServerSortKey,
    useAdminUsuariosTableController,
} from "@/components/admin/users/useAdminUsuariosTableController";

interface Props {
    toast: AdminUsuariosToast;
}

const PAGE_SIZE = 50;

const ADMIN_USUARIOS_QUERY_ROOT = "admin-consola-users" as const;

/**
 * Carga una página de perfiles + enriquecimiento (mismo fan-out que antes, pero cacheado con React Query).
 */
async function fetchAdminUsuariosPage(
    page: number,
    orderKey: ProfileServerSortKey,
    orderAsc: boolean,
    toast: Props["toast"]
): Promise<AdminUsuariosQueryData> {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data: profiles, error: profilesError, count } = await supabase
        .from("profiles")
        .select("user_id, display_name, email, status, plan_type, phone, created_at, referred_by_id", { count: "exact" })
        .order(orderKey, { ascending: orderAsc })
        .range(from, to);

    if (profilesError) {
        toast({ title: "Error al cargar usuarios", description: profilesError.message, variant: "destructive" });
        return { rows: [], totalCount: 0 };
    }

    const totalCount = count || 0;
    const userIds = profiles.map((p) => p.user_id);

    if (userIds.length === 0) {
        return { rows: [], totalCount };
    }

    const referrerIds = [...new Set(profiles.map((p) => p.referred_by_id).filter(Boolean))];

    const [rolesRes, listingsRes, membershipsRes, referralsRes, referrersNamesRes] = await Promise.all([
        (supabase.from("user_roles") as any).select("user_id, role").in("user_id", userIds),
        (supabase.from("user_listings") as any).select("added_by, source_publication_id").in("added_by", userIds),
        (supabase.from("organization_members") as any).select("user_id, org_id").in("user_id", userIds),
        (supabase.from("profiles") as any).select("user_id, referred_by_id").in("referred_by_id", userIds),
        (supabase.from("profiles") as any).select("user_id, display_name").in("user_id", referrerIds),
    ]);

    const membershipOrgIds = [...new Set((membershipsRes.data || []).map((m: { org_id: string }) => m.org_id))];
    const orgNameMap: Record<string, string> = {};
    if (membershipOrgIds.length > 0) {
        const { data: agencyOrgs } = await supabase
            .from("organizations")
            .select("id, name")
            .eq("type", "agency_team" satisfies OrgType)
            .eq("is_personal", false)
            .in("id", membershipOrgIds as any);

        const agencyOrgById: Record<string, string> = {};
        for (const o of agencyOrgs || []) {
            agencyOrgById[o.id] = o.name;
        }

        for (const m of membershipsRes.data || []) {
            if (agencyOrgById[m.org_id] && !orgNameMap[m.user_id]) {
                orgNameMap[m.user_id] = agencyOrgById[m.org_id];
            }
        }
    }

    const roleMap: Record<string, string[]> = {};
    for (const r of rolesRes.data || []) {
        if (!roleMap[r.user_id]) roleMap[r.user_id] = [];
        roleMap[r.user_id].push(r.role);
    }

    const personalCountMap: Record<string, number> = {};
    const savedCountMap: Record<string, number> = {};
    for (const l of listingsRes.data || []) {
        if (l.source_publication_id) {
            savedCountMap[l.added_by] = (savedCountMap[l.added_by] || 0) + 1;
        } else {
            personalCountMap[l.added_by] = (personalCountMap[l.added_by] || 0) + 1;
        }
    }

    const referralsCountMap: Record<string, number> = {};
    for (const r of referralsRes.data || []) {
        if (r.referred_by_id) referralsCountMap[r.referred_by_id] = (referralsCountMap[r.referred_by_id] || 0) + 1;
    }

    const referrerNameMap: Record<string, string> = {};
    for (const r of referrersNamesRes.data || []) {
        referrerNameMap[r.user_id] = r.display_name;
    }

    const rows: UserProfile[] = (profiles || []).map((p: any) => ({
        user_id: p.user_id,
        display_name: p.display_name || "Sin nombre",
        email: p.email || "-",
        phone: p.phone || "-",
        status: p.status || "active",
        roles: roleMap[p.user_id] || ["user"],
        personal_count: personalCountMap[p.user_id] || 0,
        saved_count: savedCountMap[p.user_id] || 0,
        referral_count: referralsCountMap[p.user_id] || 0,
        plan_type: (p.plan_type as "free" | "premium") || "free",
        created_at: p.created_at,
        referred_by_id: p.referred_by_id,
        referred_by_name: p.referred_by_id ? referrerNameMap[p.referred_by_id] : undefined,
        orgName: orgNameMap[p.user_id],
    }));

    return { rows, totalCount };
}

/** staleTime: menos refetch al cambiar de pestaña / reordenar solo columnas calculadas. */
const ADMIN_USUARIOS_STALE_MS = 90_000;

export function AdminUsuarios({ toast }: Props) {
    const queryClient = useQueryClient();
    const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null);
    const [confirmDeleteSingle, setConfirmDeleteSingle] = useState("");
    const [deleteReason, setDeleteReason] = useState("");
    const [isActionInProgress, setIsActionInProgress] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const controller = useAdminUsuariosTableController();

    const listQueryKey = useMemo(
        () => [ADMIN_USUARIOS_QUERY_ROOT, controller.page, controller.serverOrderKey, controller.serverOrderAsc] as const,
        [controller.page, controller.serverOrderKey, controller.serverOrderAsc]
    );

    const queryFn = useCallback(
        () => fetchAdminUsuariosPage(controller.page, controller.serverOrderKey, controller.serverOrderAsc, toast),
        [controller.page, controller.serverOrderKey, controller.serverOrderAsc, toast]
    );

    const { data, isLoading, isFetching, refetch } = useQuery({
        queryKey: listQueryKey,
        queryFn,
        staleTime: ADMIN_USUARIOS_STALE_MS,
    });

    const users = data?.rows ?? [];
    const totalCount = data?.totalCount ?? 0;
    const currentPageUsers = useMemo(
        () => controller.getFilteredUsers(users),
        [controller, users]
    );

    const invalidateAdminUsuarios = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: [ADMIN_USUARIOS_QUERY_ROOT] });
    }, [queryClient]);

    const updateStatus = async (userId: string, newStatus: UserProfile["status"]) => {
        const previous = queryClient.getQueryData<AdminUsuariosQueryData>(listQueryKey);
        queryClient.setQueryData<AdminUsuariosQueryData>(listQueryKey, (old) => {
            if (!old) return old;
            return {
                ...old,
                rows: old.rows.map((u) => (u.user_id === userId ? { ...u, status: newStatus } : u)),
            };
        });
        const { error } = await (supabase.rpc("admin_update_profile_status", { _user_id: userId, _status: newStatus }) as any);
        if (error) {
            queryClient.setQueryData(listQueryKey, previous);
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } else {
            toast({ title: "Estado actualizado", description: `Cambiado a "${newStatus}".` });
        }
    };

    const updatePlan = async (userId: string, newPlan: "free" | "premium") => {
        const { error } = await (supabase.from("profiles") as any).update({ plan_type: newPlan }).eq("user_id", userId);
        if (error) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } else {
            toast({ title: "Plan actualizado", description: `Usuario ahora es ${newPlan.toUpperCase()}.` });
            invalidateAdminUsuarios();
        }
    };

    const updateAgentRole = async (userId: string, newRole: AgentRole) => {
        const previous = queryClient.getQueryData<AdminUsuariosQueryData>(listQueryKey);
        queryClient.setQueryData<AdminUsuariosQueryData>(listQueryKey, (old) => {
            if (!old) return old;
            return {
                ...old,
                rows: old.rows.map((u) => {
                    if (u.user_id !== userId) return u;
                    const nextRoles = u.roles.filter((r) => r !== "agency" && r !== "agencymember" && r !== "user");
                    nextRoles.push(newRole);
                    return { ...u, roles: nextRoles };
                }),
            };
        });

        try {
            const { error: deleteErr } = await supabase
                .from("user_roles")
                .delete()
                .eq("user_id", userId)
                .in("role", ["agency", "agencymember", "user"]);
            if (deleteErr) throw deleteErr;

            const { error: insertErr } = await supabase.from("user_roles").insert([{ user_id: userId, role: newRole }] as any);
            if (insertErr) throw insertErr;

            toast({ title: "Rol actualizado", description: `El usuario ahora tiene rol "${newRole}".` });
        } catch (error: unknown) {
            queryClient.setQueryData(listQueryKey, previous);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Error desconocido",
                variant: "destructive",
            });
        }
    };

    const handlePhysicalDelete = async (userId: string) => {
        setDeletingUser(null);
        setConfirmDeleteSingle("");
        const reason = deleteReason.trim();
        setDeleteReason("");
        try {
            setIsActionInProgress(true);
            const { error } = await supabase.rpc("admin_physical_delete_user" as any, {
                _user_id: userId,
                _reason: reason,
                _deleted_by: null, // RPC uses auth.uid() internally
            });
            if (error) {
                toast({ title: "Error al eliminar", description: error.message, variant: "destructive" });
            } else {
                toast({ title: "Usuario eliminado", description: "El registro ha sido borrado físicamente de la base de datos." });
                invalidateAdminUsuarios();
            }
        } catch (err: unknown) {
            toast({ title: "Error fatal", description: err instanceof Error ? err.message : "Error desconocido", variant: "destructive" });
        } finally {
            setIsActionInProgress(false);
        }
    };

    if (isLoading && !data) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <AdminUsuariosToolbar
                searchQuery={controller.searchQuery}
                onSearchChange={controller.setSearchQuery}
                onRefresh={async () => {
                    setIsRefreshing(true);
                    await refetch();
                    setIsRefreshing(false);
                }}
                isRefreshing={isRefreshing}
                isFetching={isFetching}
                staleMs={ADMIN_USUARIOS_STALE_MS}
            />

            <AdminUsuariosTable
                users={currentPageUsers}
                totalCount={totalCount}
                pageSize={PAGE_SIZE}
                page={controller.page}
                sortKey={controller.sortConfig.key}
                sortDirection={controller.sortConfig.direction}
                searchQuery={controller.searchQuery}
                onSort={controller.handleSort}
                onPreviousPage={() => controller.setPage((current) => current - 1)}
                onNextPage={() => controller.setPage((current) => current + 1)}
                onUpdateStatus={updateStatus}
                onUpdatePlan={updatePlan}
                onUpdateRole={updateAgentRole}
                onDelete={setDeletingUser}
            />

            <AdminUsuariosDeleteDialog
                deletingUser={deletingUser}
                confirmDeleteValue={confirmDeleteSingle}
                deleteReason={deleteReason}
                isActionInProgress={isActionInProgress}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeletingUser(null);
                        setConfirmDeleteSingle("");
                        setDeleteReason("");
                    }
                }}
                onConfirmDeleteValueChange={setConfirmDeleteSingle}
                onDeleteReasonChange={setDeleteReason}
                onConfirmDelete={() => deletingUser && handlePhysicalDelete(deletingUser.user_id)}
            />
        </div>
    );
}
