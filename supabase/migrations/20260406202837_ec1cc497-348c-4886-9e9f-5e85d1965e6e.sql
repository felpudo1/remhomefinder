
-- 1) agency_discovery_tasks.org_id → organizations.id  CASCADE
ALTER TABLE public.agency_discovery_tasks
  DROP CONSTRAINT IF EXISTS agency_discovery_tasks_org_id_fkey,
  ADD CONSTRAINT agency_discovery_tasks_org_id_fkey
    FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

-- 2) discovered_links.task_id → agency_discovery_tasks.id  CASCADE
ALTER TABLE public.discovered_links
  DROP CONSTRAINT IF EXISTS discovered_links_task_id_fkey,
  ADD CONSTRAINT discovered_links_task_id_fkey
    FOREIGN KEY (task_id) REFERENCES public.agency_discovery_tasks(id) ON DELETE CASCADE;
