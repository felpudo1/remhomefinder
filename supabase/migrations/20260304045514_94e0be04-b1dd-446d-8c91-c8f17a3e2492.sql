
-- Paso 1: Agregar columna marketplace_status a properties
ALTER TABLE public.properties
ADD COLUMN marketplace_status marketplace_property_status DEFAULT NULL;

-- Paso 2: Actualizar el trigger para sincronizar marketplace_status
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
    marketplace_status = NEW.status,
    updated_at = now()
  WHERE source_marketplace_id = NEW.id;

  RETURN NEW;
END;
$$;

-- Paso 3: Backfill filas existentes
UPDATE public.properties p
SET marketplace_status = mp.status
FROM public.marketplace_properties mp
WHERE p.source_marketplace_id = mp.id;
