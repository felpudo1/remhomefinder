-- 1. Agregar columna de Plan a los perfiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS plan_type text DEFAULT 'free' CHECK (plan_type IN ('free', 'premium'));

-- Comentario para el doc del dev del mañana (JP):
-- Esta columna define qué nivel de acceso tiene el usuario. 
-- 'free' es el default, 'premium' habilita el acceso ilimitado.

-- 2. Crear configuración de límite de guardados en system_config
-- Si ya existe la tabla system_config, insertamos el valor por defecto si no está.
INSERT INTO public.system_config (key, value)
VALUES ('free_plan_save_limit', '10')
ON CONFLICT (key) DO NOTHING;

-- Comentario para JP:
-- Esta clave de configuración será leída por la app para validar los límites.
-- Se puede editar desde el Admin Panel (próximo paso) o directamente aquí.
