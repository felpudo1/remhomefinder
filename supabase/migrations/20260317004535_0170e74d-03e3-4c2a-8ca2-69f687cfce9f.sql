-- Create admin_keys table
CREATE TABLE public.admin_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cuenta text NOT NULL DEFAULT '',
  descripcion text NOT NULL DEFAULT '',
  texto text NOT NULL DEFAULT '',
  estado text NOT NULL DEFAULT 'valido',
  created_by uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  created_by_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  estado_updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: only admins
ALTER TABLE public.admin_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage admin_keys"
  ON public.admin_keys
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Auto-update updated_at
CREATE TRIGGER update_admin_keys_updated_at
  BEFORE UPDATE ON public.admin_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-update estado_updated_at when estado changes
CREATE OR REPLACE FUNCTION public.update_estado_updated_at()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.estado IS DISTINCT FROM OLD.estado THEN
    NEW.estado_updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_admin_keys_estado_updated_at
  BEFORE UPDATE ON public.admin_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_estado_updated_at();