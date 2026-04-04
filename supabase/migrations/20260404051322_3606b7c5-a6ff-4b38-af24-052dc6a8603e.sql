-- RPC: get_agent_property_insights
-- Paginación por propiedad con todos los users de esas propiedades
CREATE OR REPLACE FUNCTION public.get_agent_property_insights(
  p_org_id uuid,
  p_limit int DEFAULT 30,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  publication_id uuid,
  property_id uuid,
  property_title text,
  property_ref text,
  property_neighborhood text,
  property_price numeric,
  property_currency text,
  property_rooms int,
  listing_type text,
  pub_status text,
  pub_created_at timestamptz,
  user_listing_id uuid,
  user_id uuid,
  user_display_name text,
  user_email text,
  user_phone text,
  current_status text,
  user_updated_at timestamptz,
  user_org_id uuid,
  status_counts jsonb,
  ratings_by_status jsonb
)
LANGUAGE sql
SECURITY INVOKER
STABLE
SET search_path = 'public'
AS $$
  WITH paginated_pubs AS (
    SELECT ap.id AS pub_id, ap.property_id, ap.listing_type, ap.status, ap.created_at
    FROM public.agent_publications ap
    WHERE ap.org_id = p_org_id
      AND ap.status <> 'eliminado'
    ORDER BY ap.created_at DESC
    LIMIT p_limit OFFSET p_offset
  ),
  listings AS (
    SELECT
      pp.pub_id,
      pp.property_id,
      pp.listing_type,
      pp.status AS pub_status,
      pp.created_at AS pub_created_at,
      ul.id AS user_listing_id,
      ul.added_by AS user_id,
      ul.current_status,
      ul.updated_at AS user_updated_at,
      ul.org_id AS user_org_id
    FROM paginated_pubs pp
    LEFT JOIN public.user_listings ul ON ul.source_publication_id = pp.pub_id
  ),
  latest_logs AS (
    SELECT DISTINCT ON (shl.user_listing_id, shl.new_status)
      shl.user_listing_id,
      shl.new_status,
      shl.event_metadata
    FROM public.status_history_log shl
    WHERE shl.user_listing_id IN (SELECT l.user_listing_id FROM listings l WHERE l.user_listing_id IS NOT NULL)
    ORDER BY shl.user_listing_id, shl.new_status, shl.created_at DESC
  ),
  ratings_agg AS (
    SELECT
      ll.user_listing_id,
      jsonb_object_agg(ll.new_status, ll.event_metadata) AS ratings_by_status
    FROM latest_logs ll
    GROUP BY ll.user_listing_id
  ),
  status_counts_agg AS (
    SELECT
      l.pub_id,
      jsonb_object_agg(l.current_status, cnt) AS status_counts
    FROM (
      SELECT pub_id, current_status, COUNT(*)::int AS cnt
      FROM listings
      WHERE user_listing_id IS NOT NULL
      GROUP BY pub_id, current_status
    ) l
    GROUP BY l.pub_id
  )
  SELECT
    l.pub_id AS publication_id,
    p.id AS property_id,
    p.title AS property_title,
    p.ref AS property_ref,
    p.neighborhood AS property_neighborhood,
    p.price_amount AS property_price,
    p.currency::text AS property_currency,
    p.rooms AS property_rooms,
    l.listing_type::text,
    l.pub_status::text,
    l.pub_created_at,
    l.user_listing_id,
    l.user_id,
    COALESCE(pr.display_name, '') AS user_display_name,
    pr.email AS user_email,
    COALESCE(pr.phone, '') AS user_phone,
    l.current_status::text,
    l.user_updated_at,
    l.user_org_id,
    COALESCE(sca.status_counts, '{}'::jsonb) AS status_counts,
    COALESCE(ra.ratings_by_status, '{}'::jsonb) AS ratings_by_status
  FROM listings l
  LEFT JOIN public.properties p ON p.id = l.property_id
  LEFT JOIN public.profiles pr ON pr.user_id = l.user_id
  LEFT JOIN ratings_agg ra ON ra.user_listing_id = l.user_listing_id
  LEFT JOIN status_counts_agg sca ON sca.pub_id = l.pub_id
  ORDER BY l.pub_created_at DESC, l.user_updated_at DESC NULLS LAST;
$$;

-- RPC: get_user_status_history
-- Historial completo de un user_listing para carga on-demand
CREATE OR REPLACE FUNCTION public.get_user_status_history(
  p_user_listing_id uuid
)
RETURNS TABLE (
  new_status text,
  event_metadata jsonb,
  changed_by uuid,
  created_at timestamptz
)
LANGUAGE sql
SECURITY INVOKER
STABLE
SET search_path = 'public'
AS $$
  SELECT
    shl.new_status::text,
    shl.event_metadata,
    shl.changed_by,
    shl.created_at
  FROM public.status_history_log shl
  WHERE shl.user_listing_id = p_user_listing_id
  ORDER BY shl.created_at ASC;
$$;
