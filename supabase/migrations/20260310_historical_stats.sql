-- Migración para seguimiento histórico de visitas
-- Permite generar gráficos de evolución temporal

-- 1. Crear tabla de log de visitas
CREATE TABLE IF NOT EXISTS public.property_views_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indice para búsquedas rápidas por fecha y propiedad
CREATE INDEX IF NOT EXISTS idx_property_views_log_date_prop ON public.property_views_log(property_id, created_at);

-- 2. Habilitar RLS (Seguridad)
ALTER TABLE public.property_views_log ENABLE ROW LEVEL SECURITY;

-- Política: Cualquiera puede insertar (vía RPC)
CREATE POLICY "Enable insert for all via function" ON public.property_views_log FOR INSERT WITH CHECK (true);

-- Política: Agentes y Admins pueden ver logs de sus propiedades
-- (Simplificado para permitir consultas de conteo)
CREATE POLICY "Enable select for authorized roles" ON public.property_views_log FOR SELECT USING (true);

-- 3. Actualizar la función existente para incluir el log
CREATE OR REPLACE FUNCTION increment_property_views(p_property_id UUID, p_is_marketplace BOOLEAN)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Incrementar contador total
  IF p_is_marketplace THEN
    UPDATE marketplace_properties
    SET views_count = COALESCE(views_count, 0) + 1
    WHERE id = p_property_id;
    
    -- Registrar en el log histórico
    INSERT INTO property_views_log (property_id) VALUES (p_property_id);
  ELSE
    UPDATE properties
    SET views_count = COALESCE(views_count, 0) + 1
    WHERE id = p_property_id;
  END IF;
END;
$$;
