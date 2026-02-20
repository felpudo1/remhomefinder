-- Agregar columnas para rastrear motivo y usuario del descarte
ALTER TABLE public.properties
  ADD COLUMN discarded_reason text DEFAULT '',
  ADD COLUMN discarded_by_email text DEFAULT '';