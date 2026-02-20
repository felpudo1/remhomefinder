import { useState, useEffect, useCallback } from "react";
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
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    const { data: props, error: propsError } = await supabase
      .from("properties")
      .select("*")
      .order("created_at", { ascending: false });

    if (propsError || !props) {
      console.error("Error fetching properties:", propsError);
      setLoading(false);
      return;
    }

    const propertyIds = props.map((p: any) => p.id);
    let comments: DbComment[] = [];
    if (propertyIds.length > 0) {
      const { data: commentsData } = await supabase
        .from("property_comments")
        .select("*")
        .in("property_id", propertyIds)
        .order("created_at", { ascending: true });
      comments = (commentsData as DbComment[]) || [];
    }

    const mapped = props.map((p: any) =>
      mapDbToProperty(p as DbProperty, comments.filter((c) => c.property_id === p.id))
    );
    setProperties(mapped);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const addProperty = async (form: {
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
    await fetchProperties();
    return data;
  };

  const updateStatus = async (id: string, status: PropertyStatus) => {
    const { error } = await supabase
      .from("properties")
      .update({ status })
      .eq("id", id);

    if (error) throw error;
    setProperties((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status } : p))
    );
  };

  const addComment = async (
    propertyId: string,
    comment: Omit<PropertyComment, "id" | "createdAt">
  ) => {
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
    await fetchProperties();
  };

  return { properties, loading, addProperty, updateStatus, addComment, refetch: fetchProperties };
}
