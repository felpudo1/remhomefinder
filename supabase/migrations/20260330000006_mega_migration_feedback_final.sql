-- Mega Migration Fix: Estrategia Global de Feedback Senior Sales
-- Date: 2026-03-30
-- Fix: Cambio display_order por sort_order y sincronización de field_ids existentes

-- CONTACTADO
INSERT INTO status_feedback_configs (status, field_id, field_label, field_type, is_required, sort_order)
VALUES 
  ('contactado', 'contacted_interest', E'💰 ¿Sentís que el precio está en tu \'punto dulce\' o hay margen para negociar? ⚖️', 'rating', true, 1),
  ('contactado', 'contacted_urgency', E'🏠 ¿Qué tanto te urge mudarte a este nuevo hogar? 🚀', 'rating', true, 2)
ON CONFLICT (status, field_id) DO UPDATE SET
  field_label = EXCLUDED.field_label,
  is_required = true,
  updated_at = NOW();

-- VISITA COORDINADA
INSERT INTO status_feedback_configs (status, field_id, field_label, field_type, is_required, sort_order)
VALUES 
  ('visita_coordinada', 'coordinated_attention_quality', E'✨ ¿Cómo fue la atención del agente en persona? 🤝', 'rating', true, 1),
  ('visita_coordinada', 'coordinated_agent_response_speed', E'⚡ ¿El agente respondió a todas tus dudas técnicas? 💎', 'rating', true, 2),
  ('visita_coordinada', 'coordinated_app_help_score', E'🚪 ¿La propiedad fue fácil de encontrar y acceder? 📍', 'rating', true, 3)
ON CONFLICT (status, field_id) DO UPDATE SET
  field_label = EXCLUDED.field_label,
  is_required = true,
  updated_at = NOW();

-- POSIBLE INTERÉS (Examen del Producto)
INSERT INTO status_feedback_configs (status, field_id, field_label, field_type, is_required, sort_order)
VALUES 
  ('posible_interes', 'close_condition_score', E'🏗️ ¿Cómo viste la salud estructural (acabados, humedad, techos)? 🧱', 'rating', true, 1),
  ('posible_interes', 'close_moving_score', E'📐 ¿Sentís que los espacios rinden como imaginabas? 📏', 'rating', true, 2),
  ('posible_interes', 'pos_int_ranking', E'📊 En tu ranking personal de visitas... ¿en qué lugar ponés esta casa? 🏆', 'rating', true, 3)
ON CONFLICT (status, field_id) DO UPDATE SET
  field_label = EXCLUDED.field_label,
  is_required = true,
  updated_at = NOW();

-- FIRME CANDIDATO (Datos de Cierre)
INSERT INTO status_feedback_configs (status, field_id, field_label, field_type, is_required, sort_order)
VALUES 
  ('firme_candidato', 'alta_prior_timeline', E'⏳ ¿Qué tan pronto necesitarías estar viviendo en tu nuevo hogar? 🚀', 'rating', true, 1),
  ('firme_candidato', 'close_guarantee_score', E'📝 ¿Ya tenés resuelta la garantía o el crédito hipotecario? 🛡️', 'rating', true, 2),
  ('firme_candidato', 'alta_prior_bloqueadores', E'⛓️ ¿Tenés algún otro proceso (venta, etc) que condicione este paso? 📝', 'rating', true, 3)
ON CONFLICT (status, field_id) DO UPDATE SET
  field_label = EXCLUDED.field_label,
  is_required = true,
  updated_at = NOW();

-- META CONSEGUIDA (Leads y Éxito)
INSERT INTO status_feedback_configs (status, field_id, field_label, field_type, is_required, sort_order)
VALUES 
  ('meta_conseguida', 'meta_mudanza_lead', E'📦 ¿Ya organizaste la mudanza o te gustaría un beneficio de nuestros partners? 🚚', 'rating', true, 1),
  ('meta_conseguida', 'meta_seguros_sutil', E'🛡️ ¿Ya contás con un seguro para tu nueva casa? 🔐', 'rating', true, 2),
  ('meta_conseguida', 'meta_app_performance', E'🚀 ¿Nuestra App te ayudó a acelerar el proceso de encontrar tu lugar? ⚡', 'rating', true, 3),
  ('meta_conseguida', 'meta_agent_attention', E'🏢 En general... ¿cómo calificarías la atención de las inmobiliarias? 📞', 'rating', true, 4),
  ('meta_conseguida', 'meta_industry_nps', E'✨ ¿Qué tanto nos recomendarías a tus amigos? 📣', 'rating', true, 5),
  ('meta_conseguida', 'meta_comment', E'✍️ ¡Felicidades! ¿Alguna sugerencia final para mejorar el servicio? 📝', 'text', false, 6)
ON CONFLICT (status, field_id) DO UPDATE SET
  field_label = EXCLUDED.field_label,
  field_type = EXCLUDED.field_type,
  is_required = EXCLUDED.is_required,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- DESCARTADO
UPDATE status_feedback_configs
SET
  field_label = E'✍️ ¿Qué fue lo que más \'ruido\' te hizo para no elegirla? 📝',
  is_required = true,
  updated_at = NOW()
WHERE status = 'descartado' AND field_id = 'reason';
