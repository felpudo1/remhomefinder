
ALTER TABLE public.discovered_links
  DROP CONSTRAINT IF EXISTS discovered_links_property_id_fkey,
  ADD CONSTRAINT discovered_links_property_id_fkey
    FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE SET NULL;
