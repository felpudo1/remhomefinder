-- Acelera COUNT / listados por referente (referred_by_id); la columna es nullable y muchas filas son NULL.
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by_id
  ON public.profiles (referred_by_id)
  WHERE referred_by_id IS NOT NULL;
