ALTER TABLE public.external_agencies
  ADD COLUMN IF NOT EXISTS address text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS phone text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS email text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS imported_from text;

CREATE UNIQUE INDEX IF NOT EXISTS external_agencies_name_unique_idx
  ON public.external_agencies (lower(trim(name)));