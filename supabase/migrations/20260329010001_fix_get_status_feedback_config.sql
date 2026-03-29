-- Fix: Update get_status_feedback_config to return id column
-- This is needed for the admin panel to properly edit/delete fields
-- Date: 2026-03-29

DROP FUNCTION IF EXISTS get_status_feedback_config(TEXT);

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

COMMENT ON FUNCTION get_status_feedback_config IS 'Obtiene configuración activa de feedback para un estado específico (incluye id para edición)';
