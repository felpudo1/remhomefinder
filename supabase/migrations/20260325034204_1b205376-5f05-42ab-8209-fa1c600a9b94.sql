-- =============================================================
-- Migration: Production hardening — Storage, columns, RPC, trigger
-- =============================================================

-- 1) PROFILES: add approved_at column
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS approved_at timestamptz DEFAULT NULL;

-- 2) ORGANIZATIONS: add logo_url column
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS logo_url text DEFAULT '' NOT NULL;

-- 3) Trigger: auto-set approved_at when status → active
CREATE OR REPLACE FUNCTION public.trg_set_approved_at()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'active'
     AND (OLD.status IS DISTINCT FROM 'active')
     AND NEW.approved_at IS NULL
  THEN
    NEW.approved_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_approved_at ON public.profiles;
CREATE TRIGGER set_approved_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_set_approved_at();

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

-- 5) STORAGE: agency-logos bucket (2 MB, images only)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'agency-logos', 'agency-logos', true, 2097152,
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

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

-- 8) STORAGE POLICIES: agency-logos (org-member path check)
DROP POLICY IF EXISTS "agency_logo_insert" ON storage.objects;
DROP POLICY IF EXISTS "agency_logo_update" ON storage.objects;
DROP POLICY IF EXISTS "agency_logo_delete" ON storage.objects;
DROP POLICY IF EXISTS "agency_logo_public_read" ON storage.objects;

CREATE POLICY "agency_logo_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'agency-logos'
    AND is_org_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "agency_logo_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'agency-logos'
    AND is_org_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
  )
  WITH CHECK (
    bucket_id = 'agency-logos'
    AND is_org_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "agency_logo_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'agency-logos'
    AND is_org_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "agency_logo_public_read"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'agency-logos');

-- 9) STORAGE POLICIES: harden property-images INSERT (uid folder)
DROP POLICY IF EXISTS "Authenticated users can upload property images" ON storage.objects;

CREATE POLICY "property_images_insert_own_folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'property-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
