
CREATE OR REPLACE FUNCTION public.get_user_listings_page(_cursor timestamp with time zone DEFAULT NULL::timestamp with time zone, _page_size integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_page jsonb;
  v_listing_ids uuid[];
  v_added_by_ids uuid[];
  v_source_pub_ids uuid[];
  v_status_listing_ids uuid[];
  v_reads jsonb;
  v_profiles jsonb;
  v_status_history jsonb;
  v_comments jsonb;
  v_attachments jsonb;
  v_contacts jsonb;
  v_org_names jsonb;
  v_changer_ids uuid[];
  v_changer_profiles jsonb;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;

  -- 1) Page of listings with joined data
  WITH page AS (
    SELECT
      ul.id,
      ul.property_id,
      ul.org_id,
      ul.current_status,
      ul.listing_type,
      ul.added_by,
      ul.created_at,
      ul.updated_at,
      ul.source_publication_id,
      ul.contact_name,
      ul.contact_phone,
      ul.contact_source,
      CASE WHEN p.id IS NOT NULL THEN jsonb_build_object(
        'id', p.id, 'title', p.title, 'source_url', p.source_url,
        'price_amount', p.price_amount, 'price_expenses', p.price_expenses,
        'total_cost', p.total_cost, 'currency', p.currency,
        'neighborhood', p.neighborhood, 'city', p.city,
        'm2_total', p.m2_total, 'rooms', p.rooms,
        'images', to_jsonb(p.images), 'details', p.details,
        'ref', p.ref, 'updated_at', p.updated_at
      ) ELSE NULL END AS property,
      jsonb_build_object('type', o.type, 'is_personal', o.is_personal) AS organization,
      CASE WHEN ap.id IS NOT NULL THEN jsonb_build_object(
        'id', ap.id, 'org_id', ap.org_id,
        'published_by', ap.published_by,
        'org_name', COALESCE(ap_org.name, ''),
        'status', ap.status,
        'updated_at', ap.updated_at
      ) ELSE NULL END AS agent_publication
    FROM user_listings ul
    LEFT JOIN properties p ON p.id = ul.property_id
    LEFT JOIN organizations o ON o.id = ul.org_id
    LEFT JOIN agent_publications ap ON ap.id = ul.source_publication_id
    LEFT JOIN organizations ap_org ON ap_org.id = ap.org_id
    WHERE ul.admin_hidden = false
      AND (_cursor IS NULL OR ul.created_at < _cursor)
    ORDER BY ul.created_at DESC
    LIMIT _page_size
  )
  SELECT
    COALESCE(jsonb_agg(to_jsonb(page) ORDER BY page.created_at DESC), '[]'::jsonb),
    COALESCE(array_agg(page.id), ARRAY[]::uuid[]),
    COALESCE(array_agg(DISTINCT page.added_by) FILTER (WHERE page.added_by IS NOT NULL), ARRAY[]::uuid[]),
    COALESCE(array_agg(DISTINCT page.source_publication_id) FILTER (WHERE page.source_publication_id IS NOT NULL), ARRAY[]::uuid[]),
    COALESCE(array_agg(page.id) FILTER (WHERE page.current_status IN ('contactado', 'descartado', 'visita_coordinada')), ARRAY[]::uuid[])
  INTO v_page, v_listing_ids, v_added_by_ids, v_source_pub_ids, v_status_listing_ids
  FROM page;

  IF v_page = '[]'::jsonb OR array_length(v_listing_ids, 1) IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;

  -- 2) Comment reads for this user
  SELECT COALESCE(jsonb_object_agg(r.user_listing_id::text, r.last_read_at), '{}'::jsonb)
  INTO v_reads
  FROM user_listing_comment_reads r
  WHERE r.user_id = v_user_id AND r.user_listing_id = ANY(v_listing_ids);

  -- 3) Profiles for added_by users
  SELECT COALESCE(jsonb_object_agg(pr.user_id::text, COALESCE(pr.display_name, pr.email, 'Usuario')), '{}'::jsonb)
  INTO v_profiles
  FROM profiles pr
  WHERE pr.user_id = ANY(v_added_by_ids);

  -- 4) Status history (latest per listing+status, deduped)
  SELECT COALESCE(jsonb_agg(to_jsonb(sh)), '[]'::jsonb)
  INTO v_status_history
  FROM (
    SELECT DISTINCT ON (slh.user_listing_id, slh.new_status)
      slh.user_listing_id,
      slh.new_status,
      slh.event_metadata,
      slh.changed_by,
      slh.created_at
    FROM status_history_log slh
    WHERE slh.user_listing_id = ANY(v_status_listing_ids)
      AND slh.new_status IN ('contactado', 'descartado', 'visita_coordinada')
    ORDER BY slh.user_listing_id, slh.new_status, slh.created_at DESC
  ) sh;

  -- Collect changer IDs from status history
  SELECT COALESCE(array_agg(DISTINCT (elem->>'changed_by')::uuid) FILTER (WHERE elem->>'changed_by' IS NOT NULL), ARRAY[]::uuid[])
  INTO v_changer_ids
  FROM jsonb_array_elements(v_status_history) elem;

  -- 5) Changer profiles
  SELECT COALESCE(jsonb_object_agg(pr.user_id::text, COALESCE(pr.display_name, 'Usuario')), '{}'::jsonb)
  INTO v_changer_profiles
  FROM profiles pr
  WHERE pr.user_id = ANY(v_changer_ids);

  -- 6) Family comments grouped by listing
  SELECT COALESCE(jsonb_object_agg(sub.lid, sub.comments), '{}'::jsonb)
  INTO v_comments
  FROM (
    SELECT fc.user_listing_id AS lid,
           jsonb_agg(jsonb_build_object(
             'id', fc.id, 'author', fc.author, 'avatar', fc.avatar,
             'text', fc.text, 'created_at', fc.created_at, 'user_id', fc.user_id
           ) ORDER BY fc.created_at ASC) AS comments
    FROM family_comments fc
    WHERE fc.user_listing_id = ANY(v_listing_ids)
    GROUP BY fc.user_listing_id
  ) sub;

  -- 7) Attachments grouped by listing
  SELECT COALESCE(jsonb_object_agg(sub.lid, sub.urls), '{}'::jsonb)
  INTO v_attachments
  FROM (
    SELECT ula.user_listing_id AS lid,
           jsonb_agg(ula.image_url) AS urls
    FROM user_listing_attachments ula
    WHERE ula.user_listing_id = ANY(v_listing_ids)
    GROUP BY ula.user_listing_id
  ) sub;

  -- 8) Marketplace contacts
  IF array_length(v_source_pub_ids, 1) > 0 THEN
    SELECT COALESCE(jsonb_object_agg(c.publication_id::text, jsonb_build_object('name', c.agent_name, 'phone', c.agent_phone)), '{}'::jsonb)
    INTO v_contacts
    FROM get_marketplace_publication_contacts(v_source_pub_ids) c;
  ELSE
    v_contacts := '{}'::jsonb;
  END IF;

  -- 9) Marketplace org names (from agent_publications org_ids)
  IF array_length(v_source_pub_ids, 1) > 0 THEN
    WITH pub_orgs AS (
      SELECT DISTINCT ap.org_id
      FROM agent_publications ap
      WHERE ap.id = ANY(v_source_pub_ids) AND ap.org_id IS NOT NULL
    )
    SELECT COALESCE(jsonb_object_agg(n.id::text, n.name), '{}'::jsonb)
    INTO v_org_names
    FROM pub_orgs po
    CROSS JOIN LATERAL get_marketplace_org_names(ARRAY[po.org_id]) n;
  ELSE
    v_org_names := '{}'::jsonb;
  END IF;

  -- 10) Assemble final result: enrich each listing with lookups
  RETURN (
    SELECT jsonb_agg(
      listing || jsonb_build_object(
        '_reads', v_reads,
        '_profiles', v_profiles,
        '_status_history', v_status_history,
        '_changer_profiles', v_changer_profiles,
        '_comments', COALESCE(v_comments->>(listing->>'id'), '[]'),
        '_attachments', COALESCE(v_attachments->>(listing->>'id'), '[]'),
        '_contacts', v_contacts,
        '_org_names', v_org_names
      )
    )
    FROM jsonb_array_elements(v_page) listing
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.get_user_listings_page FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_listings_page TO authenticated;
