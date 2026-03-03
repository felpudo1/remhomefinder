DROP POLICY IF EXISTS "Anyone can view active marketplace properties" ON public.marketplace_properties;

CREATE POLICY "Anyone can view non-deleted marketplace properties"
ON public.marketplace_properties
FOR SELECT
TO authenticated
USING (status <> 'deleted'::marketplace_property_status);