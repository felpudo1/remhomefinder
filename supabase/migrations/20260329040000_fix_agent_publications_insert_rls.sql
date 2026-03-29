-- Fix RLS policy for agent_publications INSERT to allow admins
-- This allows admins to create publications on behalf of any agent (Modo Dios)

DROP POLICY IF EXISTS "Org members can insert publications" ON public.agent_publications;

CREATE POLICY "Org members can insert publications" 
ON public.agent_publications 
FOR INSERT TO authenticated 
WITH CHECK (
    is_org_member(auth.uid(), org_id) 
    OR is_system_delegate(auth.uid())
    OR has_role(auth.uid(), 'admin')
);
