ALTER TABLE public.agencies 
  ADD COLUMN contact_name text NOT NULL DEFAULT '',
  ADD COLUMN contact_person_phone text NOT NULL DEFAULT '';