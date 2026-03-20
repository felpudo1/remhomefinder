-- Configuración: cada cuántos avisos guardados en marketplace se muestra
-- nuevamente el modal de tip de contacto (la primera guardada se muestra siempre).
INSERT INTO public.system_config (key, value)
VALUES ('marketplace_contact_tip_interval', '3')
ON CONFLICT (key) DO NOTHING;
