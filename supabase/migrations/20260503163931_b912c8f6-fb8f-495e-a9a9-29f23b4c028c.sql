ALTER TABLE public.user_listings
  ADD COLUMN IF NOT EXISTS quick_note text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS quick_note_by uuid,
  ADD COLUMN IF NOT EXISTS quick_note_at timestamp with time zone;