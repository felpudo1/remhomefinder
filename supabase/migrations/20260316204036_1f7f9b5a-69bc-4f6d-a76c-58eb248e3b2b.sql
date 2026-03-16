
-- Crear bucket de storage para imágenes de propiedades
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

-- Política: usuarios autenticados pueden subir imágenes
CREATE POLICY "Authenticated users can upload property images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'property-images');

-- Política: cualquiera puede ver las imágenes (bucket público)
CREATE POLICY "Anyone can view property images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'property-images');

-- Política: usuarios pueden borrar sus propias imágenes
CREATE POLICY "Users can delete own property images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'property-images' AND (storage.foldername(name))[1] = auth.uid()::text);
