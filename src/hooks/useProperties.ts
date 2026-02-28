import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Property, PropertyStatus, PropertyComment } from "@/types/property";

import defaultHouse1 from "@/assets/default-house-1.jpg";
import defaultHouse2 from "@/assets/default-house-2.jpg";
import defaultHouse3 from "@/assets/default-house-3.jpg";
import defaultHouse4 from "@/assets/default-house-4.jpg";
import defaultHouse5 from "@/assets/default-house-5.jpg";

const DEFAULT_HOUSE_IMAGES = [defaultHouse1, defaultHouse2, defaultHouse3, defaultHouse4, defaultHouse5];

interface DbProperty {
  id: string;
  user_id: string;
  url: string;
  title: string;
  price_rent: number;
  price_expenses: number;
  total_cost: number;
  currency: string;
  neighborhood: string;
  sq_meters: number;
  rooms: number;
  status: string;
  images: string[];
  ai_summary: string;
  created_by_email: string;
  created_at: string;
  updated_at: string;
  group_id: string | null;
}

interface DbComment {
  id: string;
  property_id: string;
  user_id: string;
  author: string;
  avatar: string;
  text: string;
  created_at: string;
}

function resolveImages(dbImages: string[]): string[] {
  if (!dbImages || dbImages.length === 0) {
    return [DEFAULT_HOUSE_IMAGES[Math.floor(Math.random() * DEFAULT_HOUSE_IMAGES.length)]];
  }
  return dbImages.map((img) => {
    // External URLs (scraped images) - use as-is
    if (img.startsWith("http://") || img.startsWith("https://")) return img;
    // Default house image references
    const match = img.match(/default-house-(\d+)\.jpg/);
    if (match) {
      const idx = parseInt(match[1], 10) - 1;
      if (idx >= 0 && idx < DEFAULT_HOUSE_IMAGES.length) return DEFAULT_HOUSE_IMAGES[idx];
    }
    return img;
  });
}

function mapDbToProperty(db: DbProperty, comments: DbComment[]): Property {
  return {
    id: db.id,
    url: db.url,
    title: db.title,
    priceRent: Number(db.price_rent),
    priceExpenses: Number(db.price_expenses),
    totalCost: Number(db.total_cost),
    currency: db.currency,
    neighborhood: db.neighborhood,
    sqMeters: Number(db.sq_meters),
    rooms: db.rooms,
    status: db.status as PropertyStatus,
    images: resolveImages(db.images),
    aiSummary: db.ai_summary,
    createdByEmail: db.created_by_email,
    comments: comments.map((c) => ({
      id: c.id,
      author: c.author,
      avatar: c.avatar,
      text: c.text,
      createdAt: new Date(c.created_at),
    })),
    createdAt: new Date(db.created_at),
    deletedReason: (db as any).deleted_reason || "",
    deletedByEmail: (db as any).deleted_by_email || "",
    discardedReason: (db as any).discarded_reason || "",
    discardedByEmail: (db as any).discarded_by_email || "",
    statusChangedByEmail: (db as any).status_changed_by_email || "",
    statusChangedAt: db.updated_at ? new Date(db.updated_at) : null,
    coordinatedDate: (db as any).coordinated_date ? new Date((db as any).coordinated_date) : null,
    groupId: (db as any).group_id || null,
    sourceMarketplaceId: (db as any).source_marketplace_id || null,
  };
}

