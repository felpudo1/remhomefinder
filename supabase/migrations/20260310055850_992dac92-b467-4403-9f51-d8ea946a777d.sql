DROP POLICY IF EXISTS "Admins can delete any marketplace property" ON public.marketplace_properties;
CREATE POLICY "Admins can delete any marketplace property"
ON public.marketplace_properties FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));