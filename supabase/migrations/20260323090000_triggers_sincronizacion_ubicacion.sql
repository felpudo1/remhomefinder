-- =============================================
-- Trigger: Sincronización automática de campos texto/ID en properties
-- =============================================
-- Cuando se inserta/actualiza una propiedad:
-- 1. Si se setea department_id → actualiza department con el nombre real
-- 2. Si se setea city_id → actualiza city con el nombre real
-- 3. Si se setea neighborhood_id → actualiza neighborhood con el nombre real
--
-- Esto garantiza consistencia entre campos texto y FKs
-- =============================================

-- =============================================
-- 1. CREAR FUNCIÓN DE SINCRONIZACIÓN
-- =============================================

CREATE OR REPLACE FUNCTION sync_property_location_fields()
RETURNS TRIGGER AS $$
DECLARE
  v_department_name TEXT;
  v_city_name TEXT;
  v_neighborhood_name TEXT;
BEGIN
  -- =============================================
  -- Sincronizar department (texto) desde department_id (FK)
  -- =============================================
  IF NEW.department_id IS NOT NULL THEN
    SELECT name INTO v_department_name
    FROM departments
    WHERE id = NEW.department_id;
    
    IF v_department_name IS NOT NULL THEN
      NEW.department := v_department_name;
    END IF;
  END IF;
  
  -- =============================================
  -- Sincronizar city (texto) desde city_id (FK)
  -- =============================================
  IF NEW.city_id IS NOT NULL THEN
    SELECT name INTO v_city_name
    FROM cities
    WHERE id = NEW.city_id;
    
    IF v_city_name IS NOT NULL THEN
      NEW.city := v_city_name;
    END IF;
  END IF;
  
  -- =============================================
  -- Sincronizar neighborhood (texto) desde neighborhood_id (FK)
  -- =============================================
  IF NEW.neighborhood_id IS NOT NULL THEN
    SELECT name INTO v_neighborhood_name
    FROM neighborhoods
    WHERE id = NEW.neighborhood_id;
    
    IF v_neighborhood_name IS NOT NULL THEN
      NEW.neighborhood := v_neighborhood_name;
    END IF;
  END IF;
  
  -- =============================================
  -- RETORNAR NUEVO REGISTRO (con campos actualizados)
  -- =============================================
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 2. CREAR TRIGGER PARA INSERT Y UPDATE
-- =============================================

DROP TRIGGER IF EXISTS trg_sync_property_location ON properties;

CREATE TRIGGER trg_sync_property_location
  BEFORE INSERT OR UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION sync_property_location_fields();

-- =============================================
-- 3. FUNCIÓN ADICIONAL: Sincronización inversa (ID desde texto)
-- =============================================
-- Esta función es útil cuando el scraper guarda solo texto
-- y querés resolver los IDs automáticamente

CREATE OR REPLACE FUNCTION resolve_property_location_ids()
RETURNS TRIGGER AS $$
DECLARE
  v_department_id UUID;
  v_city_id UUID;
  v_neighborhood_id UUID;
BEGIN
  -- =============================================
  -- Resolver department_id desde department (texto)
  -- =============================================
  IF NEW.department IS NOT NULL AND NEW.department_id IS NULL THEN
    SELECT id INTO v_department_id
    FROM departments
    WHERE LOWER(name) = LOWER(NEW.department)
      AND country = 'UY'
    LIMIT 1;
    
    IF v_department_id IS NOT NULL THEN
      NEW.department_id := v_department_id;
    END IF;
  END IF;
  
  -- =============================================
  -- Resolver city_id desde city (texto) + department_id
  -- =============================================
  IF NEW.city IS NOT NULL AND NEW.city_id IS NULL AND NEW.department_id IS NOT NULL THEN
    SELECT id INTO v_city_id
    FROM cities
    WHERE LOWER(name) = LOWER(NEW.city)
      AND department_id = NEW.department_id
    LIMIT 1;
    
    IF v_city_id IS NOT NULL THEN
      NEW.city_id := v_city_id;
    END IF;
  END IF;
  
  -- =============================================
  -- Resolver neighborhood_id desde neighborhood (texto) + city_id
  -- =============================================
  IF NEW.neighborhood IS NOT NULL AND NEW.neighborhood_id IS NULL AND NEW.city_id IS NOT NULL THEN
    SELECT id INTO v_neighborhood_id
    FROM neighborhoods
    WHERE LOWER(name) = LOWER(NEW.neighborhood)
      AND city_id = NEW.city_id
    LIMIT 1;
    
    IF v_neighborhood_id IS NOT NULL THEN
      NEW.neighborhood_id := v_neighborhood_id;
    END IF;
  END IF;
  
  -- =============================================
  -- RETORNAR NUEVO REGISTRO (con IDs resueltos)
  -- =============================================
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 4. CREAR TRIGGER PARA RESOLVER IDs (se ejecuta después del primero)
-- =============================================

