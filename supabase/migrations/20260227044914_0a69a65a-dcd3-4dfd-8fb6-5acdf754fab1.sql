
-- Fix: Update the "Users can view own or shared properties" SELECT policy 
-- to also allow group members to see group properties
DROP POLICY IF EXISTS "Users can view own or shared properties" ON properties;
CREATE POLICY "Users can view own or shared properties"
  ON properties FOR SELECT
  USING (
    user_id = auth.uid()
    OR has_property_access(user_id, auth.uid())
    OR (group_id IS NOT NULL AND is_group_member(auth.uid(), group_id))
  );

-- Drop the separate restrictive group policy since it's now merged
DROP POLICY IF EXISTS "Group members can view group properties" ON properties;

-- Also fix: allow group members to comment on group properties
DROP POLICY IF EXISTS "Users can comment on accessible properties" ON property_comments;
CREATE POLICY "Users can comment on accessible properties"
  ON property_comments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = property_comments.property_id
        AND (
          p.user_id = auth.uid()
          OR has_property_permission(p.user_id, auth.uid(), ARRAY['comment','edit','full'])
          OR (p.group_id IS NOT NULL AND is_group_member(auth.uid(), p.group_id))
        )
    )
  );

-- Fix: allow group members to view comments on group properties
DROP POLICY IF EXISTS "Users can view comments on accessible properties" ON property_comments;
CREATE POLICY "Users can view comments on accessible properties"
  ON property_comments FOR SELECT
  USING (
    can_view_property(property_id, auth.uid())
    OR EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = property_comments.property_id
        AND p.group_id IS NOT NULL
        AND is_group_member(auth.uid(), p.group_id)
    )
  );
