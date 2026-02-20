-- Create a helper function to check property access by property_id
CREATE OR REPLACE FUNCTION public.can_view_property(_property_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH prop AS (
    SELECT user_id FROM properties WHERE id = _property_id
  )
  SELECT EXISTS (
    SELECT 1 FROM prop
    WHERE user_id = _user_id
       OR EXISTS (
            SELECT 1 FROM property_shares
            WHERE owner_id = prop.user_id
              AND shared_with_id = _user_id
          )
  );
$$;

-- Update RLS policies for property_comments to use the new helper function
DROP POLICY IF EXISTS "Users can view comments on accessible properties" ON public.property_comments;

CREATE POLICY "Users can view comments on accessible properties"
  ON public.property_comments FOR SELECT
  USING ( public.can_view_property(property_id, auth.uid()) );

-- Verify insert policy also relies on access (simplifying to view access for now to ensure flow works, 
-- or we could keep the permission check if strictly needed, but view access is a good baseline)
-- Keeping the existing INSERT policy logic but ensuring it works might be safer, 
-- but usually if you can view, you can comment in this app context. 
-- Let's stick to fixing VIEW first. The INSERT issue is likely "not appearing" which is frontend or RLS.
-- If the user reported "others cannot see", it's definitely SELECT policy.
