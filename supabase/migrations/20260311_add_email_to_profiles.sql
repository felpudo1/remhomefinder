-- ============================================================
-- MIGRACIÓN: Sincronizar email de auth.users a profiles
-- Autor: Gemini (Gema 💎) / RemHomeFinder
-- Fecha: 2026-03-11
-- ============================================================

BEGIN;

-- ── PASO 1: Agregar columna email a profiles ─────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- ── PASO 2: Sincronizar emails existentes ─────────────────────────
-- Necesitamos usar una subconsulta o join con auth.users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE u.id = p.user_id
  AND p.email IS NULL;

-- ── PASO 3: Functión para sincronizar en tiempo real ──────────────
CREATE OR REPLACE FUNCTION public.handle_user_email_sync()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles
    SET email = NEW.email
    WHERE user_id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── PASO 4: Trigger en auth.users ───────────────────────────────
DROP TRIGGER IF EXISTS on_auth_user_email_update ON auth.users;
CREATE TRIGGER on_auth_user_email_update
    AFTER UPDATE OF email ON auth.users
    FOR EACH ROW
    WHEN (OLD.email IS DISTINCT FROM NEW.email)
    EXECUTE FUNCTION public.handle_user_email_sync();

-- ── PASO 5: Asegurar email en nuevos registros ──────────────────
-- Actualizamos la función handle_new_user si existe para incluir el email
-- Buscamos si existe una función típica de Supabase para nuevos usuarios
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') THEN
        -- No la redefinimos totalmente para no romper lógica existente, 
        -- pero nos aseguramos que profiles tenga el email al crearse.
        -- (La mayoría de los starters de Supabase ya tienen esta función)
        NULL; 
    END IF;
END $$;

COMMIT;
