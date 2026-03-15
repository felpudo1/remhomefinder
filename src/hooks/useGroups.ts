import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Group {
  id: string;
  name: string;
  description: string;
  created_by: string;
  invite_code: string;
  created_at: string;
  type: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: string;
  created_at: string;
  display_name?: string;
  email?: string;
}

/**
 * Hook para gestionar organizaciones (antes "groups").
 * Usa organizations + organization_members.
 * Retorna `groups` (sub-equipos / familias) y `agencyOrg` (org principal de agencia, si existe).
 */
export function useGroups() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["groups"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { groups: [] as Group[], agencyOrg: null as Group | null };

      const { data: memberships, error: memError } = await supabase
        .from("organization_members")
        .select("org_id")
        .eq("user_id", user.id);

      if (memError) throw memError;

      const orgIds = memberships?.map((m) => m.org_id) || [];
      if (orgIds.length === 0) return { groups: [] as Group[], agencyOrg: null as Group | null };

      const { data: orgs, error: orgError } = await supabase
        .from("organizations")
        .select("*")
        .in("id", orgIds)
        .eq("is_personal", false);

      if (orgError) throw orgError;

      const allOrgs = (orgs || []).map((o): Group => ({
        id: o.id,
        name: o.name,
        description: o.description || "",
        created_by: o.created_by,
        invite_code: o.invite_code,
        created_at: o.created_at,
        type: o.type,
      }));

      const agencyOrg = allOrgs.find((o) => o.type === "agency_team") || null;
      const groups = allOrgs.filter((o) => o.type !== "agency_team");

      return { groups, agencyOrg };
    },
  });

  const groups = data?.groups ?? [];
  const agencyOrg = data?.agencyOrg ?? null;

  const createGroupMutation = useMutation({
    mutationFn: async ({ name, description, parentOrgId }: { name: string; description: string; parentOrgId?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const orgType = parentOrgId ? "sub_team" : "family";

      const { data, error } = await supabase
        .from("organizations")
        .insert({
          name,
          description,
          type: orgType as any,
          created_by: user.id,
          ...(parentOrgId ? { parent_id: parentOrgId } : {}),
        })
        .select()
        .single();

      if (error) throw error;

      await supabase.from("organization_members").insert({
        org_id: data.id,
        user_id: user.id,
        role: "owner" as any,
      });

      return { id: data.id, name: data.name, description: data.description, created_by: data.created_by, invite_code: data.invite_code, created_at: data.created_at, type: data.type } as Group;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast({ title: "Grupo creado", description: "Tu grupo fue creado exitosamente." });
    },
  });

  const joinGroupMutation = useMutation({
    mutationFn: async (inviteCode: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const { data: foundOrgs, error: findError } = await supabase
        .rpc("find_org_by_invite_code", { _code: inviteCode });

      if (findError) throw findError;
      if (!foundOrgs || foundOrgs.length === 0) {
        throw new Error("Código de invitación inválido");
      }

      const org = foundOrgs[0];

      const { error: joinError } = await supabase
        .from("organization_members")
        .insert({ org_id: org.id, user_id: user.id, role: "member" as any });

      if (joinError) {
        if (joinError.code === "23505") throw new Error("Ya sos miembro de este grupo");
        throw joinError;
      }

      return org;
    },
    onSuccess: (org) => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast({ title: "¡Te uniste!", description: `Ahora sos parte de "${org.name}".` });
    },
  });

  const leaveGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const { error } = await supabase
        .from("organization_members")
        .delete()
        .eq("org_id", groupId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      toast({ title: "Saliste del grupo" });
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      const { error } = await supabase.from("organizations").delete().eq("id", groupId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      toast({ title: "Grupo eliminado" });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async ({ groupId, userId }: { groupId: string; userId: string }) => {
      const { error } = await supabase
        .from("organization_members")
        .delete()
        .eq("org_id", groupId)
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast({ title: "Miembro eliminado" });
    },
  });

  const fetchMembers = async (groupId: string): Promise<GroupMember[]> => {
    const { data, error } = await supabase
      .from("organization_members")
      .select("*")
      .eq("org_id", groupId);

    if (error) throw error;

    const userIds = (data || []).map((m) => m.user_id);
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", userIds);

      const profileMap = new Map((profiles || []).map((p) => [p.user_id, p.display_name]));
      return (data || []).map((m) => ({
        id: m.id,
        group_id: m.org_id,
        user_id: m.user_id,
        role: m.role,
        created_at: m.created_at,
        display_name: profileMap.get(m.user_id) || "Usuario",
      })) as GroupMember[];
    }

    return (data || []).map((m) => ({
      id: m.id,
      group_id: m.org_id,
      user_id: m.user_id,
      role: m.role,
      created_at: m.created_at,
    })) as GroupMember[];
  };

  return {
    groups,
    agencyOrg,
    loading: isLoading,
    createGroup: createGroupMutation.mutateAsync,
    joinGroup: joinGroupMutation.mutateAsync,
    leaveGroup: leaveGroupMutation.mutateAsync,
    deleteGroup: deleteGroupMutation.mutateAsync,
    removeMember: removeMemberMutation.mutateAsync,
    fetchMembers,
  };
}
