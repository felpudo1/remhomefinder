-- CREACIÓN DE LA TABLA DE PERFILES DE DOMINIO PARA SCRAPING INTELIGENTE
CREATE TABLE IF NOT EXISTS public.scraping_domain_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain TEXT UNIQUE NOT NULL, -- Ej: 'acsa.com.uy'
    discovery_config JSONB DEFAULT '{
        "minUrlLength": 30,
        "excludeExtensions": [".pdf", ".jpg", ".png", ".jpeg", ".docx"],
        "blockBrokenEnds": true
    }'::jsonb,
    extraction_config JSONB DEFAULT '{}'::jsonb,
    custom_instructions TEXT, -- 'El Santo Grial': Instrucciones específicas para la IA
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.scraping_domain_profiles ENABLE ROW LEVEL SECURITY;

-- Política de lectura para usuarios autenticados (Sistema necesita leer esto)
CREATE POLICY "Permitir lectura a autenticados" 
ON public.scraping_domain_profiles FOR SELECT 
TO authenticated 
USING (true);

-- Política de gestión SOLO para administradores (vía service_role o similar si fuera necesario en UI)
-- Por ahora se gestiona vía Dashboard/SQL Editor

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_scraping_domain_profiles_modtime
    BEFORE UPDATE ON public.scraping_domain_profiles
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- INSERTAR EL PRIMER PERFIL: ACSA (Opcional pero recomendado para pruebas)
-- INSERT INTO public.scraping_domain_profiles (domain, discovery_config, custom_instructions)
-- VALUES ('www.acsa.com.uy', '{"minUrlLength": 45, "excludeExtensions": [".pdf", ".jpg", ".png", ".zip"], "blockBrokenEnds": true}', 'En esta web los precios suelen estar en un span con clase .price-tag. Si ves que dice "Señalada", marcá la disponibilidad como false.');
