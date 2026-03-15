
-- Limpiar updated_by huérfanos antes de crear la FK
UPDATE public.app_settings
SET updated_by = NULL
WHERE updated_by IS NOT NULL
  AND updated_by NOT IN (SELECT user_id FROM public.profiles);

-- FK: app_settings.updated_by -> profiles.user_id (SET NULL)
ALTER TABLE public.app_settings
  ADD CONSTRAINT app_settings_updated_by_fkey
  FOREIGN KEY (updated_by) REFERENCES public.profiles(user_id) ON DELETE SET NULL;
