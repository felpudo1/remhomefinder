
-- Tabla de grupos
CREATE TABLE public.groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  created_by uuid NOT NULL,
  invite_code text NOT NULL DEFAULT encode(gen_random_bytes(6), 'hex'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Miembros del grupo
CREATE TABLE public.group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Vincular propiedades a grupos (una propiedad puede pertenecer a un grupo)
ALTER TABLE public.properties ADD COLUMN group_id uuid REFERENCES public.groups(id) ON DELETE SET NULL;

-- Función helper para verificar membresía
CREATE OR REPLACE FUNCTION public.is_group_member(_user_id uuid, _group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE user_id = _user_id AND group_id = _group_id
  );
$$;

-- Función helper para verificar si es owner del grupo
CREATE OR REPLACE FUNCTION public.is_group_owner(_user_id uuid, _group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.groups
    WHERE id = _group_id AND created_by = _user_id
  );
$$;

-- RLS para groups
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their groups"
  ON public.groups FOR SELECT
  USING (is_group_member(auth.uid(), id) OR created_by = auth.uid());

CREATE POLICY "Authenticated users can create groups"
  ON public.groups FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Group owner can update group"
  ON public.groups FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Group owner can delete group"
  ON public.groups FOR DELETE
  USING (created_by = auth.uid());

-- RLS para group_members
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view group members"
  ON public.group_members FOR SELECT
  USING (is_group_member(auth.uid(), group_id));

CREATE POLICY "Users can join groups (insert themselves)"
  ON public.group_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Group owner can remove members"
  ON public.group_members FOR DELETE
  USING (is_group_owner(auth.uid(), group_id) OR user_id = auth.uid());

-- Actualizar RLS de properties para que miembros del grupo vean propiedades del grupo
CREATE POLICY "Group members can view group properties"
  ON public.properties FOR SELECT
  USING (group_id IS NOT NULL AND is_group_member(auth.uid(), group_id));

-- Trigger para updated_at en groups
CREATE TRIGGER update_groups_updated_at
  BEFORE UPDATE ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Función para buscar grupo por código de invitación (security definer para bypass RLS)
CREATE OR REPLACE FUNCTION public.find_group_by_invite_code(_code text)
RETURNS TABLE(id uuid, name text, description text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, name, description FROM public.groups WHERE invite_code = _code LIMIT 1;
$$;
