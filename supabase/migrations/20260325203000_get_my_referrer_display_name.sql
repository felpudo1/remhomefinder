-- Permite al usuario ver el nombre de quien lo refirió aunque no compartan org (RLS normal bloquearía el SELECT directo).
CREATE OR REPLACE FUNCTION public.get_my_referrer_display_name()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NULLIF(TRIM(p_ref.display_name), '')::text
  FROM public.profiles p_self
  LEFT JOIN public.profiles p_ref ON p_ref.user_id = p_self.referred_by_id
  WHERE p_self.user_id = auth.uid()
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_my_referrer_display_name() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_referrer_display_name() TO authenticated;
