
-- 1. Insertar parámetros para auto-protección del sistema
INSERT INTO public.system_config (key, value)
VALUES 
  ('auto_maintenance_protection', 'false'),
  ('maintenance_threshold', '85')
ON CONFLICT (key) DO NOTHING;

-- 2. Asegurar que estas llaves sean legibles por usuarios anónimos (públicos)
-- para que el escudo pueda reaccionar incluso sin sesión iniciada.
DROP POLICY IF EXISTS "Anon can read maintenance config" ON public.system_config;

CREATE POLICY "Anon can read maintenance config" 
ON public.system_config 
FOR SELECT 
TO anon 
USING (key IN ('maintenance_mode', 'maintenance_message', 'show_auth_video', 'auto_maintenance_protection', 'maintenance_threshold'));
