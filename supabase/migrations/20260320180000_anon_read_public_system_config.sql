-- Permitir que usuarios anónimos lean claves de system_config usadas en páginas públicas
-- (login, recuperar contraseña, footer, legales). Sin esto, RLS oculta la fila y el cliente
-- cae en el default del código ("HomeFinder") aunque en BD esté "homeFinder.uy".

DROP POLICY IF EXISTS "Anon can read video config" ON public.system_config;

CREATE POLICY "Anon can read public system_config" ON public.system_config
  FOR SELECT TO anon
  USING (
    key IN (
      'show_auth_video',
      'app_brand_name',
      'support_email',
      'support_phone'
    )
  );
