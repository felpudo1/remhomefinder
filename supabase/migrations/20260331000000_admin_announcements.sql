-- ============================================================================
-- Migración: Sistema de Anuncios/Novedades del Admin
-- Crea las tablas announcements y announcement_reads con RLS estricta.
-- Incluye RPC optimizada que filtra en BD (LEFT JOIN) sin filtrar en frontend.
-- ============================================================================

-- 1. Crear enum de audiencia para tipo seguro
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'announcement_audience') THEN
    CREATE TYPE public.announcement_audience AS ENUM ('all', 'agents', 'users', 'specific');
  END IF;
END$$;

-- 2. Crear enum de prioridad
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'announcement_priority') THEN
    CREATE TYPE public.announcement_priority AS ENUM ('normal', 'urgent');
  END IF;
END$$;

-- 3. Tabla principal: announcements
-- Almacena cada mensaje/novedad creado por el admin.
CREATE TABLE IF NOT EXISTS public.announcements (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  body        text NOT NULL,
  image_url   text DEFAULT '',
  audience    public.announcement_audience NOT NULL DEFAULT 'all',
  target_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active   boolean NOT NULL DEFAULT true,
  priority    public.announcement_priority NOT NULL DEFAULT 'normal',
  created_by  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz
);

-- Índice para queries frecuentes: activos + no expirados, ordenados por fecha
CREATE INDEX IF NOT EXISTS idx_announcements_active_date
  ON public.announcements (is_active, created_at DESC)
  WHERE is_active = true;

-- 4. Tabla de tracking: announcement_reads
-- Registra qué usuario leyó/dismisseó cada anuncio.
CREATE TABLE IF NOT EXISTS public.announcement_reads (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id uuid NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dismissed_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (announcement_id, user_id)
);

-- Índice para búsquedas rápidas por usuario (LEFT JOIN en la RPC)
CREATE INDEX IF NOT EXISTS idx_announcement_reads_user
  ON public.announcement_reads (user_id, announcement_id);

-- ============================================================================
-- 5. RLS (Row Level Security) — SEGURIDAD ESTRICTA
-- ============================================================================

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;

-- announcements: SELECT para cualquier usuario autenticado
CREATE POLICY "announcements_select_authenticated"
  ON public.announcements FOR SELECT
  TO authenticated
  USING (true);

-- announcements: INSERT solo para admins
CREATE POLICY "announcements_insert_admin"
  ON public.announcements FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- announcements: UPDATE solo para admins
CREATE POLICY "announcements_update_admin"
  ON public.announcements FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- announcements: DELETE solo para admins
CREATE POLICY "announcements_delete_admin"
  ON public.announcements FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- announcement_reads: SELECT solo los propios reads del usuario
CREATE POLICY "reads_select_own"
  ON public.announcement_reads FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- announcement_reads: INSERT solo para el propio usuario
CREATE POLICY "reads_insert_own"
  ON public.announcement_reads FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- announcement_reads: DELETE para admins (limpiar reads si quieren re-mostrar un anuncio)
CREATE POLICY "reads_delete_admin"
  ON public.announcement_reads FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- 6. RPC: get_pending_announcements
-- Query OPTIMIZADA con LEFT JOIN para excluir reads en la BD, no en frontend.
-- Filtra por: is_active, no expirado, no leído, audiencia correcta.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_pending_announcements(
  p_user_id    uuid,
  p_user_roles text[]
)
RETURNS TABLE (
  id             uuid,
  title          text,
  body           text,
  image_url      text,
  audience       public.announcement_audience,
  priority       public.announcement_priority,
  created_at     timestamptz,
  created_by     uuid,
  expires_at     timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    a.id,
    a.title,
    a.body,
    a.image_url,
    a.audience,
    a.priority,
    a.created_at,
    a.created_by,
    a.expires_at
  FROM public.announcements a
  LEFT JOIN public.announcement_reads r
    ON r.announcement_id = a.id
    AND r.user_id = p_user_id
  WHERE
    -- Solo activos
    a.is_active = true
    -- No expirados (NULL = sin expiración = siempre válido)
    AND (a.expires_at IS NULL OR a.expires_at > now())
    -- No leídos por este usuario (LEFT JOIN + IS NULL)
    AND r.id IS NULL
    -- Filtro de audiencia:
    AND (
      a.audience = 'all'
      OR (a.audience = 'agents'   AND ('agency' = ANY(p_user_roles) OR 'agencymember' = ANY(p_user_roles)))
      OR (a.audience = 'users'    AND 'user' = ANY(p_user_roles) AND NOT ('agency' = ANY(p_user_roles)) AND NOT ('agencymember' = ANY(p_user_roles)))
      OR (a.audience = 'specific' AND a.target_user_id = p_user_id)
    )
  ORDER BY
    -- Urgentes primero, luego por fecha más reciente
    CASE WHEN a.priority = 'urgent' THEN 0 ELSE 1 END,
    a.created_at DESC;
$$;

-- ============================================================================
-- 7. RPC: get_all_announcements (para el panel admin — incluye reads count)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_all_announcements()
RETURNS TABLE (
  id             uuid,
  title          text,
  body           text,
  image_url      text,
  audience       public.announcement_audience,
  target_user_id uuid,
  is_active      boolean,
  priority       public.announcement_priority,
  created_by     uuid,
  created_at     timestamptz,
  expires_at     timestamptz,
  reads_count    bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    a.id,
    a.title,
    a.body,
    a.image_url,
    a.audience,
    a.target_user_id,
    a.is_active,
    a.priority,
    a.created_by,
    a.created_at,
    a.expires_at,
    COALESCE(rc.cnt, 0) AS reads_count
  FROM public.announcements a
  LEFT JOIN (
    SELECT announcement_id, COUNT(*) AS cnt
    FROM public.announcement_reads
    GROUP BY announcement_id
  ) rc ON rc.announcement_id = a.id
  ORDER BY a.created_at DESC;
$$;

-- ============================================================================
-- 8. RPC: get_user_announcement_history
-- Devuelve TODOS los anuncios que el usuario ya leyó (historial)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_user_announcement_history(p_user_id uuid)
RETURNS TABLE (
  id             uuid,
  title          text,
  body           text,
  image_url      text,
  audience       public.announcement_audience,
  priority       public.announcement_priority,
  created_at     timestamptz,
  dismissed_at   timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    a.id,
    a.title,
    a.body,
    a.image_url,
    a.audience,
    a.priority,
    a.created_at,
    r.dismissed_at
  FROM public.announcement_reads r
  INNER JOIN public.announcements a ON a.id = r.announcement_id
  WHERE r.user_id = p_user_id
  ORDER BY r.dismissed_at DESC;
$$;
