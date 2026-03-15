
-- 1. Add is_personal column
ALTER TABLE public.organizations ADD COLUMN is_personal BOOLEAN NOT NULL DEFAULT false;

-- 2. Mark existing auto-created personal orgs (family type, single owner member = creator)
UPDATE public.organizations o
SET is_personal = true
WHERE o.type = 'family'
  AND EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.org_id = o.id AND om.user_id = o.created_by AND om.role = 'owner'
  )
  AND (SELECT count(*) FROM public.organization_members om2 WHERE om2.org_id = o.id) = 1;

-- 3. Update trigger to mark personal orgs for regular users
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_account_type text;
  v_display_name text;
  v_phone text;
  v_org_name text;
  v_org_id uuid;
BEGIN
  v_account_type := NEW.raw_user_meta_data->>'account_type';
  v_display_name := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    ''
  );
  v_phone := COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone, '');

  INSERT INTO public.profiles (user_id, display_name, phone, email, status)
  VALUES (
    NEW.id,
    v_display_name,
    v_phone,
    COALESCE(NEW.email, ''),
    CASE WHEN v_account_type = 'agency' THEN 'pending'::user_status 
         ELSE 'active'::user_status END
  )
  ON CONFLICT (user_id) DO UPDATE SET
    display_name = CASE WHEN profiles.display_name = '' OR profiles.display_name IS NULL
      THEN EXCLUDED.display_name ELSE profiles.display_name END,
    phone = CASE WHEN profiles.phone = '' OR profiles.phone IS NULL
      THEN EXCLUDED.phone ELSE profiles.phone END,
    email = CASE WHEN profiles.email IS NULL OR profiles.email = ''
      THEN EXCLUDED.email ELSE profiles.email END;

  IF v_account_type = 'agency' THEN
    v_org_name := COALESCE(NEW.raw_user_meta_data->>'agency_name', v_display_name || ' Agency');
    INSERT INTO public.organizations (name, type, created_by, is_personal)
    VALUES (v_org_name, 'agency_team', NEW.id, false)
    RETURNING id INTO v_org_id;
  ELSE
    INSERT INTO public.organizations (name, type, created_by, is_personal)
    VALUES (COALESCE(NULLIF(v_display_name, ''), 'Mi Familia'), 'family', NEW.id, true)
    RETURNING id INTO v_org_id;
  END IF;

  INSERT INTO public.organization_members (org_id, user_id, role)
  VALUES (v_org_id, NEW.id, 'owner');

  RETURN NEW;
END;
$function$;
