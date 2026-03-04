
CREATE OR REPLACE FUNCTION public.sync_marketplace_to_properties()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.properties
  SET
    price_rent = NEW.price_rent,
    price_expenses = NEW.price_expenses,
    total_cost = NEW.total_cost,
    currency = NEW.currency,
    title = NEW.title,
    neighborhood = NEW.neighborhood,
    sq_meters = NEW.sq_meters,
    rooms = NEW.rooms,
    images = NEW.images,
    listing_type = NEW.listing_type,
    ai_summary = NEW.description,
    url = NEW.url,
    updated_at = now()
  WHERE source_marketplace_id = NEW.id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_marketplace_to_properties
AFTER UPDATE ON public.marketplace_properties
FOR EACH ROW
EXECUTE FUNCTION public.sync_marketplace_to_properties();
