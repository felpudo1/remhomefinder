
-- Table: agency_shared_properties
CREATE TABLE public.agency_shared_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  marketplace_property_id uuid NOT NULL REFERENCES public.marketplace_properties(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  shared_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(marketplace_property_id, group_id)
);

ALTER TABLE public.agency_shared_properties ENABLE ROW LEVEL SECURITY;

-- RLS: SELECT - group members can view
CREATE POLICY "Group members can view shared properties"
ON public.agency_shared_properties
FOR SELECT
TO authenticated
USING (is_group_member(auth.uid(), group_id));

-- RLS: INSERT - group members can share their own
CREATE POLICY "Group members can share properties"
ON public.agency_shared_properties
FOR INSERT
TO authenticated
WITH CHECK (is_group_member(auth.uid(), group_id) AND shared_by = auth.uid());

-- RLS: DELETE - author or group owner can unshare
CREATE POLICY "Author or group owner can unshare"
ON public.agency_shared_properties
FOR DELETE
TO authenticated
USING (shared_by = auth.uid() OR is_group_owner(auth.uid(), group_id));
