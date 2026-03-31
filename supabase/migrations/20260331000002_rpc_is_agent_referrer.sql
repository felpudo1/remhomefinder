-- Función RPC para que un usuario pueda saber si su referidor es una agencia (sin lidiar con RLS)
CREATE OR REPLACE FUNCTION public.is_agent_referrer(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.organizations
    WHERE created_by = _user_id AND type = 'agency_team'
  );
$$;
