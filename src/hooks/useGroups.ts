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

export function useGroups() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ["groups"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Get groups where user is a member
      const { data: memberships, error: memError } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", user.id);

      if (memError) throw memError;

      const groupIds = memberships?.map((m) => m.group_id) || [];

      // Also get groups created by user (owner might not be in members yet)
      const { data: ownedGroups, error: ownError } = await supabase
        .from("groups")
        .select("*")
        .eq("created_by", user.id);

      if (ownError) throw ownError;

      let allGroups: Group[] = (ownedGroups as Group[]) || [];

      if (groupIds.length > 0) {
        const { data: memberGroups, error: grpError } = await supabase
          .from("groups")
          .select("*")
          .in("id", groupIds);

        if (grpError) throw grpError;

        // Merge without duplicates
        const existingIds = new Set(allGroups.map((g) => g.id));
        (memberGroups || []).forEach((g) => {
          if (!existingIds.has(g.id)) allGroups.push(g as Group);
        });
      }

      return allGroups;
    },
  });

  const createGroupMutation = useMutation({
    mutationFn: async ({ name, description }: { name: string; description: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const { data, error } = await supabase
        .from("groups")
        .insert({ name, description, created_by: user.id })
        .select()
        .single();

      if (error) throw error;

      // Add creator as member with 'owner' role
      await supabase.from("group_members").insert({
        group_id: data.id,
        user_id: user.id,
        role: "owner",
      });

      return data as Group;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast({ title: "Grupo creado", description: "Tu grupo familiar fue creado exitosamente." });
    },
  });

  const joinGroupMutation = useMutation({
    mutationFn: async (inviteCode: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      // Find group by invite code using security definer function
      const { data: foundGroups, error: findError } = await supabase
        .rpc("find_group_by_invite_code", { _code: inviteCode });

      if (findError) throw findError;
      if (!foundGroups || foundGroups.length === 0) {
        throw new Error("Código de invitación inválido");
      }

      const group = foundGroups[0];

      // Join the group
      const { error: joinError } = await supabase
        .from("group_members")
        .insert({ group_id: group.id, user_id: user.id, role: "member" });

      if (joinError) {
        if (joinError.code === "23505") throw new Error("Ya sos miembro de este grupo");
        throw joinError;
      }

      return group;
    },
    onSuccess: (group) => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast({ title: "¡Te uniste!", description: `Ahora sos parte de "${group.name}".` });
    },
  });

  const leaveGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const { error } = await supabase
        .from("group_members")
        .delete()
        .eq("group_id", groupId)
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
      const { error } = await supabase.from("groups").delete().eq("id", groupId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      toast({ title: "Grupo eliminado" });
    },
  });

  const fetchMembers = async (groupId: string): Promise<GroupMember[]> => {
    const { data, error } = await supabase
      .from("group_members")
      .select("*")
      .eq("group_id", groupId);

    if (error) throw error;

    // Enrich with profile display names
    const userIds = (data || []).map((m) => m.user_id);
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", userIds);

      const profileMap = new Map((profiles || []).map((p) => [p.user_id, p.display_name]));
      return (data || []).map((m) => ({
        ...m,
        display_name: profileMap.get(m.user_id) || "Usuario",
      })) as GroupMember[];
    }

    return (data || []) as GroupMember[];
  };

  return {
    groups,
    loading: isLoading,
    createGroup: createGroupMutation.mutateAsync,
    joinGroup: joinGroupMutation.mutateAsync,
    leaveGroup: leaveGroupMutation.mutateAsync,
    deleteGroup: deleteGroupMutation.mutateAsync,
    fetchMembers,
  };
}
