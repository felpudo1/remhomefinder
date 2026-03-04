CREATE POLICY "Admins can update marketplace properties"
ON public.marketplace_properties
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));