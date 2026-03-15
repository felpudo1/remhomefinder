-- 1. Corregir escalación de privilegios en organization_members
DROP POLICY "Users can join orgs" ON public.organization_members;

CREATE POLICY "Users can join orgs"
ON public.organization_members
FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND role = 'member'
  AND is_system_delegate = false
);

-- 2. Corregir exposición de datos sensibles en profiles
DROP POLICY "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own or org profiles"
ON public.profiles
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.organization_members om1
    WHERE om1.user_id = auth.uid()
      AND om1.org_id IN (
        SELECT om2.org_id FROM public.organization_members om2
        WHERE om2.user_id = profiles.user_id
      )
  )
);