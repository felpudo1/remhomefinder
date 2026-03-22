CREATE OR REPLACE FUNCTION public.get_search_profile_contacts(_user_ids uuid[])
RETURNS TABLE(user_id uuid, display_name text, phone text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.display_name, p.phone
  FROM public.profiles p
  WHERE p.user_id = ANY(_user_ids)
    AND EXISTS (
      SELECT 1 FROM public.user_search_profiles usp
      WHERE usp.user_id = p.user_id
        AND (usp.is_private IS NULL OR usp.is_private = false)
    );
$$;