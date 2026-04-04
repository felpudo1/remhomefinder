
-- =============================================================
-- 1. agency_discovery_tasks
-- =============================================================
CREATE TABLE IF NOT EXISTS public.agency_discovery_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  domain_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_by UUID NOT NULL,
  total_links INTEGER NOT NULL DEFAULT 0,
  completed_links INTEGER NOT NULL DEFAULT 0,
  failed_links INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.agency_discovery_tasks ENABLE ROW LEVEL SECURITY;

-- Org members can view tasks
CREATE POLICY "Org members can view discovery tasks"
  ON public.agency_discovery_tasks FOR SELECT
  TO authenticated
  USING (public.is_org_member(auth.uid(), org_id) OR public.has_role(auth.uid(), 'admin'::app_role));

-- Org members can create tasks
CREATE POLICY "Org members can create discovery tasks"
  ON public.agency_discovery_tasks FOR INSERT
  TO authenticated
  WITH CHECK (public.is_org_member(auth.uid(), org_id) AND created_by = auth.uid());

-- Org members can update tasks
CREATE POLICY "Org members can update discovery tasks"
  ON public.agency_discovery_tasks FOR UPDATE
  TO authenticated
  USING (public.is_org_member(auth.uid(), org_id) OR public.has_role(auth.uid(), 'admin'::app_role));

-- =============================================================
-- 2. discovered_links
-- =============================================================
CREATE TABLE IF NOT EXISTS public.discovered_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.agency_discovery_tasks(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT,
  thumbnail_url TEXT,
  is_selected BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  property_id UUID REFERENCES public.properties(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(task_id, url)
);

ALTER TABLE public.discovered_links ENABLE ROW LEVEL SECURITY;

-- Org members can view links (via task → org)
CREATE POLICY "Org members can view discovered links"
  ON public.discovered_links FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.agency_discovery_tasks t
    WHERE t.id = discovered_links.task_id
      AND (public.is_org_member(auth.uid(), t.org_id) OR public.has_role(auth.uid(), 'admin'::app_role))
  ));

-- Org members can insert links
CREATE POLICY "Org members can insert discovered links"
  ON public.discovered_links FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.agency_discovery_tasks t
    WHERE t.id = discovered_links.task_id
      AND public.is_org_member(auth.uid(), t.org_id)
  ));

-- Org members can update links (select/deselect, status changes)
CREATE POLICY "Org members can update discovered links"
  ON public.discovered_links FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.agency_discovery_tasks t
    WHERE t.id = discovered_links.task_id
      AND (public.is_org_member(auth.uid(), t.org_id) OR public.has_role(auth.uid(), 'admin'::app_role))
  ));

-- Service role needs update access for edge functions
-- (handled via service_role key bypass)

-- =============================================================
-- 3. Indexes for performance
-- =============================================================
CREATE INDEX idx_discovered_links_task_status ON public.discovered_links(task_id, status);
CREATE INDEX idx_discovery_tasks_org ON public.agency_discovery_tasks(org_id);

-- =============================================================
-- 4. Enable Realtime for discovered_links
-- =============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.discovered_links;
