-- Nuevo rol de aplicación para agentes no administradores.
ALTER TYPE public.app_role
ADD VALUE IF NOT EXISTS 'agencymember';

-- Alta inicial: cuentas de tipo agency arrancan como agencymember.
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account_type text;
BEGIN
  v_account_type := NEW.raw_user_meta_data->>'account_type';

  IF v_account_type = 'agency' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'agencymember')
    ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;
