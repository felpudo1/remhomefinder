-- ============================================================
-- 0. CORRECCIÓN DE CLAVES FORÁNEAS (Para permitir borrado físico)
-- ============================================================
-- Algunas tablas referencian a auth.users sin ON DELETE CASCADE,
-- lo que bloquea el borrado. Aquí las corregimos.

DO $$
BEGIN
  -- Corregir Referidos (referred_by_agent_id)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'referred_by_agent_id') THEN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_referred_by_agent_id_fkey') THEN
      ALTER TABLE public.profiles DROP CONSTRAINT profiles_referred_by_agent_id_fkey;
    END IF;
    ALTER TABLE public.profiles 
      ADD CONSTRAINT profiles_referred_by_agent_id_fkey 
      FOREIGN KEY (referred_by_agent_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  -- Corregir Referidos (referred_by_id)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'referred_by_id') THEN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_referred_by_id_fkey') THEN
      ALTER TABLE public.profiles DROP CONSTRAINT profiles_referred_by_id_fkey;
    END IF;
    ALTER TABLE public.profiles 
      ADD CONSTRAINT profiles_referred_by_id_fkey 
      FOREIGN KEY (referred_by_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  -- Corregir app_settings
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'app_settings' AND column_name = 'updated_by') THEN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'app_settings_updated_by_fkey') THEN
      ALTER TABLE public.app_settings DROP CONSTRAINT app_settings_updated_by_fkey;
    END IF;
    ALTER TABLE public.app_settings 
      ADD CONSTRAINT app_settings_updated_by_fkey 
      FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  -- Corregir groups.created_by
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'groups_created_by_fkey') THEN
    ALTER TABLE public.groups DROP CONSTRAINT groups_created_by_fkey;
  END IF;
  ALTER TABLE public.groups 
    ADD CONSTRAINT groups_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;

  -- Corregir group_members.user_id
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'group_members_user_id_fkey') THEN
    ALTER TABLE public.group_members DROP CONSTRAINT group_members_user_id_fkey;
  END IF;
  ALTER TABLE public.group_members 
    ADD CONSTRAINT group_members_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

  -- Corregir property_ratings.user_id
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'property_ratings_user_id_fkey') THEN
    ALTER TABLE public.property_ratings DROP CONSTRAINT property_ratings_user_id_fkey;
  END IF;
  ALTER TABLE public.property_ratings 
    ADD CONSTRAINT property_ratings_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
END $$;

-- ============================================================
-- 1. FUNCIÓN DE BORRADO FÍSICO (Actualizada)
-- ============================================================

CREATE OR REPLACE FUNCTION public.admin_physical_delete_user(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  caller_is_admin boolean;
BEGIN
  -- 1. Verificar si el llamador es admin usando la función estándar del proyecto
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Solo los administradores pueden realizar borrados físicos.';
  END IF;

  -- 2. No permitir borrarse a sí mismo
  IF _user_id = auth.uid() THEN
    RAISE EXCEPTION 'No podés borrar tu propia cuenta de administrador.';
  END IF;

  -- 3. Borrado en auth.users (el motor de Supabase maneja la cascada si las FK están así configuradas)
  -- Nota: Si hay políticas de RLS restrictivas, SECURITY DEFINER las salta para auth.users
  DELETE FROM auth.users WHERE id = _user_id;

  -- Opcional: Log de auditoría si existiera tabla de logs
END;
$$;

-- La función admin_delete_all_users fue eliminada a pedido de JP.
