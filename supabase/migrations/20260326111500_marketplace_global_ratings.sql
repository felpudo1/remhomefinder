-- RPC to fetch global property ratings in bulk bypassing RLS safely.
-- This allows the Marketplace to show community ratings without exposing individual reviews.

CREATE OR REPLACE FUNCTION public.get_global_property_ratings(_property_ids uuid[])
RETURNS TABLE (property_id uuid, avg_rating numeric, total_votes bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    property_id, 
    ROUND(AVG(rating)::numeric, 2) as avg_rating, 
    COUNT(*) as total_votes
  FROM public.property_reviews
  WHERE property_id = ANY(_property_ids)
  GROUP BY property_id;
$$;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION public.get_global_property_ratings(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_global_property_ratings(uuid[]) TO anon;
