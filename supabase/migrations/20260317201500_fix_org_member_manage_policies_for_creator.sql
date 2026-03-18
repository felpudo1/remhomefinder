-- Alinea permisos con la UI de equipos:
-- el creador de la organización (organizations.created_by) también puede
-- pausar/reactivar y eliminar miembros, aunque no tenga org_role='owner'.

DROP POLICY IF EXISTS "Owners can manage members" ON public.organization_members;
DROP POLICY IF EXISTS "Owners can update members" ON public.organization_members;

CREATE POLICY "Owners can manage members"
ON public.organization_members
FOR DELETE
TO authenticated
USING (
  is_org_owner(auth.uid(), org_id)
  OR EXISTS (
    SELECT 1
    FROM public.organizations o
    WHERE o.id = organization_members.org_id
      AND o.created_by = auth.uid()
  )
  OR user_id = auth.uid()
  OR has_role(auth.uid(), 'admin')
);

CREATE POLICY "Owners can update members"
ON public.organization_members
FOR UPDATE
TO authenticated
USING (
  is_org_owner(auth.uid(), org_id)
  OR EXISTS (
    SELECT 1
    FROM public.organizations o
    WHERE o.id = organization_members.org_id
      AND o.created_by = auth.uid()
  )
  OR has_role(auth.uid(), 'admin')
)
WITH CHECK (
  is_org_owner(auth.uid(), org_id)
  OR EXISTS (
    SELECT 1
    FROM public.organizations o
    WHERE o.id = organization_members.org_id
      AND o.created_by = auth.uid()
  )
  OR has_role(auth.uid(), 'admin')
);
