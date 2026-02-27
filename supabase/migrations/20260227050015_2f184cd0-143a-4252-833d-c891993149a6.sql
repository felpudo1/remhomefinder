
-- 1. Drop RLS policies that reference sharing functions
DROP POLICY IF EXISTS "Users can update own or shared-edit properties" ON properties;
DROP POLICY IF EXISTS "Users can view own or shared properties" ON properties;
DROP POLICY IF EXISTS "Users can view comments on accessible properties" ON property_comments;
DROP POLICY IF EXISTS "Users can comment on accessible properties" ON property_comments;

-- 2. Recreate simplified RLS policies without sharing references
CREATE POLICY "Users can update own or group properties" ON properties
  FOR UPDATE USING (
    user_id = auth.uid()
    OR (group_id IS NOT NULL AND is_group_member(auth.uid(), group_id))
  );

CREATE POLICY "Users can view own or group properties" ON properties
  FOR SELECT USING (
    user_id = auth.uid()
    OR (group_id IS NOT NULL AND is_group_member(auth.uid(), group_id))
  );

CREATE POLICY "Users can view comments on accessible properties" ON property_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = property_comments.property_id
        AND (p.user_id = auth.uid() OR (p.group_id IS NOT NULL AND is_group_member(auth.uid(), p.group_id)))
    )
  );

CREATE POLICY "Users can comment on accessible properties" ON property_comments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = property_comments.property_id
        AND (p.user_id = auth.uid() OR (p.group_id IS NOT NULL AND is_group_member(auth.uid(), p.group_id)))
    )
  );

-- 3. Drop sharing-related functions
DROP FUNCTION IF EXISTS public.has_property_access(uuid, uuid);
DROP FUNCTION IF EXISTS public.has_property_permission(uuid, uuid, text[]);
DROP FUNCTION IF EXISTS public.can_view_property(uuid, uuid);

-- 4. Drop the property_shares table
DROP TABLE IF EXISTS property_shares;
