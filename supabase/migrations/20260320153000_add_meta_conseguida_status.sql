-- Agrega un nuevo estado final para user_listings:
-- meta_conseguida (manteniendo interesados y alta prioridad como estados separados).
ALTER TYPE public.user_listing_status ADD VALUE IF NOT EXISTS 'meta_conseguida';
