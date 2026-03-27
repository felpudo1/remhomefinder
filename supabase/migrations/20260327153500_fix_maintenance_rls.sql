
-- ARREGLO DE PERMISOS: Permitir que sysadmin también pueda editar la configuración
-- El error 42501 (RLS) ocurría porque la política original solo mencionaba 'admin'.

DROP POLICY IF EXISTS "Admins can manage system_config" ON public.system_config;

CREATE POLICY "Admins can manage system_config" 
ON public.system_config 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
      AND (role = 'admin' OR role = 'sysadmin')
  )
);

-- Reforzamos la de lectura por si acaso
DROP POLICY IF EXISTS "Anon can read maintenance config" ON public.system_config;
CREATE POLICY "Anon can read maintenance config" 
ON public.system_config 
FOR SELECT 
TO anon, authenticated
USING (key IN ('maintenance_mode', 'maintenance_message', 'show_auth_video'));
