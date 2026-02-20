-- Enable Realtime for properties and property_comments
-- This is required for changes to be broadcasted to all connected clients.

begin;
  -- Remove existing if any (to avoid errors)
  drop publication if exists supabase_realtime;
  
  -- Create publication
  create publication supabase_realtime;
commit;

-- Add tables to the publication
alter publication supabase_realtime add table public.properties;
alter publication supabase_realtime add table public.property_comments;

-- Also set replica identity to FULL for properties to ensure all fields are available in the broadcast
-- though for a simple 'invalidate' it's not strictly necessary, it's better for future-proofing.
alter table public.properties replica identity full;
alter table public.property_comments replica identity full;
