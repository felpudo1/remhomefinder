
-- =============================================
-- GEOGRAPHY: departments + links
-- =============================================

-- departments table
CREATE TABLE IF NOT EXISTS public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  country text NOT NULL DEFAULT 'UY',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_departments_country_name ON public.departments (country, LOWER(name));
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read departments" ON public.departments FOR SELECT TO public USING (true);
CREATE POLICY "Admins can manage departments" ON public.departments FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- department_id on cities
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL;

-- department fields on properties
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS department text NOT NULL DEFAULT '';
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL;

-- Admin policies for cities and neighborhoods
CREATE POLICY "Admins can manage cities" ON public.cities FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage neighborhoods" ON public.neighborhoods FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Seed 19 departamentos Uruguay
INSERT INTO public.departments (name, country) VALUES
  ('Artigas', 'UY'), ('Canelones', 'UY'), ('Cerro Largo', 'UY'), ('Colonia', 'UY'),
  ('Durazno', 'UY'), ('Flores', 'UY'), ('Florida', 'UY'), ('Lavalleja', 'UY'),
  ('Maldonado', 'UY'), ('Montevideo', 'UY'), ('Paysandú', 'UY'), ('Río Negro', 'UY'),
  ('Rivera', 'UY'), ('Rocha', 'UY'), ('Salto', 'UY'), ('San José', 'UY'),
  ('Soriano', 'UY'), ('Tacuarembó', 'UY'), ('Treinta y Tres', 'UY')
ON CONFLICT DO NOTHING;

-- Seed 24 provincias Argentina
INSERT INTO public.departments (name, country) VALUES
  ('Buenos Aires', 'AR'), ('CABA', 'AR'), ('Catamarca', 'AR'), ('Chaco', 'AR'),
  ('Chubut', 'AR'), ('Córdoba', 'AR'), ('Corrientes', 'AR'), ('Entre Ríos', 'AR'),
  ('Formosa', 'AR'), ('Jujuy', 'AR'), ('La Pampa', 'AR'), ('La Rioja', 'AR'),
  ('Mendoza', 'AR'), ('Misiones', 'AR'), ('Neuquén', 'AR'), ('Río Negro', 'AR'),
  ('Salta', 'AR'), ('San Juan', 'AR'), ('San Luis', 'AR'), ('Santa Cruz', 'AR'),
  ('Santa Fe', 'AR'), ('Santiago del Estero', 'AR'), ('Tierra del Fuego', 'AR'), ('Tucumán', 'AR')
ON CONFLICT DO NOTHING;

-- Geography sync triggers
CREATE OR REPLACE FUNCTION public.sync_property_location_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
  IF NEW.department_id IS NOT NULL AND (TG_OP = 'INSERT' OR NEW.department_id IS DISTINCT FROM OLD.department_id) THEN
    SELECT name INTO NEW.department FROM public.departments WHERE id = NEW.department_id;
  END IF;
  IF NEW.city_id IS NOT NULL AND (TG_OP = 'INSERT' OR NEW.city_id IS DISTINCT FROM OLD.city_id) THEN
    SELECT name INTO NEW.city FROM public.cities WHERE id = NEW.city_id;
  END IF;
  IF NEW.neighborhood_id IS NOT NULL AND (TG_OP = 'INSERT' OR NEW.neighborhood_id IS DISTINCT FROM OLD.neighborhood_id) THEN
    SELECT name INTO NEW.neighborhood FROM public.neighborhoods WHERE id = NEW.neighborhood_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.resolve_property_location_ids()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v_dept_id uuid; v_city_id uuid; v_neigh_id uuid;
BEGIN
  IF NEW.department_id IS NULL AND COALESCE(NEW.department, '') <> '' THEN
    SELECT id INTO v_dept_id FROM public.departments WHERE LOWER(name) = LOWER(NEW.department) AND country = 'UY' LIMIT 1;
    IF v_dept_id IS NOT NULL THEN NEW.department_id := v_dept_id; END IF;
  END IF;
  IF NEW.city_id IS NULL AND COALESCE(NEW.city, '') <> '' AND NEW.department_id IS NOT NULL THEN
    SELECT id INTO v_city_id FROM public.cities WHERE LOWER(name) = LOWER(NEW.city) AND department_id = NEW.department_id LIMIT 1;
    IF v_city_id IS NOT NULL THEN NEW.city_id := v_city_id; END IF;
  END IF;
  IF NEW.neighborhood_id IS NULL AND COALESCE(NEW.neighborhood, '') <> '' AND NEW.city_id IS NOT NULL THEN
    SELECT id INTO v_neigh_id FROM public.neighborhoods WHERE LOWER(name) = LOWER(NEW.neighborhood) AND city_id = NEW.city_id LIMIT 1;
    IF v_neigh_id IS NOT NULL THEN NEW.neighborhood_id := v_neigh_id; END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_resolve_property_location_ids ON public.properties;
DROP TRIGGER IF EXISTS trg_sync_property_location ON public.properties;

CREATE TRIGGER trg_resolve_property_location_ids BEFORE INSERT OR UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION public.resolve_property_location_ids();
CREATE TRIGGER trg_sync_property_location BEFORE INSERT OR UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION public.sync_property_location_fields();

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_cities_lower_name ON public.cities (LOWER(name));
CREATE INDEX IF NOT EXISTS idx_neighborhoods_lower_name ON public.neighborhoods (LOWER(name));
CREATE INDEX IF NOT EXISTS idx_cities_department_id ON public.cities (department_id);
CREATE INDEX IF NOT EXISTS idx_neighborhoods_city_id ON public.neighborhoods (city_id);
CREATE INDEX IF NOT EXISTS idx_properties_department_id ON public.properties (department_id);
CREATE INDEX IF NOT EXISTS idx_properties_city_id ON public.properties (city_id);
CREATE INDEX IF NOT EXISTS idx_properties_neighborhood_id ON public.properties (neighborhood_id);

-- Contact fields on user_listings
ALTER TABLE public.user_listings
  ADD COLUMN IF NOT EXISTS contact_name text,
  ADD COLUMN IF NOT EXISTS contact_phone text,
  ADD COLUMN IF NOT EXISTS contact_source text;
