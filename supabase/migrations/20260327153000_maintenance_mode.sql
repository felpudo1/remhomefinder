
-- 1. Insertar configuración por defecto para el modo mantenimiento
INSERT INTO public.system_config (key, value)
VALUES 
  ('maintenance_mode', 'false'),
  ('maintenance_message', 'Estamos realizando mejoras técnicas en la plataforma. Volvemos en unos minutos.')
ON CONFLICT (key) DO NOTHING;

-- 2. Ajustar RLS para que usuarios anónimos (públicos) puedan leer estas llaves críticas
-- Esto es necesario para bloquear el acceso antes de que el usuario inicie sesión.
DROP POLICY IF EXISTS "Anon can read maintenance config" ON public.system_config;

CREATE POLICY "Anon can read maintenance config" 
ON public.system_config 
FOR SELECT 
TO anon 
USING (key IN ('maintenance_mode', 'maintenance_message', 'show_auth_video'));
