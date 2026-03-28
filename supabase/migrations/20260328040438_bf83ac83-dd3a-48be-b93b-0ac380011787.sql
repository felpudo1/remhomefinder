-- Trigger function: sync attachment changes to user_listings.updated_at
CREATE OR REPLACE FUNCTION public.trg_update_listing_on_attachment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE public.user_listings SET updated_at = now() WHERE id = OLD.user_listing_id;
    RETURN OLD;
  ELSE
    UPDATE public.user_listings SET updated_at = now() WHERE id = NEW.user_listing_id;
    RETURN NEW;
  END IF;
END;
$$;

-- Trigger on user_listing_attachments
DROP TRIGGER IF EXISTS trg_attachment_updates_listing ON public.user_listing_attachments;
CREATE TRIGGER trg_attachment_updates_listing
AFTER INSERT OR UPDATE OR DELETE ON public.user_listing_attachments
FOR EACH ROW
EXECUTE FUNCTION public.trg_update_listing_on_attachment();