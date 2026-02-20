-- Add 'eliminado' to the property_status enum
ALTER TYPE public.property_status ADD VALUE IF NOT EXISTS 'eliminado';

-- Add column to track who changed the status
ALTER TABLE public.properties ADD COLUMN status_changed_by UUID;
