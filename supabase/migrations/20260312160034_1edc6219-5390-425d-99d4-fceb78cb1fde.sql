CREATE OR REPLACE FUNCTION public.admin_physical_delete_user(_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
BEGIN
  -- 1. Verificar que el caller es admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Solo los administradores pueden realizar borrados físicos.';
  END IF;

  -- 2. No permitir borrarse a sí mismo
  IF _user_id = auth.uid() THEN
    RAISE EXCEPTION 'No podés borrar tu propia cuenta de administrador.';
  END IF;

  -- 3. Borrar datos dependientes en public (no hay FK cascade a auth.users)
  DELETE FROM public.property_comments WHERE user_id = _user_id;
  DELETE FROM public.property_ratings WHERE user_id = _user_id;
  DELETE FROM public.properties WHERE user_id = _user_id;
  DELETE FROM public.group_members WHERE user_id = _user_id;
  DELETE FROM public.agency_members WHERE user_id = _user_id;
  
  -- Borrar agencias creadas por el usuario y sus propiedades de marketplace
  DELETE FROM public.marketplace_properties WHERE agency_id IN (
    SELECT id FROM public.agencies WHERE created_by = _user_id
  );
  DELETE FROM public.agencies WHERE created_by = _user_id;
  
  DELETE FROM public.user_roles WHERE user_id = _user_id;
  DELETE FROM public.profiles WHERE user_id = _user_id;

  -- 4. Borrar de auth.users
  DELETE FROM auth.users WHERE id = _user_id;
END;
$function$;