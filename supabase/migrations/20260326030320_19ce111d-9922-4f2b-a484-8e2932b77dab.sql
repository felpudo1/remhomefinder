-- Create missing user_listing_comment_reads table referenced by get_user_listings_page RPC
CREATE TABLE IF NOT EXISTS public.user_listing_comment_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  user_listing_id uuid NOT NULL REFERENCES public.user_listings(id) ON DELETE CASCADE,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, user_listing_id)
);

ALTER TABLE public.user_listing_comment_reads ENABLE ROW LEVEL SECURITY;

-- Users can view their own reads
CREATE POLICY "Users can view own reads"
  ON public.user_listing_comment_reads FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can upsert their own reads
CREATE POLICY "Users can upsert own reads"
  ON public.user_listing_comment_reads FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own reads"
  ON public.user_listing_comment_reads FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Index for fast lookups in the RPC
CREATE INDEX idx_comment_reads_user_listing ON public.user_listing_comment_reads (user_id, user_listing_id);