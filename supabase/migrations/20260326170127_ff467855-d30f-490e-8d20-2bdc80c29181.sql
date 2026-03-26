
-- Permitir que el creador de una organización se inserte como owner
-- La política actual solo permite role='member', lo que impide crear grupos
DROP POLICY IF EXISTS "Users can join orgs" ON organization_members;

CREATE POLICY "Users can join orgs"
ON organization_members
FOR INSERT
TO authenticated
WITH CHECK (
  (user_id = auth.uid())
  AND (is_system_delegate = false)
  AND (
    role = 'member'::org_role
    OR (
      role = 'owner'::org_role
      AND is_org_owner(auth.uid(), org_id) = false
      AND (EXISTS (
        SELECT 1 FROM organizations o
        WHERE o.id = organization_members.org_id
        AND o.created_by = auth.uid()
      ))
    )
  )
);
