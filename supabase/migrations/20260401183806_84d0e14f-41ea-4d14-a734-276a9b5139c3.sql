-- Tipo para eventos de analytics
CREATE TYPE public.analytics_event_type AS ENUM ('qr_scan', 'property_view', 'listing_saved');

-- Tabla de eventos
CREATE TABLE public.analytics_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type public.analytics_event_type NOT NULL,
    property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.profiles(user_id) ON DELETE SET NULL,
    org_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
    source_publication_id uuid REFERENCES public.agent_publications(id) ON DELETE SET NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_analytics_events_publication ON public.analytics_events(source_publication_id);
CREATE INDEX idx_analytics_events_property ON public.analytics_events(property_id);
CREATE INDEX idx_analytics_events_user ON public.analytics_events(user_id);
CREATE INDEX idx_analytics_events_type ON public.analytics_events(event_type);

-- RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- INSERT público (anónimos pueden registrar eventos)
CREATE POLICY "Anyone can insert analytics events"
ON public.analytics_events FOR INSERT
TO public
WITH CHECK (true);

-- SELECT: agente dueño de la publicación o admin
CREATE POLICY "Agent owner or admin can view analytics events"
ON public.analytics_events FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.agent_publications ap
        WHERE ap.id = analytics_events.source_publication_id
        AND (ap.published_by = auth.uid() OR public.is_org_member(auth.uid(), ap.org_id))
    )
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- UPDATE: solo el sistema puede actualizar (ej. asociar user_id post-registro)
CREATE POLICY "Authenticated can update own anonymous events"
ON public.analytics_events FOR UPDATE
TO authenticated
USING (user_id IS NULL OR user_id = auth.uid())
WITH CHECK (user_id = auth.uid());