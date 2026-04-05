-- Crear tabla de detalles manuales para el admin
CREATE TABLE IF NOT EXISTS public.details_description (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text,
  category text DEFAULT 'General',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.details_description ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
CREATE POLICY "Admins can manage details_description" 
  ON public.details_description FOR ALL 
  TO authenticated 
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Agents and Admins can view details_description" 
  ON public.details_description FOR SELECT 
  TO authenticated 
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role) OR 
    public.has_role(auth.uid(), 'agency'::public.app_role) OR
    public.has_role(auth.uid(), 'agencymember'::public.app_role)
  );

-- Insertar un registro de ejemplo para que JP vea cómo funciona
INSERT INTO public.details_description (title, content, category) 
VALUES ('Guía de Scrapeo', 'Este es un ejemplo de contenido manual que podés editar desde Supabase.', 'Documentación');
