-- Etiquetas largas del modal "descartado" + pregunta costo/valor (alineado con status-feedback-config y UI +25% en GenericStatusFeedbackDialog)

UPDATE status_feedback_configs
SET
  field_label = '¿Cómo percibió la calidad estructural y conservación (Acabados, humedad, techos)?',
  updated_at = NOW()
WHERE status = 'descartado' AND field_id = 'discarded_overall_condition';

UPDATE status_feedback_configs
SET
  field_label = 'Entorno (vecindario y acceso a servicios)',
  updated_at = NOW()
WHERE status = 'descartado' AND field_id = 'discarded_surroundings';

UPDATE status_feedback_configs
SET
  field_label = 'Seguridad en la casa (rejas, alarma, cámaras)',
  updated_at = NOW()
WHERE status = 'descartado' AND field_id = 'discarded_house_security';

UPDATE status_feedback_configs
SET
  field_label = '¿Las dimensiones y la distribución son congruentes con lo publicado?',
  updated_at = NOW()
WHERE status = 'descartado' AND field_id = 'discarded_expected_size';

UPDATE status_feedback_configs
SET
  field_label = '¿Qué tan real es el tamaño físico y estado general comparado con las fotos publicadas?',
  updated_at = NOW()
WHERE status = 'descartado' AND field_id = 'discarded_photos_reality';

INSERT INTO status_feedback_configs (status, field_id, field_label, field_type, is_required, placeholder, sort_order, is_active)
SELECT
  'descartado',
  'discarded_price_value',
  '¿Es el costo acorde al valor real percibido?',
  'rating'::feedback_field_type,
  false,
  NULL,
  7,
  true
WHERE NOT EXISTS (
  SELECT 1
  FROM status_feedback_configs
  WHERE status = 'descartado' AND field_id = 'discarded_price_value' AND is_active = true
);
