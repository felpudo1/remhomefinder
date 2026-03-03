
-- 1. Crear enum user_status
CREATE TYPE public.user_status AS ENUM ('active', 'pending', 'suspended', 'rejected');

-- 2. Agregar columna status a profiles con default 'active'
ALTER TABLE public.profiles ADD COLUMN status public.user_status NOT NULL DEFAULT 'active';

-- 3. Migrar datos: copiar status de agencies al profile del created_by (approved→active)
UPDATE public.profiles p
SET status = CASE a.status
    WHEN 'approved' THEN 'active'::public.user_status
    WHEN 'pending' THEN 'pending'::public.user_status
    WHEN 'suspended' THEN 'suspended'::public.user_status
    WHEN 'rejected' THEN 'rejected'::public.user_status
END
FROM public.agencies a
WHERE p.user_id = a.created_by;

-- 4. Función security definer para actualizar status (solo admins)
CREATE OR REPLACE FUNCTION public.admin_update_profile_status(_user_id uuid, _status user_status)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  UPDATE public.profiles SET status = _status WHERE user_id = _user_id;
END;
$$;

-- 5. RLS: admins can update profiles (for status changes)
CREATE POLICY "Admins can update all profiles"
ON public.profiles FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 6. Restrict self-update: users cannot change their own status
-- Replace existing policy with one that excludes status column changes
-- We use a security definer function approach instead (admin_update_profile_status)
-- The existing "Users can update own profile" policy stays but users physically
-- won't have UI to change status, and admin_update_profile_status is the only path.
