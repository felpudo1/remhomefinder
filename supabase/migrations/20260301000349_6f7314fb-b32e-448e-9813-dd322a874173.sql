
CREATE TYPE public.listing_type AS ENUM ('rent', 'sale');

ALTER TABLE public.properties 
  ADD COLUMN listing_type listing_type NOT NULL DEFAULT 'rent';

ALTER TABLE public.marketplace_properties 
  ADD COLUMN listing_type listing_type NOT NULL DEFAULT 'rent';
