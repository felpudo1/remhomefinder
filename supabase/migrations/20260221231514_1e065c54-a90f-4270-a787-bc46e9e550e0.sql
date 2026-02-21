-- Agregar restricción UNIQUE a la columna url de properties
-- Solo aplica a URLs no vacías para permitir múltiples propiedades sin URL
CREATE UNIQUE INDEX idx_properties_unique_url ON public.properties (url) WHERE url != '';