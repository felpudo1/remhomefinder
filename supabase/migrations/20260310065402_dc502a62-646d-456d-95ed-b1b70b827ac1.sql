
-- Re-create triggers on marketplace_properties table

-- Trigger for UPDATE (soft delete sync)
DROP TRIGGER IF EXISTS trg_sync_marketplace_to_properties ON public.marketplace_properties;
CREATE TRIGGER trg_sync_marketplace_to_properties
  AFTER UPDATE ON public.marketplace_properties
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_marketplace_to_properties();

-- Trigger for physical DELETE
DROP TRIGGER IF EXISTS trg_sync_marketplace_delete ON public.marketplace_properties;
CREATE TRIGGER trg_sync_marketplace_delete
  BEFORE DELETE ON public.marketplace_properties
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_marketplace_delete_to_properties();
