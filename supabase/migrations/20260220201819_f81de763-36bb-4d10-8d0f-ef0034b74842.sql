
ALTER TABLE public.properties ADD COLUMN deleted_reason text DEFAULT '';
ALTER TABLE public.properties ADD COLUMN deleted_by_email text DEFAULT '';
