-- Cuenta cuántos usuarios guardaron cada publicación de una lista dada.
-- SECURITY DEFINER permite saltar el RLS de user_listings para esta métrica de conteo anónima.
CREATE OR REPLACE FUNCTION public.get_publications_save_counts(_publication_ids uuid[])
RETURNS TABLE(publication_id uuid, save_count integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    source_publication_id as publication_id, 
    count(*)::integer as save_count
  FROM public.user_listings
  WHERE source_publication_id = ANY(_publication_ids)
  GROUP BY source_publication_id;
$$;

-- Permisos
REVOKE ALL ON FUNCTION public.get_publications_save_counts(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_publications_save_counts(uuid[]) TO authenticated;
