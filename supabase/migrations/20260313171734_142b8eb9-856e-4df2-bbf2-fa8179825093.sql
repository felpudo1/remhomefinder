-- Fix INSERT policy to also allow group owners (creators who aren't in group_members)
DROP POLICY IF EXISTS "Group members can share properties" ON public.agency_shared_properties;
CREATE POLICY "Group members can share properties"
  ON public.agency_shared_properties
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (is_group_member(auth.uid(), group_id) OR is_group_owner(auth.uid(), group_id))
    AND shared_by = auth.uid()
  );

-- Fix SELECT policy too
DROP POLICY IF EXISTS "Group members can view shared properties" ON public.agency_shared_properties;
CREATE POLICY "Group members can view shared properties"
  ON public.agency_shared_properties
  FOR SELECT
  TO authenticated
  USING (
    is_group_member(auth.uid(), group_id) OR is_group_owner(auth.uid(), group_id)
  );

-- Fix DELETE policy too
DROP POLICY IF EXISTS "Author or group owner can unshare" ON public.agency_shared_properties;
CREATE POLICY "Author or group owner can unshare"
  ON public.agency_shared_properties
  FOR DELETE
  TO authenticated
  USING (
    shared_by = auth.uid() OR is_group_owner(auth.uid(), group_id)
  );