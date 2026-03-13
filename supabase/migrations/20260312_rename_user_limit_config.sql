-- Script para renombrar la clave de configuración de guardado de usuarios
-- IMPORTANTE: Ejecutar esto en el SQL Editor de Supabase
UPDATE public.system_config 
SET key = 'user_free_plan_save_limit' 
WHERE key = 'free_plan_save_limit';

-- Verificación opcional
-- SELECT * FROM public.system_config WHERE key = 'user_free_plan_save_limit';
