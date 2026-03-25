-- =============================================================
-- Migration: Production hardening — Storage, columns, RPC, trigger
-- =============================================================

-- 1) PROFILES: add approved_at column
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS approved_at timestamptz DEFAULT NULL;

-- 2) ORGANIZATIONS: add logo_url column
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS logo_url text DEFAULT '' NOT NULL;

-- 3) approved_at: la migración 20260325120000_profiles_approved_at.sql define
--    trg_profiles_set_approved_at (INSERT + UPDATE). No duplicar set_approved_at aquí.

-- 4) RPC: update_organization_logo_url
CREATE OR REPLACE FUNCTION public.update_organization_logo_url(
  _org_id uuid,
  _logo_url text
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
BEGIN
  IF NOT is_org_member(auth.uid(), _org_id) THEN
    RAISE EXCEPTION 'Unauthorized: not a member of this organization';
  END IF;
  UPDATE public.organizations
  SET logo_url = _logo_url, updated_at = now()
  WHERE id = _org_id;
END;
$$;

-- 5) agency-logos: bucket + policies viven en 20260325103000_org_logo_url_and_agency_logos_bucket.sql
--    (evita duplicar políticas con nombres distintos en dos migraciones).

-- 6) STORAGE: harden avatars bucket (5 MB, images only)
UPDATE storage.buckets
SET file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/gif']
WHERE id = 'avatars';

-- 7) STORAGE POLICIES: Harden avatars (path-based uid folder)
DROP POLICY IF EXISTS "Users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public avatar read access" ON storage.objects;

CREATE POLICY "avatar_insert_own_folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatar_update_own_folder"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatar_delete_own_folder"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatar_public_read"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'avatars');

-- 8) STORAGE POLICIES: agency-logos → migración 20260325103000

-- 9) STORAGE POLICIES: harden property-images INSERT (uid folder)
DROP POLICY IF EXISTS "Authenticated users can upload property images" ON storage.objects;

CREATE POLICY "property_images_insert_own_folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'property-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
