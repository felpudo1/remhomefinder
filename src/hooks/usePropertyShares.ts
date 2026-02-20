import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type SharePermission = "view" | "comment" | "edit" | "full";

export interface PropertyShare {
  id: string;
  owner_id: string;
  shared_with_id: string;
  permission: SharePermission;
  created_at: string;
  shared_email?: string;
}

export function usePropertyShares() {
  const [shares, setShares] = useState<PropertyShare[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchShares = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("property_shares")
        .select("*")
        .eq("owner_id", user.id);

      if (error) throw error;
      setShares((data as PropertyShare[]) || []);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchShares();
  }, [fetchShares]);

  const addShare = async (email: string, permission: SharePermission) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("No autenticado");

    // Find user by email via edge function
    const res = await supabase.functions.invoke("find-user-by-email", {
      body: { email },
    });

    if (res.error) {
      throw new Error(res.error.message || "Error buscando usuario");
    }
    
    const responseData = res.data as { user_id?: string; email?: string; error?: string };
    
    if (responseData.error) {
      throw new Error(responseData.error);
    }

    if (!responseData.user_id) {
      throw new Error("Usuario no encontrado");
    }

    const { error } = await supabase.from("property_shares").insert({
      owner_id: session.user.id,
      shared_with_id: responseData.user_id,
      permission,
    });

    if (error) {
      if (error.code === "23505") {
        throw new Error("Ya compartiste con este usuario");
      }
      throw error;
    }

    await fetchShares();
  };

  const removeShare = async (shareId: string) => {
    const { error } = await supabase
      .from("property_shares")
      .delete()
      .eq("id", shareId);

    if (error) throw error;
    await fetchShares();
  };

  const updatePermission = async (shareId: string, permission: SharePermission) => {
    const { error } = await supabase
      .from("property_shares")
      .update({ permission })
      .eq("id", shareId);

    if (error) throw error;
    await fetchShares();
  };

  return { shares, loading, addShare, removeShare, updatePermission, refetch: fetchShares };
}
