
-- Agregar campos de contacto a user_listings para agenda integrada
ALTER TABLE public.user_listings
  ADD COLUMN IF NOT EXISTS contact_name text,
  ADD COLUMN IF NOT EXISTS contact_phone text,
  ADD COLUMN IF NOT EXISTS contact_source text;

COMMENT ON COLUMN public.user_listings.contact_name IS 'Nombre del contacto del aviso (manual, scrape o imagen)';
COMMENT ON COLUMN public.user_listings.contact_phone IS 'Teléfono del contacto del aviso';
COMMENT ON COLUMN public.user_listings.contact_source IS 'Origen del dato: manual | scrape | image_ocr | mixed';
