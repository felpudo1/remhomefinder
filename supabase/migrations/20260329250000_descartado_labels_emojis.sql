-- Descartado: un emoji al inicio de cada etiqueta (texto legible, sin repetir iconos)

UPDATE status_feedback_configs
SET
  field_label = E'✍️ Motivo principal: ¿qué te gustó y qué mejorarías?',
  placeholder = E'Ej: muy ruidosa, no aceptan mascotas, lejos del trabajo…',
  updated_at = NOW()
WHERE status = 'descartado' AND field_id = 'reason';

UPDATE status_feedback_configs
SET
  field_label = E'🏗️ Calidad estructural y conservación (acabados, humedad, techos)',
  updated_at = NOW()
WHERE status = 'descartado' AND field_id = 'discarded_overall_condition';

UPDATE status_feedback_configs
SET
  field_label = E'📍 Entorno (vecindario y acceso a servicios)',
  updated_at = NOW()
WHERE status = 'descartado' AND field_id = 'discarded_surroundings';

UPDATE status_feedback_configs
SET
  field_label = E'🔒 Seguridad en la casa (rejas, alarma, cámaras)',
  updated_at = NOW()
WHERE status = 'descartado' AND field_id = 'discarded_house_security';

UPDATE status_feedback_configs
SET
  field_label = E'📐 Dimensiones y distribución vs. lo publicado',
  updated_at = NOW()
WHERE status = 'descartado' AND field_id = 'discarded_expected_size';

UPDATE status_feedback_configs
SET
  field_label = E'🖼️ Estado real vs. fotos publicadas',
  updated_at = NOW()
WHERE status = 'descartado' AND field_id = 'discarded_photos_reality';

UPDATE status_feedback_configs
SET
  field_label = E'💰 Costo vs. valor percibido',
  updated_at = NOW()
WHERE status = 'descartado' AND field_id = 'discarded_price_value';
