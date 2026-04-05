CREATE POLICY "Org members or admins can delete discovered links"
ON public.discovered_links
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM agency_discovery_tasks t
    WHERE t.id = discovered_links.task_id
      AND (is_org_member(auth.uid(), t.org_id) OR has_role(auth.uid(), 'admin'::app_role))
  )
);