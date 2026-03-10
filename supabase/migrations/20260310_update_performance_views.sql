-- Primero eliminamos la función anterior por seguridad
DROP FUNCTION IF EXISTS get_agency_performance_detailed(uuid);

-- Ahora creamos la función actualizada unificando vistas
CREATE OR REPLACE FUNCTION get_agency_performance_detailed(p_agency_id UUID)
RETURNS TABLE (
    id UUID,
    title TEXT,
    status TEXT,
    listing_type TEXT,
    url TEXT,
    saves BIGINT,
    votes BIGINT,
    rating NUMERIC,
    views BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mp.id,
        mp.title,
        mp.status::TEXT,
        mp.listing_type::TEXT,
        mp.url,
        count(DISTINCT p.id) as saves,
        count(DISTINCT pr.id) as votes,
        COALESCE(avg(pr.rating), 0)::numeric as rating,
        (
            COALESCE(mp.views_count, 0) + 
            COALESCE((SELECT sum(views_count) FROM properties WHERE source_marketplace_id = mp.id), 0)
        )::BIGINT as views
    FROM marketplace_properties mp
    LEFT JOIN properties p ON p.source_marketplace_id = mp.id
    LEFT JOIN property_ratings pr ON pr.property_id = mp.id OR pr.property_id = p.id
    WHERE mp.agency_id = p_agency_id
    GROUP BY mp.id, mp.title, mp.status, mp.listing_type, mp.url, mp.views_count;
END;
$$;
