-- =============================================================================
-- Reparación ONE-OFF: BD que ya aplicó versiones ANTIGUAS de las migraciones
-- (trigger set_approved_at + policies agency_logo_* + policies en español).
-- Proyecto NUEVO con el repo ya corregido: NO necesitás este archivo.
-- Ejecutar en Supabase → SQL Editor como postgres (una sola vez).
-- =============================================================================

-- Trigger duplicado de approved_at (solo UPDATE) — el definitivo es trg_profiles_set_approved_at
DROP TRIGGER IF EXISTS set_approved_at ON public.profiles;
DROP FUNCTION IF EXISTS public.trg_set_approved_at();

-- Dejar una sola familia de policies para agency-logos (las españolas coinciden con 103000)
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
