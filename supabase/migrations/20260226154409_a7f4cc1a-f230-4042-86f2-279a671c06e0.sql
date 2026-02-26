
-- ============================================================
-- CONSOLIDATED SCHEMA MIGRATION
-- Combines 15 original migrations into one
-- ============================================================

-- 1. Create enum type for property status
CREATE TYPE public.property_status AS ENUM (
  'contacted', 'coordinated', 'visited', 'discarded', 'ingresado', 'a_analizar', 'eliminado'
);

-- 2. Create properties table
CREATE TABLE public.properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL,
  price_rent NUMERIC NOT NULL DEFAULT 0,
  price_expenses NUMERIC NOT NULL DEFAULT 0,
  total_cost NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  neighborhood TEXT NOT NULL DEFAULT '',
  sq_meters NUMERIC NOT NULL DEFAULT 0,
  rooms INTEGER NOT NULL DEFAULT 1,
  status property_status NOT NULL DEFAULT 'ingresado',
  images TEXT[] NOT NULL DEFAULT '{}',
  ai_summary TEXT NOT NULL DEFAULT '',
  created_by_email TEXT NOT NULL DEFAULT '',
  status_changed_by UUID,
  deleted_reason TEXT DEFAULT '',
  deleted_by_email TEXT DEFAULT '',
  discarded_reason TEXT DEFAULT '',
  discarded_by_email TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Create property comments table
CREATE TABLE public.property_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  author TEXT NOT NULL,
  avatar TEXT NOT NULL DEFAULT '',
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Create property shares table
CREATE TABLE public.property_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  shared_with_id UUID NOT NULL,
  permission TEXT NOT NULL DEFAULT 'view',
  shared_email TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(owner_id, shared_with_id)
);

-- 5. Enable RLS on all tables
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_shares ENABLE ROW LEVEL SECURITY;

-- 6. Helper functions (SECURITY DEFINER)
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

CREATE OR REPLACE FUNCTION public.can_view_property(_property_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH prop AS (
    SELECT user_id FROM properties WHERE id = _property_id
  )
  SELECT EXISTS (
    SELECT 1 FROM prop
    WHERE user_id = _user_id
       OR EXISTS (
            SELECT 1 FROM property_shares
            WHERE owner_id = prop.user_id
              AND shared_with_id = _user_id
          )
  );
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 7. Trigger for updated_at
CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Properties RLS policies
CREATE POLICY "Users can view own or shared properties"
  ON public.properties FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.has_property_access(user_id, auth.uid())
  );

CREATE POLICY "Public can view properties by id"
  ON public.properties FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Users can create their own properties"
  ON public.properties FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own or shared-edit properties"
  ON public.properties FOR UPDATE
  USING (
    user_id = auth.uid()
    OR public.has_property_permission(user_id, auth.uid(), ARRAY['edit','full'])
  );

CREATE POLICY "Users can delete their own properties"
  ON public.properties FOR DELETE USING (auth.uid() = user_id);

-- 9. Comments RLS policies
CREATE POLICY "Users can view comments on accessible properties"
  ON public.property_comments FOR SELECT
  USING ( public.can_view_property(property_id, auth.uid()) );

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

CREATE POLICY "Users can delete their own comments"
  ON public.property_comments FOR DELETE
  USING (user_id = auth.uid());

-- 10. Shares RLS policies
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

-- 11. Unique index on URL (only non-empty)
CREATE UNIQUE INDEX idx_properties_unique_url ON public.properties (url) WHERE url != '';

-- 12. Storage bucket for property images
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true);

CREATE POLICY "Authenticated users can upload property images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'property-images');

CREATE POLICY "Public read access for property images"
ON storage.objects FOR SELECT
USING (bucket_id = 'property-images');

CREATE POLICY "Users can delete their own property images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'property-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 13. Enable Realtime
alter publication supabase_realtime add table public.properties;
alter publication supabase_realtime add table public.property_comments;
alter table public.properties replica identity full;
alter table public.property_comments replica identity full;
