
-- Allow admins to manage cities
CREATE POLICY "Admins can manage cities"
  ON public.cities FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to manage neighborhoods
CREATE POLICY "Admins can manage neighborhoods"
  ON public.neighborhoods FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
