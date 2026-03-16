
-- 1. Add is_active column to organization_members
ALTER TABLE public.organization_members 
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- 2. Update is_org_member to filter only active members
CREATE OR REPLACE FUNCTION public.is_org_member(_user_id uuid, _org_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = _user_id AND org_id = _org_id AND is_active = true
  );
$$;

-- 3. Add UPDATE policy for owners on organization_members
CREATE POLICY "Owners can update members" ON public.organization_members
FOR UPDATE TO authenticated
USING (is_org_owner(auth.uid(), org_id));
