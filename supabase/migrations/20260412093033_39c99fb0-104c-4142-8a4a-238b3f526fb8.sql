
-- Tabla para agencias del landing
CREATE TABLE public.landing_agencies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  logo_url text NOT NULL DEFAULT '',
  carousel_row integer NOT NULL DEFAULT 1 CHECK (carousel_row IN (1, 2)),
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.landing_agencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active landing agencies"
  ON public.landing_agencies FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Admins can manage landing agencies"
  ON public.landing_agencies FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para updated_at
CREATE TRIGGER update_landing_agencies_updated_at
  BEFORE UPDATE ON public.landing_agencies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Validar máximo 20 por carousel_row
CREATE OR REPLACE FUNCTION public.trg_validate_landing_agency_limit()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT count(*) INTO v_count
  FROM public.landing_agencies
  WHERE carousel_row = NEW.carousel_row AND is_active = true;

  IF TG_OP = 'INSERT' AND v_count >= 20 THEN
    RAISE EXCEPTION 'Máximo 20 agencias por carrusel alcanzado.';
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.carousel_row IS DISTINCT FROM OLD.carousel_row AND v_count >= 20 THEN
    RAISE EXCEPTION 'Máximo 20 agencias por carrusel alcanzado.';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_landing_agency_limit
  BEFORE INSERT OR UPDATE ON public.landing_agencies
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_validate_landing_agency_limit();

-- Bucket para logos del landing
INSERT INTO storage.buckets (id, name, public)
VALUES ('landing-logos', 'landing-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Public can view landing logos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'landing-logos');

CREATE POLICY "Admins can upload landing logos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'landing-logos' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update landing logos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'landing-logos' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete landing logos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'landing-logos' AND has_role(auth.uid(), 'admin'::app_role));
