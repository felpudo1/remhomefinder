
-- Tabla para alertas del sistema (fallback de API keys, errores críticos, etc.)
CREATE TABLE public.system_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden ver las alertas
CREATE POLICY "Admins can view system alerts"
ON public.system_alerts
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Solo admins pueden marcar como leída
CREATE POLICY "Admins can update system alerts"
ON public.system_alerts
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Permitir inserts desde service role (Edge Functions)
-- No se necesita política de INSERT para service_role ya que bypasea RLS
