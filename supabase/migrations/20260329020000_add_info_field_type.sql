-- Add 'info' field type to feedback_field_type enum
-- This migration adds support for informational text fields (no user input required)
-- Date: 2026-03-29

-- Add 'info' to the enum
ALTER TYPE feedback_field_type ADD VALUE IF NOT EXISTS 'info';

COMMENT ON TYPE feedback_field_type IS 'Tipos de campos de feedback: rating (estrellas), boolean (si/no), text (texto corto), date (fecha/hora), info (texto informativo sin input)';
