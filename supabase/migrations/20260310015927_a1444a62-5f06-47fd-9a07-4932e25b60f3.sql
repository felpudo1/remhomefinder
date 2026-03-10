ALTER TABLE public.properties
  ADD COLUMN ref text NOT NULL DEFAULT '',
  ADD COLUMN details text NOT NULL DEFAULT '';