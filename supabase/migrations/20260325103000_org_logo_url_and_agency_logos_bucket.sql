-- Logo de agencia: URL pública en organizations + bucket storage (única fuente de verdad
-- para agency-logos; la migración 20260325034204 ya no duplica bucket ni policies).

ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS logo_url text NOT NULL DEFAULT '';

COMMENT ON COLUMN public.organizations.logo_url IS 'URL pública del logo de la agencia (Supabase Storage)';

-- RPC: solo actualiza logo_url; miembros de la org pueden subir logo sin abrir update completo de la fila
CREATE OR REPLACE FUNCTION public.update_organization_logo_url(_org_id uuid, _logo_url text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;
  IF NOT public.is_org_member(auth.uid(), _org_id) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;
  UPDATE public.organizations
  SET logo_url = _logo_url, updated_at = now()
  WHERE id = _org_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_organization_logo_url(uuid, text) TO authenticated;

-- Bucket para logos de agencia: ruta {org_id}/archivo
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'agency-logos',
  'agency-logos',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

-- Idempotente: quitar políticas viejas (nombres en inglés de 034204) y estas mismas si se re-ejecuta
DROP POLICY IF EXISTS "agency_logo_insert" ON storage.objects;
DROP POLICY IF EXISTS "agency_logo_update" ON storage.objects;
DROP POLICY IF EXISTS "agency_logo_delete" ON storage.objects;
DROP POLICY IF EXISTS "agency_logo_public_read" ON storage.objects;
DROP POLICY IF EXISTS "Miembros org pueden subir logo agencia" ON storage.objects;
DROP POLICY IF EXISTS "Miembros org pueden actualizar logo agencia" ON storage.objects;
DROP POLICY IF EXISTS "Miembros org pueden borrar logo agencia" ON storage.objects;
DROP POLICY IF EXISTS "Lectura pública logos agencia" ON storage.objects;

CREATE POLICY "Miembros org pueden subir logo agencia"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'agency-logos'
  AND public.is_org_member(auth.uid(), (storage.foldername(name))[1]::uuid)
);

CREATE POLICY "Miembros org pueden actualizar logo agencia"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'agency-logos'
  AND public.is_org_member(auth.uid(), (storage.foldername(name))[1]::uuid)
)
WITH CHECK (
  bucket_id = 'agency-logos'
  AND public.is_org_member(auth.uid(), (storage.foldername(name))[1]::uuid)
);

CREATE POLICY "Miembros org pueden borrar logo agencia"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'agency-logos'
  AND public.is_org_member(auth.uid(), (storage.foldername(name))[1]::uuid)
);

CREATE POLICY "Lectura pública logos agencia"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'agency-logos');
