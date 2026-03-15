
-- Fix 1: Replace admin_physical_delete_user (3-param) to actually delete profile + orgs + auth.users
CREATE OR REPLACE FUNCTION public.admin_physical_delete_user(_user_id uuid, _reason text, _deleted_by uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
    v_display_name  TEXT;
    v_email         TEXT;
    v_phone         TEXT;
    v_plan_type     TEXT;
    v_status        TEXT;
BEGIN
    -- Solo admins pueden ejecutar esta función
    IF NOT has_role(_deleted_by, 'admin') THEN
      RAISE EXCEPTION 'Unauthorized';
    END IF;

    -- Capturar datos del usuario ANTES de borrar
    SELECT
        display_name,
        email,
        phone,
        plan_type::TEXT,
        status::TEXT
    INTO v_display_name, v_email, v_phone, v_plan_type, v_status
    FROM public.profiles
    WHERE user_id = _user_id;

    -- Insertar registro de auditoría (si falla, no se borra el usuario)
    INSERT INTO public.deletion_audit_log (
        deleted_user_id,
        display_name,
        email,
        phone,
        plan_type,
        status_before,
        reason,
        deleted_by
    ) VALUES (
        _user_id,
        v_display_name,
        v_email,
        v_phone,
        v_plan_type,
        v_status,
        _reason,
        _deleted_by
    );

    -- Borrar el perfil (CASCADE borra: user_roles, organization_members,
    -- properties, user_listings, agent_publications, property_reviews,
    -- family_comments, agency_comments, status_history_log, partner_leads)
    DELETE FROM public.profiles WHERE user_id = _user_id;

    -- Borrar organizaciones creadas por el usuario (que ya no tienen miembros)
    DELETE FROM public.organizations WHERE created_by = _user_id;

    -- Finalmente borrar de auth.users
    DELETE FROM auth.users WHERE id = _user_id;
END;
$$;

-- Fix 2: Allow admins to INSERT into publication_deletion_audit_log
CREATE POLICY "Admins can insert publication audit log"
ON public.publication_deletion_audit_log
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'::app_role
  )
);
