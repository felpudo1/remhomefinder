-- Punto 6: Índices para columnas usadas en políticas RLS
-- Evita sequential scans en tablas grandes durante cada operación protegida por RLS

-- user_listings.source_publication_id: usado en RLS de attribute_scores, status_history_log y agent visibility
CREATE INDEX IF NOT EXISTS idx_user_listings_source_publication_id
  ON public.user_listings (source_publication_id)
  WHERE source_publication_id IS NOT NULL;

-- user_listings(org_id, added_by): usado en múltiples policies de SELECT/INSERT/UPDATE/DELETE
CREATE INDEX IF NOT EXISTS idx_user_listings_org_id_added_by
  ON public.user_listings (org_id, added_by);

-- agent_publications.org_id: usado en visibilidad de agentes y joins con user_listings
CREATE INDEX IF NOT EXISTS idx_agent_publications_org_id
  ON public.agent_publications (org_id);