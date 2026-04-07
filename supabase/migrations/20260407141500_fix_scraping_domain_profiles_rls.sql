-- Fix RLS para perfiles de dominio para permitir gestión a administradores
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'scraping_domain_profiles' AND policyname = 'Admins can manage scraping profiles'
  ) THEN
    CREATE POLICY "Admins can manage scraping profiles" ON public.scraping_domain_profiles
      FOR ALL TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_roles.user_id = auth.uid()
          AND (user_roles.role = 'admin' OR user_roles.role = 'sysadmin')
        )
      );
  END IF;
END $$;
