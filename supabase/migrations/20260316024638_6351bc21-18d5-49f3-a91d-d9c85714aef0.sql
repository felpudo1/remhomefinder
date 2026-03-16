DROP POLICY "Users can join orgs" ON public.organization_members;

CREATE POLICY "Users can join orgs" ON public.organization_members
FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND is_system_delegate = false
  AND (
    role = 'member'
    OR (role = 'owner' AND EXISTS (
      SELECT 1 FROM public.organizations
      WHERE id = org_id AND created_by = auth.uid()
    ))
  )
);