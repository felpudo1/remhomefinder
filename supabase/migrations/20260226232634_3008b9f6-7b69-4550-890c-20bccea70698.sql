
-- 1. Enum de roles
CREATE TYPE public.app_role AS ENUM ('user', 'agency', 'admin');

-- 2. Enum de estado de agencia
CREATE TYPE public.agency_status AS ENUM ('pending', 'approved', 'rejected');

-- 3. Tabla de roles de usuario
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Tabla de agencias/inmobiliarias
CREATE TABLE public.agencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  logo_url text NOT NULL DEFAULT '',
  contact_email text NOT NULL DEFAULT '',
  contact_phone text NOT NULL DEFAULT '',
  status agency_status NOT NULL DEFAULT 'pending',
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;

-- 5. Tabla de miembros de agencia
CREATE TABLE public.agency_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid REFERENCES public.agencies(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agency_id, user_id)
);

ALTER TABLE public.agency_members ENABLE ROW LEVEL SECURITY;

-- 6. Función security definer para chequear roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 7. Trigger para asignar rol 'user' automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_assign_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- 8. Trigger updated_at para agencies
CREATE TRIGGER update_agencies_updated_at
  BEFORE UPDATE ON public.agencies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 9. RLS policies para user_roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 10. RLS policies para agencies
CREATE POLICY "Anyone authenticated can view approved agencies"
  ON public.agencies FOR SELECT
  TO authenticated
  USING (status = 'approved' OR created_by = auth.uid());

CREATE POLICY "Admins can view all agencies"
  ON public.agencies FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create agencies"
  ON public.agencies FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Admins can update agencies"
  ON public.agencies FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Agency creator can update own pending agency"
  ON public.agencies FOR UPDATE
  USING (created_by = auth.uid() AND status = 'pending');

-- 11. RLS policies para agency_members
CREATE POLICY "Members can view their memberships"
  ON public.agency_members FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all memberships"
  ON public.agency_members FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Agency creator can manage members"
  ON public.agency_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.agencies
      WHERE id = agency_members.agency_id
        AND created_by = auth.uid()
    )
  );
