-- 1. Update handle_new_user_role to check account_type from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_account_type text;
BEGIN
  v_account_type := NEW.raw_user_meta_data->>'account_type';
  
  IF v_account_type = 'agency' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'agency')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 2. Update handle_new_user_profile to also create agency record from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_account_type text;
  v_agency_name text;
  v_display_name text;
  v_phone text;
  v_agency_phone text;
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
    CASE WHEN v_account_type = 'agency' THEN 'pending'::user_status ELSE 'active'::user_status END
  )
  ON CONFLICT (user_id) DO UPDATE SET
    display_name = CASE WHEN profiles.display_name = '' OR profiles.display_name IS NULL 
      THEN EXCLUDED.display_name ELSE profiles.display_name END,
    phone = CASE WHEN profiles.phone = '' OR profiles.phone IS NULL 
      THEN EXCLUDED.phone ELSE profiles.phone END,
    email = CASE WHEN profiles.email IS NULL OR profiles.email = '' 
      THEN EXCLUDED.email ELSE profiles.email END;

  IF v_account_type = 'agency' THEN
    v_agency_name := NEW.raw_user_meta_data->>'agency_name';
    v_agency_phone := COALESCE(NEW.raw_user_meta_data->>'agency_phone', '');
    
    IF v_agency_name IS NOT NULL AND v_agency_name <> '' THEN
      INSERT INTO public.agencies (name, contact_name, contact_email, contact_phone, contact_person_phone, created_by)
      VALUES (
        v_agency_name,
        v_display_name,
        COALESCE(NEW.email, ''),
        v_agency_phone,
        v_phone,
        NEW.id
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;