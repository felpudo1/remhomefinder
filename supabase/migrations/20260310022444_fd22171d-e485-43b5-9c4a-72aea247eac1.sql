-- Add city column to properties
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS city text NOT NULL DEFAULT '';

-- Add city column to marketplace_properties
ALTER TABLE public.marketplace_properties ADD COLUMN IF NOT EXISTS city text NOT NULL DEFAULT '';

-- Recreate sync trigger function to include city
CREATE OR REPLACE FUNCTION public.sync_marketplace_to_properties()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
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