-- Agregar nuevos estados al enum user_listing_status para soportar transición desde visita_coordinada
ALTER TYPE public.user_listing_status ADD VALUE IF NOT EXISTS 'firme_candidato';
ALTER TYPE public.user_listing_status ADD VALUE IF NOT EXISTS 'posible_interes';