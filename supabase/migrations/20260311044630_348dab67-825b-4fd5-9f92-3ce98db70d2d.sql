
CREATE OR REPLACE FUNCTION public.assign_agency_role_on_create()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.created_by, 'agency')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  DELETE FROM public.user_roles
  WHERE user_id = NEW.created_by AND role = 'user';
  
  RETURN NEW;
END;
$function$;
