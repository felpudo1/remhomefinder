-- Índice compuesto para acceso rápido al historial por listing y fecha
CREATE INDEX IF NOT EXISTS idx_status_history_listing_lookup 
  ON public.status_history_log(user_listing_id, created_at DESC);

-- Índice para filtrar publicaciones por agencia y estado
CREATE INDEX IF NOT EXISTS idx_agent_pubs_org_filter 
  ON public.agent_publications(org_id, status);

-- Índice para optimizar joins de listings por publicación origen
CREATE INDEX IF NOT EXISTS idx_user_listings_source_lookup 
  ON public.user_listings(source_publication_id);