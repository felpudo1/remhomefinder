-- Función para obtener el rendimiento detallado evadiendo RLS de 'properties'
CREATE OR REPLACE FUNCTION get_agency_performance_detailed(p_agency_id UUID)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_performance json;
BEGIN
  -- Verificar acceso
  IF NOT EXISTS (
    SELECT 1 FROM agencies a
    LEFT JOIN agency_members am ON a.id = am.agency_id
    WHERE a.id = p_agency_id AND (a.created_by = auth.uid() OR am.user_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO v_performance
  FROM (
    SELECT 
        mp.id,
        mp.title,
        mp.status,
        mp.listing_type,
        mp.url,
        count(DISTINCT p.id) as saves,
        count(DISTINCT pr.id) as votes,
        COALESCE(avg(pr.rating), 0)::numeric as rating
    FROM marketplace_properties mp
    LEFT JOIN properties p ON p.source_marketplace_id = mp.id
    LEFT JOIN property_ratings pr ON (pr.property_id = p.id OR pr.property_id = mp.id)
    WHERE mp.agency_id = p_agency_id
    GROUP BY mp.id, mp.title, mp.status, mp.listing_type, mp.url
  ) t;

  RETURN v_performance;
END;
$$;
