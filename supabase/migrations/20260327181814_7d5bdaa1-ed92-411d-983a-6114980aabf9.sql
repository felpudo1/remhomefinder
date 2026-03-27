
-- =============================================
-- FASE 1: Optimización de Infraestructura
-- =============================================

-- 1) Índices para búsqueda en Marketplace (properties)
CREATE INDEX IF NOT EXISTS idx_properties_neighborhood ON public.properties (neighborhood);
CREATE INDEX IF NOT EXISTS idx_properties_city ON public.properties (city);
CREATE INDEX IF NOT EXISTS idx_properties_price_amount ON public.properties (price_amount);
CREATE INDEX IF NOT EXISTS idx_properties_rooms ON public.properties (rooms);

-- 2) Índices para agent_publications
CREATE INDEX IF NOT EXISTS idx_agent_publications_org_id ON public.agent_publications (org_id);
CREATE INDEX IF NOT EXISTS idx_agent_publications_property_id ON public.agent_publications (property_id);
CREATE INDEX IF NOT EXISTS idx_agent_publications_status ON public.agent_publications (status);

-- 3) Trigger: sincronizar updated_at de user_listings al insertar comentario
CREATE OR REPLACE FUNCTION public.trg_update_listing_on_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.user_listings
  SET updated_at = now()
  WHERE id = NEW.user_listing_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_comment_updates_listing ON public.family_comments;
CREATE TRIGGER trg_comment_updates_listing
  AFTER INSERT ON public.family_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_update_listing_on_comment();

-- 4) RPC consolidada para Marketplace
CREATE OR REPLACE FUNCTION public.get_marketplace_publications_page(
  _cursor timestamp with time zone DEFAULT NULL,
  _page_size integer DEFAULT 50,
  _filters jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_result jsonb;
  v_filter_listing_type text;
  v_filter_city text;
  v_filter_neighborhood text;
  v_filter_min_price numeric;
  v_filter_max_price numeric;
  v_filter_min_rooms integer;
BEGIN
  -- Extract filters
  v_filter_listing_type := _filters->>'listing_type';
  v_filter_city := _filters->>'city';
  v_filter_neighborhood := _filters->>'neighborhood';
  v_filter_min_price := (_filters->>'min_price')::numeric;
  v_filter_max_price := (_filters->>'max_price')::numeric;
  v_filter_min_rooms := (_filters->>'min_rooms')::integer;

  WITH pubs AS (
    SELECT
      ap.id,
      ap.property_id,
      ap.org_id,
      ap.published_by,
      ap.status,
      ap.listing_type,
      ap.description,
      ap.created_at,
      ap.updated_at
    FROM public.agent_publications ap
    JOIN public.properties p ON p.id = ap.property_id
    WHERE ap.status <> 'eliminado'
      AND (_cursor IS NULL OR ap.created_at < _cursor)
      AND (v_filter_listing_type IS NULL OR ap.listing_type::text = v_filter_listing_type)
      AND (v_filter_city IS NULL OR p.city ILIKE '%' || v_filter_city || '%')
      AND (v_filter_neighborhood IS NULL OR p.neighborhood ILIKE '%' || v_filter_neighborhood || '%')
      AND (v_filter_min_price IS NULL OR p.price_amount >= v_filter_min_price)
      AND (v_filter_max_price IS NULL OR p.price_amount <= v_filter_max_price)
      AND (v_filter_min_rooms IS NULL OR p.rooms >= v_filter_min_rooms)
    ORDER BY ap.created_at DESC
    LIMIT _page_size
  ),
  enriched AS (
    SELECT
      pubs.*,
      jsonb_build_object(
        'id', p.id,
        'title', p.title,
        'source_url', p.source_url,
        'price_amount', p.price_amount,
        'price_expenses', p.price_expenses,
        'total_cost', p.total_cost,
        'currency', p.currency,
        'neighborhood', p.neighborhood,
        'city', p.city,
        'm2_total', p.m2_total,
        'rooms', p.rooms,
        'images', to_jsonb(p.images),
        'ref', p.ref
      ) AS property,
      COALESCE(o.name, 'Organización') AS org_name,
      o.created_by AS org_created_by,
      COALESCE(pr.display_name, pr.email, 'Agente') AS agent_name,
      NULLIF(pr.phone, '') AS agent_phone,
      COALESCE(rat.avg_rating, 0) AS avg_rating,
      COALESCE(rat.total_votes, 0) AS total_votes
    FROM pubs
    LEFT JOIN public.properties p ON p.id = pubs.property_id
    LEFT JOIN public.organizations o ON o.id = pubs.org_id
    LEFT JOIN public.profiles pr ON pr.user_id = pubs.published_by
    LEFT JOIN LATERAL (
      SELECT
        ROUND(AVG(rv.rating)::numeric, 2) AS avg_rating,
        COUNT(*)::integer AS total_votes
      FROM public.property_reviews rv
      WHERE rv.property_id = pubs.property_id
    ) rat ON true
  )
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', e.id,
      'property_id', e.property_id,
      'org_id', e.org_id,
      'published_by', e.published_by,
      'status', e.status,
      'listing_type', e.listing_type,
      'description', e.description,
      'created_at', e.created_at,
      'updated_at', e.updated_at,
      'property', e.property,
      'org_name', e.org_name,
      'org_created_by', e.org_created_by,
      'agent_name', e.agent_name,
      'agent_phone', e.agent_phone,
      'avg_rating', e.avg_rating,
      'total_votes', e.total_votes
    )
    ORDER BY e.created_at DESC
  ), '[]'::jsonb)
  INTO v_result
  FROM enriched e;

  RETURN v_result;
END;
$$;
