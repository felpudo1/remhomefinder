
-- Desactivar el campo de texto "descppal" del formulario de descarte
UPDATE public.status_feedback_configs 
SET is_active = false, updated_at = now()
WHERE field_id = 'descppal' AND status = 'descartado';

-- Agregar nuevos motivos rápidos de descarte
INSERT INTO public.discard_quick_reasons (label, sort_order) VALUES
  ('Muy ruidoso', 5),
  ('Lejos de servicios', 6);
