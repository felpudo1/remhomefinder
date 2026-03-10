-- Script SQL para agregar teléfono de soporte en system_config
-- Ejecutar en el SQL Editor de Supabase

INSERT INTO system_config (key, value)
VALUES ('support_phone', '+54 9 11 1234 5678') -- Reemplazar con el número real
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
