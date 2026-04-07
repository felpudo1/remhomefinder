-- Configuración global de extensiones prohibidas para el scraper
INSERT INTO public.app_settings (key, value, description)
VALUES (
  'scraper_forbidden_extensions', 
  '.pdf, .jpg, .png, .jpeg, .docx, .xml', 
  'Extensiones que el sistema ignorará globalmente durante el descubrimiento de links (separadas por coma)'
)
ON CONFLICT (key) DO UPDATE 
SET value = EXCLUDED.value;

-- Asegurar que los agentes puedan leer esta configuración (opcional si se usa solo en Edge Functions)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'app_settings' AND policyname = 'Auth users can read app_settings'
  ) THEN
    CREATE POLICY "Auth users can read app_settings" ON public.app_settings
      FOR SELECT TO authenticated USING (true);
  END IF;
END $$;
