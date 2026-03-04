CREATE POLICY "Admins can delete all properties"
ON public.properties
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));