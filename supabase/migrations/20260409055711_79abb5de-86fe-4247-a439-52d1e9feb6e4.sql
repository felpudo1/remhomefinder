
CREATE OR REPLACE FUNCTION public.get_my_referrer_full_info()
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT jsonb_build_object(
    'referrer_display_name', COALESCE(NULLIF(TRIM(p.display_name), ''), NULL),
    'agency_name', o.name,
    'agency_logo_url', CASE WHEN COALESCE(o.logo_url, '') = '' THEN NULL ELSE o.logo_url END
  )
  FROM public.profiles p_self
  JOIN public.profiles p ON p.user_id = p_self.referred_by_id
  LEFT JOIN public.organization_members om ON om.user_id = p.user_id AND om.is_active = true
  LEFT JOIN public.organizations o ON o.id = om.org_id AND o.type = 'agency_team' AND o.is_personal = false
  WHERE p_self.user_id = auth.uid()
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_referrer_full_info() TO authenticated;
