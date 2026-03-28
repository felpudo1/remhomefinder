
-- MIGRACIÓN: CARGA DELEGADA (MODO DIOS)
-- Permite a los administradores crear propiedades y listados en nombre de otros usuarios.

-- 1. Función auxiliar para verificar si el usuario es Admin o SysAdmin
CREATE OR REPLACE FUNCTION public.is_admin_or_sysadmin(target_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = target_user_id 
      AND role IN ('admin', 'sysadmin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Actualizar políticas de RLS para 'properties'
-- Permitir INSERT a admins sin importar el created_by
DROP POLICY IF EXISTS "Users can create properties" ON public.properties;
CREATE POLICY "Users can create properties" 
ON public.properties 
FOR INSERT 
TO authenticated 
WITH CHECK (
  auth.uid() = created_by OR 
  public.is_admin_or_sysadmin(auth.uid())
);

-- 3. Actualizar políticas de RLS para 'user_listings'
-- Permitir INSERT a admins sin importar el added_by u org_id
DROP POLICY IF EXISTS "Users can create their own listings" ON public.user_listings;
CREATE POLICY "Users can create their own listings" 
ON public.user_listings 
FOR INSERT 
TO authenticated 
WITH CHECK (
  auth.uid() = added_by OR 
  public.is_admin_or_sysadmin(auth.uid())
);

-- 4. Actualizar políticas de RLS para 'user_listing_attachments'
DROP POLICY IF EXISTS "Users can add attachments to their own listings" ON public.user_listing_attachments;
CREATE POLICY "Users can add attachments to their own listings" 
ON public.user_listing_attachments 
FOR INSERT 
TO authenticated 
WITH CHECK (
  auth.uid() = added_by OR 
  public.is_admin_or_sysadmin(auth.uid())
);

-- 5. Política para que los admins puedan ver a TODOS los usuarios (necesario para el buscador de agentes)
-- (Normalmente ya pueden, pero nos aseguramos)
DROP POLICY IF EXISTS "Profiles are viewable by anyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by anyone" ON public.profiles FOR SELECT USING (true);
