-- 1. Añadir la columna views_count a las propiedades del marketplace
ALTER TABLE marketplace_properties 
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

-- 2. Añadir la columna views_count a las propiedades copiadas por los usuarios (si queremos medir vistas privadas también)
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

-- 3. Crear la función RPC segura para incrementar las vistas
-- Parámetros: 
-- p_property_id (UUID): El ID de la propiedad que se está viendo
-- p_is_marketplace (BOOLEAN): True si es una propiedad del marketplace, False si es una copia guardada de un usuario
CREATE OR REPLACE FUNCTION increment_property_views(p_property_id UUID, p_is_marketplace BOOLEAN)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Permite que cualquier usuario (incluso anónimos o logueados) incremente el contador saltando las reglas de RLS base
AS $$
BEGIN
  IF p_is_marketplace THEN
    UPDATE marketplace_properties
    SET views_count = COALESCE(views_count, 0) + 1
    WHERE id = p_property_id;
  ELSE
    UPDATE properties
    SET views_count = COALESCE(views_count, 0) + 1
    WHERE id = p_property_id;
  END IF;
END;
$$;
