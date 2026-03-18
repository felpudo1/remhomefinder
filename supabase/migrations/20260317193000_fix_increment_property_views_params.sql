-- Corrige el registro de vistas para marketplace y logs por propiedad.
-- - p_property_id: UUID de public.properties.id (siempre obligatorio)
-- - p_publication_id: UUID de public.agent_publications.id (opcional)
CREATE OR REPLACE FUNCTION public.increment_property_views(
  p_property_id uuid,
  p_publication_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_publication_id IS NOT NULL THEN
    UPDATE public.agent_publications
    SET views_count = COALESCE(views_count, 0) + 1
    WHERE id = p_publication_id;
  END IF;

  INSERT INTO public.property_views_log (property_id)
  VALUES (p_property_id);
END;
$$;
