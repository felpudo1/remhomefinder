
-- Función para sincronizar el borrado de una publicación del marketplace
-- En lugar de borrar las copias de los usuarios, las marca como 'eliminado_agencia'
CREATE OR REPLACE FUNCTION public.sync_marketplace_delete_to_properties()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.properties
  SET 
    status = 'eliminado_agencia',
    updated_at = now()
  WHERE source_marketplace_id = OLD.id;

  RETURN OLD;
END;
$$;

-- Trigger que se dispara DESPUÉS de borrar una publicación del marketplace
CREATE TRIGGER trg_sync_marketplace_delete
AFTER DELETE ON public.marketplace_properties
FOR EACH ROW
EXECUTE FUNCTION public.sync_marketplace_delete_to_properties();
