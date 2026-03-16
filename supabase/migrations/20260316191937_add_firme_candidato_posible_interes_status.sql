-- Agregar nuevos estados al enum user_listing_status (no invasivo: solo ADD VALUE)
-- Los estados visitado y a_analizar se mantienen en el enum para datos existentes,
-- pero ya no se ofrecen en la UI para actualización.
ALTER TYPE public.user_listing_status ADD VALUE IF NOT EXISTS 'firme_candidato';
ALTER TYPE public.user_listing_status ADD VALUE IF NOT EXISTS 'posible_interes';
