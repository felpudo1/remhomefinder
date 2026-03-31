-- Migración para inicializar la configuración del "Match Score"
-- Se usa la tabla system_config que ya existe y es accedida por useSystemConfig

INSERT INTO public.system_config (key, value)
VALUES (
    'match_score_weights',
    '{"operation_weight": 30, "budget_weight": 40, "neighborhood_weight": 20, "rooms_weight": 10}'
)
ON CONFLICT (key) DO UPDATE 
SET 
    value = EXCLUDED.value;
