-- Fix: user_listing_attachments.added_by FK falta ON DELETE CASCADE
-- Esto bloqueaba el borrado físico de usuarios que tenían attachments
ALTER TABLE public.user_listing_attachments
  DROP CONSTRAINT user_listing_attachments_added_by_fkey;

ALTER TABLE public.user_listing_attachments
  ADD CONSTRAINT user_listing_attachments_added_by_fkey
  FOREIGN KEY (added_by) REFERENCES public.profiles(user_id) ON DELETE CASCADE;