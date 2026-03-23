-- =============================================================
-- Triggers de sincronización geográfica + índices de performance
-- =============================================================

-- 1. Función: Sincroniza campos TEXTO desde IDs (department_id → department, etc.)
CREATE OR REPLACE FUNCTION public.sync_property_location_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.department_id IS NOT NULL AND (
    TG_OP = 'INSERT' OR NEW.department_id IS DISTINCT FROM OLD.department_id
  ) THEN
    SELECT name INTO NEW.department
    FROM public.departments
    WHERE id = NEW.department_id;
  END IF;

  IF NEW.city_id IS NOT NULL AND (
    TG_OP = 'INSERT' OR NEW.city_id IS DISTINCT FROM OLD.city_id
  ) THEN
    SELECT name INTO NEW.city
    FROM public.cities
    WHERE id = NEW.city_id;
  END IF;

  IF NEW.neighborhood_id IS NOT NULL AND (
    TG_OP = 'INSERT' OR NEW.neighborhood_id IS DISTINCT FROM OLD.neighborhood_id
  ) THEN
    SELECT name INTO NEW.neighborhood
    FROM public.neighborhoods
    WHERE id = NEW.neighborhood_id;
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Función: Resuelve IDs desde campos TEXTO (department → department_id, etc.)
CREATE OR REPLACE FUNCTION public.resolve_property_location_ids()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_dept_id uuid;
  v_city_id uuid;
  v_neigh_id uuid;
BEGIN
  IF NEW.department_id IS NULL AND COALESCE(NEW.department, '') <> '' THEN
    SELECT id INTO v_dept_id
    FROM public.departments
    WHERE LOWER(name) = LOWER(NEW.department)
      AND country = 'UY'
    LIMIT 1;
    IF v_dept_id IS NOT NULL THEN
      NEW.department_id := v_dept_id;
    END IF;
  END IF;

  IF NEW.city_id IS NULL AND COALESCE(NEW.city, '') <> '' AND NEW.department_id IS NOT NULL THEN
    SELECT id INTO v_city_id
    FROM public.cities
    WHERE LOWER(name) = LOWER(NEW.city)
      AND department_id = NEW.department_id
    LIMIT 1;
    IF v_city_id IS NOT NULL THEN
      NEW.city_id := v_city_id;
    END IF;
  END IF;

  IF NEW.neighborhood_id IS NULL AND COALESCE(NEW.neighborhood, '') <> '' AND NEW.city_id IS NOT NULL THEN
    SELECT id INTO v_neigh_id
    FROM public.neighborhoods
    WHERE LOWER(name) = LOWER(NEW.neighborhood)
      AND city_id = NEW.city_id
    LIMIT 1;
    IF v_neigh_id IS NOT NULL THEN
      NEW.neighborhood_id := v_neigh_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Triggers (resolve primero, sync después — orden alfabético garantiza prioridad)
CREATE TRIGGER trg_resolve_property_location_ids
  BEFORE INSERT OR UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.resolve_property_location_ids();

CREATE TRIGGER trg_sync_property_location
  BEFORE INSERT OR UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_property_location_fields();

-- 4. Índices de performance
CREATE INDEX IF NOT EXISTS idx_cities_lower_name ON public.cities (LOWER(name));
CREATE INDEX IF NOT EXISTS idx_neighborhoods_lower_name ON public.neighborhoods (LOWER(name));
CREATE INDEX IF NOT EXISTS idx_cities_department_id ON public.cities (department_id);
CREATE INDEX IF NOT EXISTS idx_neighborhoods_city_id ON public.neighborhoods (city_id);
CREATE INDEX IF NOT EXISTS idx_properties_department_id ON public.properties (department_id);
CREATE INDEX IF NOT EXISTS idx_properties_city_id ON public.properties (city_id);
CREATE INDEX IF NOT EXISTS idx_properties_neighborhood_id ON public.properties (neighborhood_id);