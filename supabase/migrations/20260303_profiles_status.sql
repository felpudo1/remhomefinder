-- ============================================================
-- MIGRACIÓN: Centralizar status de usuario en tabla `profiles`
-- Autor: Gallo Claudio 🐓 / RemHomeFinder
-- Fecha: 2026-03-03
-- ============================================================
-- DESCRIPCIÓN:
--   1. Agrega columna `status` a `profiles` usando el ENUM `agency_status`
--      (pending | approved | rejected | suspended)
--   2. Inicializa status en 'approved' para todos los usuarios existentes
--   3. Migra el status actual de la tabla `agencies` al `profile` del agente
--   4. Elimina la columna `status` de la tabla `agencies`
-- ============================================================

BEGIN;

-- ── PASO 1: Agregar columna status a profiles ──────────────────
-- Usamos el ENUM agency_status que ya existe para mantener consistencia.
-- Default 'approved' para no romper usuarios existentes.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS status agency_status NOT NULL DEFAULT 'approved';

-- ── PASO 2: Migrar status de agencias a su perfil correspondiente ──
-- Busca el profile del creador de cada agencia y copia el status.
UPDATE profiles p
SET status = a.status
FROM agencies a
WHERE a.created_by = p.user_id
  AND a.status IS NOT NULL;

-- ── PASO 3: RLS - Permitir al admin actualizar profiles.status ──
-- (Si ya existe política de admin, este bloque no rompe nada)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Admin puede actualizar status de profiles'
  ) THEN
    CREATE POLICY "Admin puede actualizar status de profiles"
      ON profiles FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM user_roles
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      );
  END IF;
END $$;

-- ── PASO 4: Eliminar columna status de agencies ────────────────
-- IMPORTANTE: Solo ejecutar esto cuando el front ya esté actualizado
-- para leer de profiles.status en lugar de agencies.status.
-- Por seguridad lo dejamos comentado — descomentarlo en el segundo deploy.

-- ALTER TABLE agencies DROP COLUMN IF EXISTS status;

COMMIT;

-- ============================================================
-- VERIFICACIÓN (ejecutar después de la migración)
-- ============================================================
-- Ver usuarios con su status:
-- SELECT p.user_id, p.status, ur.role 
-- FROM profiles p
-- JOIN user_roles ur ON ur.user_id = p.user_id
-- ORDER BY p.status, ur.role;

-- Ver agentes migrados:
-- SELECT p.user_id, p.status as profile_status, a.name, a.status as agency_status
-- FROM profiles p
-- JOIN agencies a ON a.created_by = p.user_id;
-- ============================================================
