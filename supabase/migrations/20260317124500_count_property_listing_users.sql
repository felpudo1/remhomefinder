-- Cuenta cuántos usuarios distintos guardaron una propiedad en sus listados.
-- SECURITY DEFINER para evitar recorte por RLS en este caso de métrica global.
CREATE OR REPLACE FUNCTION public.count_property_listing_users(_property_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(DISTINCT ul.added_by)::integer
  FROM public.user_listings ul
  WHERE ul.property_id = _property_id;
$$;

REVOKE ALL ON FUNCTION public.count_property_listing_users(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.count_property_listing_users(uuid) TO authenticated;
