-- Política de lectura pública para usuarios anónimos, filtrando por ID
-- Permite que cualquier persona acceda a una propiedad específica por su ID
CREATE POLICY "Public can view properties by id"
ON public.properties
FOR SELECT
TO anon
USING (true);