DROP TRIGGER IF EXISTS trg_resolve_property_location_ids ON properties;

CREATE TRIGGER trg_resolve_property_location_ids
  BEFORE INSERT OR UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION resolve_property_location_ids();

-- =============================================
-- 5. COMENTARIOS DE DOCUMENTACIÓN
-- =============================================

COMMENT ON FUNCTION sync_property_location_fields() IS
  'Sincroniza campos de texto (department, city, neighborhood) desde sus FKs correspondientes';

COMMENT ON FUNCTION resolve_property_location_ids() IS
  'Resuelve FKs (department_id, city_id, neighborhood_id) desde campos de texto';

COMMENT ON TRIGGER trg_sync_property_location ON properties IS
  'Auto-sincroniza nombres de ubicación cuando se setean los IDs';

COMMENT ON TRIGGER trg_resolve_property_location_ids ON properties IS
  'Auto-resuelve IDs de ubicación cuando se setean los nombres de texto';

-- =============================================
-- 6. SCRIPT DE ACTUALIZACIÓN PARA DATOS EXISTENTES
-- =============================================
-- Este script actualiza todas las propiedades existentes
-- para que tengan los IDs correctos basados en el texto

-- Actualizar department_id desde department
UPDATE properties p
SET department_id = d.id
FROM departments d
WHERE LOWER(p.department) = LOWER(d.name)
  AND d.country = 'UY'
  AND p.department_id IS NULL;

-- Actualizar city_id desde city + department_id
UPDATE properties p
SET city_id = c.id
FROM cities c
WHERE LOWER(p.city) = LOWER(c.name)
  AND p.department_id = c.department_id
  AND p.city_id IS NULL;

-- Actualizar neighborhood_id desde neighborhood + city_id
UPDATE properties p
SET neighborhood_id = n.id
FROM neighborhoods n
WHERE LOWER(p.neighborhood) = LOWER(n.name)
  AND p.city_id = n.city_id
  AND p.neighborhood_id IS NULL;

-- =============================================
-- 7. QUERIES DE VERIFICACIÓN
-- =============================================

-- Ver propiedades con inconsistencia (debería ser 0 después del trigger)
SELECT 
  id,
  department,
  department_id,
  city,
  city_id,
  neighborhood,
  neighborhood_id,
  CASE 
    WHEN department_id IS NOT NULL THEN '✅'
    ELSE '❌'
  END AS dept_status,
  CASE 
    WHEN city_id IS NOT NULL THEN '✅'
    ELSE '❌'
  END AS city_status,
  CASE 
    WHEN neighborhood_id IS NOT NULL THEN '✅'
    ELSE '❌'
  END AS neighborhood_status
FROM properties
WHERE 
  (department_id IS NOT NULL AND department IS DISTINCT FROM (SELECT name FROM departments WHERE id = department_id))
  OR (city_id IS NOT NULL AND city IS DISTINCT FROM (SELECT name FROM cities WHERE id = city_id))
  OR (neighborhood_id IS NOT NULL AND neighborhood IS DISTINCT FROM (SELECT name FROM neighborhoods WHERE id = neighborhood_id))
LIMIT 10;

-- Ver resumen de sincronización
SELECT
  COUNT(*) AS total_properties,
  COUNT(department_id) AS with_department_id,
  COUNT(city_id) AS with_city_id,
  COUNT(neighborhood_id) AS with_neighborhood_id,
  ROUND(100.0 * COUNT(department_id) / NULLIF(COUNT(*), 0), 2) AS pct_department,
  ROUND(100.0 * COUNT(city_id) / NULLIF(COUNT(*), 0), 2) AS pct_city,
  ROUND(100.0 * COUNT(neighborhood_id) / NULLIF(COUNT(*), 0), 2) AS pct_neighborhood
FROM properties;

-- =============================================
-- FIN DEL SCRIPT
-- =============================================
