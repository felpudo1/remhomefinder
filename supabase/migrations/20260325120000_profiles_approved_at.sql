-- Fecha en que el perfil pasó a activo (aprobación de agente / cuenta)

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS approved_at timestamptz;

COMMENT ON COLUMN public.profiles.approved_at IS 'Momento en que la cuenta pasó a estado active (aprobación).';

-- Rellenar filas ya activas (mejor estimación disponible sin historial)
UPDATE public.profiles
SET approved_at = updated_at
WHERE status = 'active'::public.user_status
  AND approved_at IS NULL;

CREATE OR REPLACE FUNCTION public.trg_profiles_set_approved_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'active'::public.user_status THEN
    IF TG_OP = 'INSERT' THEN
      IF NEW.approved_at IS NULL THEN
        NEW.approved_at := now();
      END IF;
    ELSIF OLD.status IS DISTINCT FROM 'active'::public.user_status THEN
      IF NEW.approved_at IS NULL THEN
        NEW.approved_at := now();
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_set_approved_at ON public.profiles;
CREATE TRIGGER trg_profiles_set_approved_at
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.trg_profiles_set_approved_at();
