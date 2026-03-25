
-- ============================================
-- TABLAS FALTANTES: cities, neighborhoods, user_search_profiles
-- (No estaban en las migraciones del repo, se crearon manualmente antes)
-- ============================================

-- CITIES
CREATE TABLE IF NOT EXISTS public.cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  country text NOT NULL DEFAULT 'UY',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_cities_country_name ON public.cities (country, LOWER(name));
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read cities" ON public.cities FOR SELECT TO public USING (true);

-- NEIGHBORHOODS
CREATE TABLE IF NOT EXISTS public.neighborhoods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  city_id uuid NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_neighborhoods_city_name ON public.neighborhoods (city_id, LOWER(name));
ALTER TABLE public.neighborhoods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read neighborhoods" ON public.neighborhoods FOR SELECT TO public USING (true);

-- PROPERTIES: add FK columns for geography
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS city_id uuid REFERENCES public.cities(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS neighborhood_id uuid REFERENCES public.neighborhoods(id) ON DELETE SET NULL;

-- USER_SEARCH_PROFILES (perfil de búsqueda del comprador)
CREATE TABLE IF NOT EXISTS public.user_search_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  operation text NOT NULL DEFAULT 'rent',
  currency text NOT NULL DEFAULT 'USD',
  min_budget numeric DEFAULT 0,
  max_budget numeric DEFAULT 0,
  min_bedrooms integer DEFAULT 0,
  city_id uuid REFERENCES public.cities(id) ON DELETE SET NULL,
  department_id uuid,
  neighborhood_ids uuid[] DEFAULT '{}',
  is_private boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE public.user_search_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own search profile" ON public.user_search_profiles FOR SELECT TO authenticated USING (user_id = auth.uid() OR NOT COALESCE(is_private, false));
CREATE POLICY "Users can insert own search profile" ON public.user_search_profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own search profile" ON public.user_search_profiles FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can view all search profiles" ON public.user_search_profiles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

-- DELETION AUDIT LOG (referenced by admin_physical_delete_user)
CREATE TABLE IF NOT EXISTS public.deletion_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deleted_user_id uuid NOT NULL,
  deleted_user_email text,
  deleted_user_name text,
  reason text NOT NULL DEFAULT '',
  deleted_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.deletion_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage deletion audit" ON public.deletion_audit_log FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));

-- get_search_profile_contacts (from migration 20260322085129)
CREATE OR REPLACE FUNCTION public.get_search_profile_contacts(_user_ids uuid[])
RETURNS TABLE(user_id uuid, display_name text, phone text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.user_id, p.display_name, p.phone
  FROM public.profiles p
  WHERE p.user_id = ANY(_user_ids)
    AND EXISTS (
      SELECT 1 FROM public.user_search_profiles usp
      WHERE usp.user_id = p.user_id
        AND (usp.is_private IS NULL OR usp.is_private = false)
    );
$$;
