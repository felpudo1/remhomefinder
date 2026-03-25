-- Conteo de referidos sin verse bloqueado por RLS de profiles (el referente no puede SELECT filas de usuarios fuera de su org).
CREATE OR REPLACE FUNCTION public.count_profiles_referred_by(_referrer_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ok boolean := false;
  v_count integer;
BEGIN
  IF _referrer_user_id IS NULL THEN
    RETURN 0;
  END IF;

  IF _referrer_user_id = auth.uid() THEN
    v_ok := true;
  ELSIF public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    v_ok := true;
  ELSIF EXISTS (
    SELECT 1
    FROM public.organization_members om
    JOIN public.organizations o ON o.id = om.org_id
    WHERE om.user_id = auth.uid()
      AND o.created_by = _referrer_user_id
  ) THEN
    v_ok := true;
  END IF;

  IF NOT v_ok THEN
    RETURN 0;
  END IF;

  SELECT COUNT(*)::integer INTO v_count
  FROM public.profiles p
  WHERE p.referred_by_id = _referrer_user_id;

  RETURN COALESCE(v_count, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.count_profiles_referred_by(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.count_profiles_referred_by(uuid) TO authenticated;
