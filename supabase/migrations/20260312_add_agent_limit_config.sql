-- Script para agregar el límite de publicaciones de agentes
-- Este script inserta la configuración si no existe
INSERT INTO public.system_config (key, value)
VALUES ('agent_free_plan_publish_limit', '3')
ON CONFLICT (key) DO NOTHING;
