-- Migración para el sistema de referidos de agentes
-- Permite vincular un usuario (comprador) con un agente mediante un link de invitación.

-- 1. Agregar la columna referred_by_agent_id a la tabla profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS referred_by_agent_id UUID REFERENCES auth.users(id);

-- 2. Crear un índice para optimizar las consultas del marketplace filtradas por agente referido
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by_agent ON public.profiles(referred_by_agent_id);

-- COMENTARIO: Esta relación permitirá que en el Marketplace podamos priorizar 
-- las propiedades donde el created_by coincida con el referred_by_agent_id del usuario actual.
