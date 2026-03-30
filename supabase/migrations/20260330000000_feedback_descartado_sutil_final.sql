-- Migration: Actualizar feedback de descarte con etiquetas sutiles y obligatorias
-- Date: 2026-03-30
-- Focus: "El negativo" (detectar problemas de forma sutil)

UPDATE status_feedback_configs
SET
  field_label = E'✍️ ¿Qué fue lo que más \'ruido\' te hizo y qué sentís que le falta para ser la elegida? 📝',
  field_type = 'text',
  is_required = true,
  placeholder = E'Contanos qué mejorarías...',
  updated_at = NOW()
WHERE status = 'descartado' AND field_id = 'reason';

UPDATE status_feedback_configs
SET
  field_label = E'🏗️ ¿Cómo viste la \'salud\' estructural? (humedad, techos, terminaciones) 🧱',
  is_required = true,
  updated_at = NOW()
WHERE status = 'descartado' AND field_id = 'discarded_overall_condition';

UPDATE status_feedback_configs
SET
  field_label = E'📍 ¿Qué tal el \'feeling\' del barrio y su conectividad? 🚌',
  is_required = true,
  updated_at = NOW()
WHERE status = 'descartado' AND field_id = 'discarded_surroundings';

UPDATE status_feedback_configs
SET
  field_label = E'🔒 ¿Qué tanta tranquilidad te transmite la seguridad del lugar? 🛡️',
  is_required = true,
  updated_at = NOW()
WHERE status = 'descartado' AND field_id = 'discarded_house_security';

UPDATE status_feedback_configs
SET
  field_label = E'📐 ¿Sentiste que los espacios rinden como imaginabas? 📏',
  is_required = true,
  updated_at = NOW()
WHERE status = 'descartado' AND field_id = 'discarded_expected_size';

UPDATE status_feedback_configs
SET
  field_label = E'🖼️ Honestamente... ¿qué tanto se parece a la realidad lo que viste en las fotos? 👀',
  is_required = true,
  updated_at = NOW()
WHERE status = 'descartado' AND field_id = 'discarded_photos_reality';

UPDATE status_feedback_configs
SET
  field_label = E'💰 ¿Sentís que el precio le hace justicia a lo que ofrece hoy la propiedad? ⚖️',
  is_required = true,
  updated_at = NOW()
WHERE status = 'descartado' AND field_id = 'discarded_price_value';
