
-- Drop duplicate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Update handle_new_user_profile to extract metadata from auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, phone, email)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      ''
    ),
    COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone, ''),
    COALESCE(NEW.email, '')
  )
  ON CONFLICT (user_id) DO UPDATE SET
    display_name = CASE WHEN profiles.display_name = '' OR profiles.display_name IS NULL 
      THEN EXCLUDED.display_name ELSE profiles.display_name END,
    phone = CASE WHEN profiles.phone = '' OR profiles.phone IS NULL 
      THEN EXCLUDED.phone ELSE profiles.phone END,
    email = CASE WHEN profiles.email IS NULL OR profiles.email = '' 
      THEN EXCLUDED.email ELSE profiles.email END;
  RETURN NEW;
END;
$function$;

-- Also drop duplicate email sync trigger
DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;
