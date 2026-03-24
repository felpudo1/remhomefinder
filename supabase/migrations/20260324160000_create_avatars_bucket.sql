-- Crear bucket para avatares de usuarios en Supabase Storage
-- Este bucket permite a los usuarios subir sus fotos de perfil

-- Insertar el bucket si no existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

-- Habilitar RLS en el bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios autenticados pueden subir avatares
-- Solo pueden subir archivos en la carpeta con su propio user_id
CREATE POLICY "Usuarios pueden subir sus propios avatares"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Política: Los usuarios pueden actualizar sus propios avatares
CREATE POLICY "Usuarios pueden actualizar sus propios avatares"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Política: Los usuarios pueden eliminar sus propios avatares
CREATE POLICY "Usuarios pueden eliminar sus propios avatares"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Política: Cualquiera puede ver los avatares (público)
CREATE POLICY "Cualquiera puede ver avatares"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Comentario descriptivo
COMMENT ON TABLE storage.objects IS 'Almacenamiento de objetos incluyendo avatares de usuarios';
