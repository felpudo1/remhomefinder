
-- Now we can use the new enum values
ALTER TABLE public.properties ALTER COLUMN status SET DEFAULT 'ingresado'::property_status;
