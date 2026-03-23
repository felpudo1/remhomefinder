-- First delete all neighborhoods (they reference cities)
DELETE FROM public.neighborhoods;

-- Then delete all cities (they reference departments)
DELETE FROM public.cities;