CREATE OR REPLACE FUNCTION get_agency_dashboard_stats(p_agency_id UUID)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_saved BIGINT;
  v_top_properties json;
BEGIN
  -- Verificar acceso
  IF NOT EXISTS (
    SELECT 1 FROM agencies a
    LEFT JOIN agency_members am ON a.id = am.agency_id
    WHERE a.id = p_agency_id AND (a.created_by = auth.uid() OR am.user_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Total guardados
  SELECT count(p.id) INTO v_total_saved
  FROM properties p
  JOIN marketplace_properties mp ON p.source_marketplace_id = mp.id
  WHERE mp.agency_id = p_agency_id;

  -- Top 3 propiedades más guardadas
  SELECT json_agg(row_to_json(t)) INTO v_top_properties
  FROM (
    SELECT mp.id, mp.title, mp.price_rent, count(p.id) as saves
    FROM marketplace_properties mp
    JOIN properties p ON p.source_marketplace_id = mp.id
    WHERE mp.agency_id = p_agency_id
    GROUP BY mp.id, mp.title, mp.price_rent
    ORDER BY saves DESC
    LIMIT 3
  ) t;

  RETURN json_build_object(
    'total_saved', COALESCE(v_total_saved, 0),
    'top_properties', COALESCE(v_top_properties, '[]'::json)
  );
END;
$$;
