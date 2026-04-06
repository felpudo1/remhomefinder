CREATE TABLE public.discard_quick_reasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.discard_quick_reasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth can read discard_quick_reasons"
  ON public.discard_quick_reasons
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage discard_quick_reasons"
  ON public.discard_quick_reasons
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.discard_quick_reasons (label, sort_order) VALUES
  ('Incompatible garantía', 1),
  ('No mascotas', 2),
  ('Sin lugar moto', 3),
  ('Sin lugar auto', 4);