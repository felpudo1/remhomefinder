-- Agregar columna is_opportunity a properties
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS is_opportunity boolean NOT NULL DEFAULT false;

-- Índice parcial para filtrar oportunidades rápidamente
CREATE INDEX IF NOT EXISTS idx_properties_is_opportunity
ON public.properties (created_at DESC)
WHERE is_opportunity = true;