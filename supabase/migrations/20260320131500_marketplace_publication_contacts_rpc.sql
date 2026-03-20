-- Exponer contacto mínimo del agente publicador para avisos de marketplace
-- sin abrir lectura general de profiles.
CREATE OR REPLACE FUNCTION public.get_marketplace_publication_contacts(_publication_ids uuid[])
RETURNS TABLE (
  publication_id uuid,
  agent_name text,
  agent_phone text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ap.id AS publication_id,
    NULLIF(COALESCE(pr.display_name, pr.email, ''), '') AS agent_name,
    NULLIF(pr.phone, '') AS agent_phone
  FROM public.agent_publications ap
  JOIN public.profiles pr
    ON pr.user_id = ap.published_by
  WHERE ap.id = ANY(_publication_ids)
    AND ap.status <> 'eliminado';
$$;
