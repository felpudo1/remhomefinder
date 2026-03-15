
CREATE OR REPLACE FUNCTION public.admin_physical_delete_user(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Solo admins pueden ejecutar esta función
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Borrar el perfil (CASCADE borra automáticamente: user_roles, organization_members,
  -- properties, user_listings, agent_publications, property_reviews, family_comments,
  -- agency_comments, status_history_log, partner_leads)
  DELETE FROM public.profiles WHERE user_id = _user_id;

  -- Borrar organizaciones creadas por el usuario (que ya no tienen miembros)
  DELETE FROM public.organizations WHERE created_by = _user_id;

  -- Finalmente borrar de auth.users
  DELETE FROM auth.users WHERE id = _user_id;
END;
$$;
