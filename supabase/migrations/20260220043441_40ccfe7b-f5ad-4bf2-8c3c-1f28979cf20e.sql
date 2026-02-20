
-- Paso 1: Crear tabla property_shares
CREATE TABLE public.property_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  shared_with_id UUID NOT NULL,
  permission TEXT NOT NULL DEFAULT 'view',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(owner_id, shared_with_id)
);

ALTER TABLE public.property_shares ENABLE ROW LEVEL SECURITY;

-- Paso 2: Funciones SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.has_property_access(
  _property_user_id UUID, 
  _accessing_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM property_shares
    WHERE owner_id = _property_user_id
      AND shared_with_id = _accessing_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.has_property_permission(
  _property_user_id UUID, 
  _accessing_user_id UUID,
  _permissions TEXT[]
)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM property_shares
    WHERE owner_id = _property_user_id
      AND shared_with_id = _accessing_user_id
      AND permission = ANY(_permissions)
  );
$$;

-- Paso 3: RLS en property_shares
CREATE POLICY "Owners can view their shares"
  ON public.property_shares FOR SELECT
  USING (owner_id = auth.uid() OR shared_with_id = auth.uid());

CREATE POLICY "Owners can create shares"
  ON public.property_shares FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can delete shares"
  ON public.property_shares FOR DELETE
  USING (owner_id = auth.uid());

CREATE POLICY "Owners can update shares"
  ON public.property_shares FOR UPDATE
  USING (owner_id = auth.uid());

-- Paso 4: Actualizar RLS de properties
DROP POLICY IF EXISTS "Users can view their own properties" ON public.properties;
DROP POLICY IF EXISTS "Users can update their own properties" ON public.properties;

CREATE POLICY "Users can view own or shared properties"
  ON public.properties FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.has_property_access(user_id, auth.uid())
  );

CREATE POLICY "Users can update own or shared-edit properties"
  ON public.properties FOR UPDATE
  USING (
    user_id = auth.uid()
    OR public.has_property_permission(user_id, auth.uid(), ARRAY['edit','full'])
  );

-- Paso 5: Actualizar RLS de property_comments
DROP POLICY IF EXISTS "Users can view comments on their properties" ON public.property_comments;
DROP POLICY IF EXISTS "Users can create comments on their properties" ON public.property_comments;

CREATE POLICY "Users can view comments on accessible properties"
  ON public.property_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_comments.property_id
        AND (
          p.user_id = auth.uid()
          OR public.has_property_access(p.user_id, auth.uid())
        )
    )
  );

CREATE POLICY "Users can comment on accessible properties"
  ON public.property_comments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_comments.property_id
        AND (
          p.user_id = auth.uid()
          OR public.has_property_permission(p.user_id, auth.uid(), ARRAY['comment','edit','full'])
        )
    )
  );
