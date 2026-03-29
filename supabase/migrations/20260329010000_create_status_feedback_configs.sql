-- Migration: Create status_feedback_configs table for dynamic feedback configuration
-- Date: 2026-03-29
-- Purpose: Allow admin to configure feedback fields per status without code changes

-- Create enum for feedback field types
DO $$ BEGIN
    CREATE TYPE feedback_field_type AS ENUM ('rating', 'boolean', 'text', 'date');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create table for status feedback configuration
CREATE TABLE IF NOT EXISTS status_feedback_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status TEXT NOT NULL,
    field_id TEXT NOT NULL,
    field_label TEXT NOT NULL,
    field_type feedback_field_type NOT NULL DEFAULT 'rating',
    is_required BOOLEAN DEFAULT false,
    placeholder TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique field_id per status
    UNIQUE (status, field_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_status_feedback_configs_status 
ON status_feedback_configs(status, sort_order, is_active);

-- Add RLS policies
ALTER TABLE status_feedback_configs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read configs
CREATE POLICY "Allow authenticated users to read feedback configs"
ON status_feedback_configs
FOR SELECT
TO authenticated
USING (true);

-- Only admins can modify configs
CREATE POLICY "Allow admins to manage feedback configs"
ON status_feedback_configs
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin', 'sysadmin')
    )
);

-- Insert default configurations based on existing hardcoded config
INSERT INTO status_feedback_configs (status, field_id, field_label, field_type, is_required, placeholder, sort_order) VALUES
-- Contactado
('contactado', 'contact_name', 'Nombre de la persona contactada', 'text', false, 'Ej: Juan de Inmobiliaria X', 1),
('contactado', 'contacted_interest', 'Interés inicial', 'rating', true, NULL, 2),
('contactado', 'contacted_urgency', 'Urgencia de mudanza', 'rating', true, NULL, 3),

-- Visita coordinada
('visita_coordinada', 'coordinated_date', 'Fecha y hora', 'date', true, NULL, 1),
('visita_coordinada', 'coordinated_agent_response_speed', 'Velocidad de respuesta', 'rating', true, NULL, 2),
('visita_coordinada', 'coordinated_attention_quality', 'Calidad de atención inicial', 'rating', true, NULL, 3),
('visita_coordinada', 'coordinated_app_help_score', 'Ayuda de la app para este paso', 'rating', false, NULL, 4),

-- Firme candidato
('firme_candidato', 'close_price_score', 'Relación precio/producto', 'rating', false, NULL, 1),
('firme_candidato', 'close_condition_score', 'Estado general', 'rating', false, NULL, 2),
('firme_candidato', 'close_security_score', 'Seguridad', 'rating', false, NULL, 3),
('firme_candidato', 'close_guarantee_score', 'Facilidad de garantía', 'rating', false, NULL, 4),
('firme_candidato', 'close_moving_score', 'Cercanía/Mudanza', 'rating', false, NULL, 5),

-- Posible interes
('posible_interes', 'close_price_score', 'Precio', 'rating', false, NULL, 1),
('posible_interes', 'close_condition_score', 'Estado', 'rating', false, NULL, 2),
('posible_interes', 'close_security_score', 'Seguridad', 'rating', false, NULL, 3),
('posible_interes', 'close_guarantee_score', 'Garantía', 'rating', false, NULL, 4),
('posible_interes', 'close_moving_score', 'Ubicación', 'rating', false, NULL, 5),

-- Meta conseguida
('meta_conseguida', 'meta_agent_punctuality', 'Puntualidad del agente', 'rating', true, NULL, 1),
('meta_conseguida', 'meta_agent_attention', 'Atención del agente', 'rating', true, NULL, 2),
('meta_conseguida', 'meta_app_performance', 'Funcionamiento de la app', 'rating', true, NULL, 3),
('meta_conseguida', 'meta_app_support', 'Soporte de la app', 'rating', true, NULL, 4),
('meta_conseguida', 'meta_app_price', 'Precio de la app respecto al valor', 'rating', true, NULL, 5),

-- Descartado
('descartado', 'reason', 'Motivo principal', 'text', false, 'Ej: Muy ruidosa, no aceptan mascotas...', 1),
('descartado', 'discarded_overall_condition', 'Estado general', 'rating', false, NULL, 2),
('descartado', 'discarded_surroundings', 'Entorno/Barrio', 'rating', false, NULL, 3),
('descartado', 'discarded_house_security', 'Seguridad', 'rating', false, NULL, 4),
('descartado', 'discarded_expected_size', 'Tamaño (vs esperado)', 'rating', false, NULL, 5),
('descartado', 'discarded_photos_reality', 'Fotos vs Realidad', 'rating', false, NULL, 6);

-- Create function to get active configs for a status
CREATE OR REPLACE FUNCTION get_status_feedback_config(p_status TEXT)
RETURNS TABLE (
    id UUID,
    field_id TEXT,
    field_label TEXT,
    field_type feedback_field_type,
    is_required BOOLEAN,
    placeholder TEXT,
    sort_order INTEGER
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sfc.id,
        sfc.field_id,
        sfc.field_label,
        sfc.field_type,
        sfc.is_required,
        sfc.placeholder,
        sfc.sort_order
    FROM status_feedback_configs sfc
    WHERE sfc.status = p_status
    AND sfc.is_active = true
    ORDER BY sfc.sort_order;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_status_feedback_config TO authenticated;

COMMENT ON TABLE status_feedback_configs IS 'Configuración dinámica de campos de feedback por estado de propiedad';
COMMENT ON FUNCTION get_status_feedback_config IS 'Obtiene configuración activa de feedback para un estado específico';
