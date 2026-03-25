
-- =============================================
-- LOTE 5: Storage, approved_at, missing tables/columns
-- =============================================

-- Avatars bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg','image/jpg','image/png','image/gif','image/webp'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 5242880, allowed_mime_types = ARRAY['image/jpeg','image/jpg','image/png','image/gif','image/webp'];

-- Harden avatar policies (drop old, create path-based)
DROP POLICY IF EXISTS "Usuarios pueden subir sus propios avatares" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propios avatares" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propios avatares" ON storage.objects;
DROP POLICY IF EXISTS "Cualquiera puede ver avatares" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public avatar read access" ON storage.objects;

CREATE POLICY "avatar_insert_own_folder" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "avatar_update_own_folder" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text) WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "avatar_delete_own_folder" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "avatar_public_read" ON storage.objects FOR SELECT TO public USING (bucket_id = 'avatars');

-- Harden property-images INSERT
DROP POLICY IF EXISTS "Authenticated users can upload property images" ON storage.objects;
CREATE POLICY "property_images_insert_own_folder" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'property-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Fix user_listing_attachments FK
ALTER TABLE public.user_listing_attachments DROP CONSTRAINT IF EXISTS user_listing_attachments_added_by_fkey;
ALTER TABLE public.user_listing_attachments ADD CONSTRAINT user_listing_attachments_added_by_fkey FOREIGN KEY (added_by) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Organizations: logo_url + contact fields
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS logo_url text NOT NULL DEFAULT '';
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS contact_name text NOT NULL DEFAULT '';
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS contact_email text NOT NULL DEFAULT '';
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS contact_phone text NOT NULL DEFAULT '';
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS contact_person_phone text NOT NULL DEFAULT '';

-- Agency-logos bucket
DROP POLICY IF EXISTS "agency_logo_insert" ON storage.objects;
DROP POLICY IF EXISTS "agency_logo_update" ON storage.objects;
DROP POLICY IF EXISTS "agency_logo_delete" ON storage.objects;
DROP POLICY IF EXISTS "agency_logo_public_read" ON storage.objects;
DROP POLICY IF EXISTS "Miembros org pueden subir logo agencia" ON storage.objects;
DROP POLICY IF EXISTS "Miembros org pueden actualizar logo agencia" ON storage.objects;
DROP POLICY IF EXISTS "Miembros org pueden borrar logo agencia" ON storage.objects;
DROP POLICY IF EXISTS "Lectura pública logos agencia" ON storage.objects;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('agency-logos', 'agency-logos', true, 2097152, ARRAY['image/jpeg','image/jpg','image/png','image/gif','image/webp'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 2097152, allowed_mime_types = ARRAY['image/jpeg','image/jpg','image/png','image/gif','image/webp'];

CREATE POLICY "agency_logo_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'agency-logos' AND is_org_member(auth.uid(), ((storage.foldername(name))[1])::uuid));
CREATE POLICY "agency_logo_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'agency-logos' AND is_org_member(auth.uid(), ((storage.foldername(name))[1])::uuid)) WITH CHECK (bucket_id = 'agency-logos' AND is_org_member(auth.uid(), ((storage.foldername(name))[1])::uuid));
CREATE POLICY "agency_logo_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'agency-logos' AND is_org_member(auth.uid(), ((storage.foldername(name))[1])::uuid));
CREATE POLICY "agency_logo_public_read" ON storage.objects FOR SELECT TO public USING (bucket_id = 'agency-logos');

-- RPC: update_organization_logo_url
CREATE OR REPLACE FUNCTION public.update_organization_logo_url(_org_id uuid, _logo_url text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'No autenticado'; END IF;
  IF NOT public.is_org_member(auth.uid(), _org_id) THEN RAISE EXCEPTION 'No autorizado'; END IF;
  UPDATE public.organizations SET logo_url = _logo_url, updated_at = now() WHERE id = _org_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.update_organization_logo_url(uuid, text) TO authenticated;

-- Profiles: approved_at
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS approved_at timestamptz;

-- Clean up old trigger if exists
DROP FUNCTION IF EXISTS public.trg_set_approved_at() CASCADE;
DROP TRIGGER IF EXISTS set_approved_at ON public.profiles;

-- Create approved_at trigger
CREATE OR REPLACE FUNCTION public.trg_profiles_set_approved_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'active'::public.user_status THEN
    IF TG_OP = 'INSERT' THEN
      IF NEW.approved_at IS NULL THEN NEW.approved_at := now(); END IF;
    ELSIF OLD.status IS DISTINCT FROM 'active'::public.user_status THEN
      IF NEW.approved_at IS NULL THEN NEW.approved_at := now(); END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_set_approved_at ON public.profiles;
CREATE TRIGGER trg_profiles_set_approved_at BEFORE INSERT OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.trg_profiles_set_approved_at();

-- publication_deletion_audit_log
CREATE TABLE IF NOT EXISTS public.publication_deletion_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pub_id uuid NOT NULL,
  property_title text,
  org_name text,
  reason text NOT NULL DEFAULT '',
  deleted_by uuid NOT NULL,
  deleted_by_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.publication_deletion_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage pub deletion audit" ON public.publication_deletion_audit_log FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));

-- admin_hidden on user_listings
ALTER TABLE public.user_listings ADD COLUMN IF NOT EXISTS admin_hidden boolean NOT NULL DEFAULT false;

-- is_active on organization_members
ALTER TABLE public.organization_members ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- admin_physical_delete_user (3-param version)
CREATE OR REPLACE FUNCTION public.admin_physical_delete_user(_user_id uuid, _reason text, _deleted_by uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_email text;
  v_name text;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  SELECT email, display_name INTO v_email, v_name FROM public.profiles WHERE user_id = _user_id;
  INSERT INTO public.deletion_audit_log (deleted_user_id, deleted_user_email, deleted_user_name, reason, deleted_by) VALUES (_user_id, v_email, v_name, _reason, _deleted_by);
  DELETE FROM public.profiles WHERE user_id = _user_id;
  DELETE FROM public.organizations WHERE created_by = _user_id;
  DELETE FROM auth.users WHERE id = _user_id;
END;
$$;

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_listings;

-- Auth triggers on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
CREATE TRIGGER on_auth_user_created_role AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated AFTER UPDATE OF email ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_user_email_sync();
