-- 1. Agregar website_url a organizations
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS website_url text DEFAULT NULL;

-- 2. Crear tabla external_agencies
CREATE TABLE IF NOT EXISTS public.external_agencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  website_url text NOT NULL DEFAULT '',
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.external_agencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can read external_agencies"
  ON public.external_agencies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage external_agencies"
  ON public.external_agencies FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3. Crear tabla user_agency_favorites
CREATE TABLE IF NOT EXISTS public.user_agency_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  agency_id uuid NOT NULL,
  agency_type text NOT NULL CHECK (agency_type IN ('organization', 'external')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, agency_id, agency_type)
);

ALTER TABLE public.user_agency_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites"
  ON public.user_agency_favorites FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own favorites"
  ON public.user_agency_favorites FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own favorites"
  ON public.user_agency_favorites FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- 4. Agregar configuración MAX_AGENCY_FAVORITES
INSERT INTO public.system_config (key, value)
VALUES ('MAX_AGENCY_FAVORITES', '20')
ON CONFLICT (key) DO NOTHING;