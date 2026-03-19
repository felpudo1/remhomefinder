-- Expone nombre de organización para cards del marketplace sin abrir SELECT global en organizations.
-- Solo devuelve organizaciones que tengan publicaciones no eliminadas.
CREATE OR REPLACE FUNCTION public.get_marketplace_org_names(_org_ids uuid[])
RETURNS TABLE(id uuid, name text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.id, o.name
  FROM public.organizations o
  WHERE o.id = ANY(_org_ids)
    AND EXISTS (
      SELECT 1
      FROM public.agent_publications ap
      WHERE ap.org_id = o.id
        AND ap.status <> 'eliminado'
    );
$$;

REVOKE ALL ON FUNCTION public.get_marketplace_org_names(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_marketplace_org_names(uuid[]) TO authenticated;
