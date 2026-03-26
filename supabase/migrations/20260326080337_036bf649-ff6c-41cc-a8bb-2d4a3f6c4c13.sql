-- =============================================================================
-- FASE 2: Índices de rendimiento para eliminar sequential scans
-- =============================================================================

-- Índices de Geografía (selectores cascadeados)
CREATE INDEX IF NOT EXISTS idx_neighborhoods_city_id ON public.neighborhoods(city_id);
CREATE INDEX IF NOT EXISTS idx_neighborhoods_name ON public.neighborhoods(name);
CREATE INDEX IF NOT EXISTS idx_cities_department_id ON public.cities(department_id);
CREATE INDEX IF NOT EXISTS idx_cities_name ON public.cities(name);
CREATE INDEX IF NOT EXISTS idx_departments_name ON public.departments(name);

-- Índice de Duplicados (detección rápida por source_url)
CREATE INDEX IF NOT EXISTS idx_properties_source_url ON public.properties(source_url);

-- Índices de Dashboard y Roles (JOINs frecuentes)
CREATE INDEX IF NOT EXISTS idx_user_listings_property_id ON public.user_listings(property_id);
CREATE INDEX IF NOT EXISTS idx_user_listings_added_by ON public.user_listings(added_by);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

-- Extensión de búsqueda difusa + índice GIN trigram
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_neighborhoods_name_trgm ON public.neighborhoods USING gin (name gin_trgm_ops);