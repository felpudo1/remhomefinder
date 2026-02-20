import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Property, PropertyStatus, PropertyComment } from "@/types/property";

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
  created_at: string;
  updated_at: string;
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
    images: db.images || [],
    aiSummary: db.ai_summary,
    comments: comments.map((c) => ({
      id: c.id,
      author: c.author,
      avatar: c.avatar,
      text: c.text,
      createdAt: new Date(c.created_at),
    })),
    createdAt: new Date(db.created_at),
  };
}

export function useProperties() {
  const queryClient = useQueryClient();

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
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const { data, error } = await supabase
        .from("properties")
        .insert({
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
          images: [],
        })
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
    mutationFn: async ({ id, status }: { id: string; status: PropertyStatus }) => {
      const { error } = await supabase
        .from("properties")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
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

      const { error } = await supabase.from("property_comments").insert({
        property_id: propertyId,
        user_id: user.id,
        author: comment.author,
        avatar: comment.avatar,
        text: comment.text,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
  });

  return {
    properties,
    loading,
    error,
    addProperty: addPropertyMutation.mutateAsync,
    updateStatus: (id: string, status: PropertyStatus) => updateStatusMutation.mutateAsync({ id, status }),
    addComment: (id: string, comment: Omit<PropertyComment, "id" | "createdAt">) =>
      addCommentMutation.mutateAsync({ propertyId: id, comment }),
    refetch: () => queryClient.invalidateQueries({ queryKey: ["properties"] }),
  };
}