export function useProperties() {
  const queryClient = useQueryClient();

  // Real-time subscription for comments and properties
  useEffect(() => {
    const channel = supabase
      .channel("db_realtime_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "property_comments" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["properties"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "properties" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["properties"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const { data: properties = [], isLoading: loading, error } = useQuery({
    queryKey: ["properties"],
    queryFn: async () => {
      const { data: props, error: propsError } = await supabase
        .from("properties")
        .select("*")
        .order("created_at", { ascending: false });

      if (propsError) throw propsError;
      if (!props) return [];

      const propertyIds = props.map((p) => p.id);
      let comments: DbComment[] = [];

      if (propertyIds.length > 0) {
        const { data: commentsData, error: commentsError } = await supabase
          .from("property_comments")
          .select("*")
          .in("property_id", propertyIds)
          .order("created_at", { ascending: true });

        if (commentsError) throw commentsError;
        comments = (commentsData as DbComment[]) || [];
      }

      return props.map((p) =>
        mapDbToProperty(p as DbProperty, comments.filter((c) => c.property_id === p.id))
      );
    },
  });

  const addPropertyMutation = useMutation({
    mutationFn: async (form: {
      url: string;
      title: string;
      priceRent: number;
      priceExpenses: number;
      currency: string;
      neighborhood: string;
      sqMeters: number;
      rooms: number;
      aiSummary: string;
      images?: string[];
      groupId?: string | null;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      // Use scraped images if available, otherwise random default
      const propertyImages = form.images && form.images.length > 0
        ? form.images
        : [DEFAULT_HOUSE_IMAGES[Math.floor(Math.random() * DEFAULT_HOUSE_IMAGES.length)]];

      const insertData: any = {
        user_id: user.id,
        url: form.url || "",
        title: form.title,
        price_rent: form.priceRent,
        price_expenses: form.priceExpenses,
        total_cost: form.priceRent + form.priceExpenses,
        currency: form.currency,
        neighborhood: form.neighborhood,
        sq_meters: form.sqMeters,
        rooms: form.rooms,
        ai_summary: form.aiSummary,
        created_by_email: user.email || "",
        images: propertyImages,
      };

      if (form.groupId) {
        insertData.group_id = form.groupId;
      }

      const { data, error } = await supabase
        .from("properties")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, deletedReason, coordinatedDate, groupId }: { id: string; status: PropertyStatus; deletedReason?: string; coordinatedDate?: string | null; groupId?: string | null }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const updateData: any = { status, status_changed_by: user?.id || null, status_changed_by_email: user?.email || "" };
      
      if (groupId !== undefined) {
        updateData.group_id = groupId;
      }
      if (status === "coordinated" && coordinatedDate) {
        updateData.coordinated_date = coordinatedDate;
      }
      // Guardar motivo y usuario para eliminados
      if (status === "eliminado") {
        updateData.deleted_reason = deletedReason || "";
        updateData.deleted_by_email = user?.email || "";
      }
      // Guardar motivo y usuario para descartados
      if (status === "discarded") {
        updateData.discarded_reason = deletedReason || "";
        updateData.discarded_by_email = user?.email || "";
      }
      const { data, error } = await supabase
        .from("properties")
        .update(updateData)
        .eq("id", id)
        .select();
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error("permission denied");
      }
      return { id, status };
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ["properties"] });
      const previousProperties = queryClient.getQueryData<Property[]>(["properties"]);

      if (previousProperties) {
        queryClient.setQueryData<Property[]>(
          ["properties"],
          previousProperties.map((p) => (p.id === id ? { ...p, status } : p))
        );
      }
      return { previousProperties };
    },
    onError: (err, newTodo, context) => {
      if (context?.previousProperties) {
        queryClient.setQueryData(["properties"], context.previousProperties);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async ({
      propertyId,
      comment,
    }: {
      propertyId: string;
      comment: Omit<PropertyComment, "id" | "createdAt">;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const { data, error } = await supabase.from("property_comments").insert({
        property_id: propertyId,
        user_id: user.id,
        author: comment.author,
        avatar: comment.avatar,
        text: comment.text,
      }).select();

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error("permission denied");
      }
    },
    onMutate: async ({ propertyId, comment }) => {
      await queryClient.cancelQueries({ queryKey: ["properties"] });
      const previousProperties = queryClient.getQueryData<Property[]>(["properties"]);

      const { data: { user } } = await supabase.auth.getUser();

      if (previousProperties && user) {
        queryClient.setQueryData<Property[]>(
          ["properties"],
          previousProperties.map((p) => {
            if (p.id === propertyId) {
              return {
                ...p,
                comments: [
                  ...p.comments,
                  {
                    id: crypto.randomUUID(), // Temp ID
                    author: comment.author,
                    avatar: comment.avatar,
                    text: comment.text,
                    createdAt: new Date(),
                  },
                ],
              };
            }
            return p;
          })
        );
      }

      return { previousProperties };
    },
    onError: (err, newComment, context) => {
      if (context?.previousProperties) {
        queryClient.setQueryData(["properties"], context.previousProperties);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
  });

  return {
    properties,
    loading,
    error,
    addProperty: addPropertyMutation.mutateAsync,
    updateStatus: (id: string, status: PropertyStatus, deletedReason?: string, coordinatedDate?: string | null, groupId?: string | null) => 
      updateStatusMutation.mutateAsync({ id, status, deletedReason, coordinatedDate, groupId }),
    addComment: (id: string, comment: Omit<PropertyComment, "id" | "createdAt">) =>
      addCommentMutation.mutateAsync({ propertyId: id, comment }),
    refetch: () => queryClient.invalidateQueries({ queryKey: ["properties"] }),
  };
}
