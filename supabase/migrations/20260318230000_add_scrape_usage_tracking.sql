-- Log de consumo de scraping/IA por usuario (incluye intentos sin publicación final).
CREATE TABLE IF NOT EXISTS public.scrape_usage_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NULL REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'agent')),
  scraper text NOT NULL CHECK (scraper IN ('firecrawl', 'zenrows', 'vision')),
  channel text NOT NULL CHECK (channel IN ('url', 'image')),
  success boolean NOT NULL DEFAULT false,
  token_charged boolean NOT NULL DEFAULT true,
  source_url text NULL,
  error_message text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scrape_usage_log_user_id ON public.scrape_usage_log (user_id);
CREATE INDEX IF NOT EXISTS idx_scrape_usage_log_created_at ON public.scrape_usage_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scrape_usage_log_role ON public.scrape_usage_log (role);

ALTER TABLE public.scrape_usage_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view scrape usage log" ON public.scrape_usage_log;
CREATE POLICY "Admins can view scrape usage log"
ON public.scrape_usage_log
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Vista agregada para panel admin: cantidad de scrapes, éxito/fallo y consumo de tokens por usuario.
CREATE OR REPLACE VIEW public.admin_scrape_usage_by_user AS
SELECT
  sul.user_id,
  COALESCE(p.display_name, p.email, 'Usuario sin nombre') AS user_name,
  p.email AS user_email,
  COUNT(*)::integer AS total_scrapes,
  COUNT(*) FILTER (WHERE sul.token_charged)::integer AS total_token_charged,
  COUNT(*) FILTER (WHERE sul.success)::integer AS total_success,
  COUNT(*) FILTER (WHERE NOT sul.success)::integer AS total_failed,
  COUNT(*) FILTER (WHERE sul.channel = 'url')::integer AS total_url_scrapes,
  COUNT(*) FILTER (WHERE sul.channel = 'image')::integer AS total_image_scrapes,
  MAX(sul.created_at) AS last_scrape_at
FROM public.scrape_usage_log sul
LEFT JOIN public.profiles p ON p.user_id = sul.user_id
GROUP BY sul.user_id, p.display_name, p.email;
