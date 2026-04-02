
CREATE OR REPLACE FUNCTION public.get_marketplace_publications_page(
  _cursor timestamp with time zone DEFAULT NULL,
  _page_size integer DEFAULT 50,
  _filters jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_result jsonb;
  v_filter_listing_type text;
  v_filter_city text;
  v_filter_neighborhood text;
  v_filter_min_price numeric;
  v_filter_max_price numeric;
  v_filter_min_rooms integer;
BEGIN
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
      COALESCE(NULLIF(o.logo_url, ''), '') AS org_logo_url,
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
      'org_logo_url', e.org_logo_url,
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
$function$;
