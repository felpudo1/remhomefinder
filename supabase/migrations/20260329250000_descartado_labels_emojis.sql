-- Etiquetas del flujo descartado con más emojis (alineado con status-feedback-config.ts)

UPDATE status_feedback_configs
SET
  field_label = E'✍️ Motivo principal — ¿Qué te gustó 💚 y qué mejorarías 🔧?',
  placeholder = E'Ej: Barrio ruidoso 🔔, no aceptan mascotas 🐕…',
  updated_at = NOW()
WHERE status = 'descartado' AND field_id = 'reason';

UPDATE status_feedback_configs
SET
  field_label = E'🏗️ ¿Cómo percibió la calidad estructural y conservación? 🏠 (Acabados, humedad 💧, techos 🧱)',
  updated_at = NOW()
WHERE status = 'descartado' AND field_id = 'discarded_overall_condition';

UPDATE status_feedback_configs
SET
  field_label = E'📍 Entorno (vecindario 🏘️ y acceso a servicios 🚌) 🌳',
  updated_at = NOW()
WHERE status = 'descartado' AND field_id = 'discarded_surroundings';

UPDATE status_feedback_configs
SET
  field_label = E'🔒 Seguridad en la casa (rejas, alarma 🔔, cámaras 📹) 🛡️',
  updated_at = NOW()
WHERE status = 'descartado' AND field_id = 'discarded_house_security';

UPDATE status_feedback_configs
SET
  field_label = E'📐 ¿Dimensiones y distribución congruentes con lo publicado? 🗺️📏',
  updated_at = NOW()
WHERE status = 'descartado' AND field_id = 'discarded_expected_size';

UPDATE status_feedback_configs
SET
  field_label = E'🖼️ ¿Qué tan real es el estado vs. las fotos publicadas? 📷👀✨',
  updated_at = NOW()
WHERE status = 'descartado' AND field_id = 'discarded_photos_reality';

UPDATE status_feedback_configs
SET
  field_label = E'💰 ¿El costo es acorde al valor percibido? 💎⚖️',
  updated_at = NOW()
WHERE status = 'descartado' AND field_id = 'discarded_price_value';
