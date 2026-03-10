CREATE OR REPLACE FUNCTION public.sync_marketplace_to_properties()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- If the marketplace property is soft-deleted, mark all user copies as 'eliminado_agencia'
  IF NEW.status = 'deleted' AND (OLD.status IS DISTINCT FROM 'deleted') THEN
    UPDATE public.properties
    SET
      status = 'eliminado_agencia',
      marketplace_status = NEW.status,
      updated_at = now()
    WHERE source_marketplace_id = NEW.id;

    RETURN NEW;
  END IF;

  -- Normal sync for other updates
  UPDATE public.properties
  SET
    price_rent = NEW.price_rent,
    price_expenses = NEW.price_expenses,
    total_cost = NEW.total_cost,
    currency = NEW.currency,
    title = NEW.title,
    neighborhood = NEW.neighborhood,
    city = NEW.city,
    sq_meters = NEW.sq_meters,
    rooms = NEW.rooms,
    images = NEW.images,
    listing_type = NEW.listing_type,
    ai_summary = NEW.description,
    url = NEW.url,
    marketplace_status = NEW.status,
    updated_at = now()
  WHERE source_marketplace_id = NEW.id;

  RETURN NEW;
END;
$function$;