CREATE POLICY "Admins can view all properties"
ON public.properties
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all properties"
ON public.properties
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));