
-- Limpiar referred_by_id huérfanos antes de crear la FK
UPDATE public.profiles 
SET referred_by_id = NULL 
WHERE referred_by_id IS NOT NULL 
  AND referred_by_id NOT IN (SELECT user_id FROM public.profiles);

-- Ahora sí, crear todas las FKs

-- UNIQUE en profiles.user_id
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);

-- FK: user_roles.user_id -> profiles.user_id
ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- FK: organization_members.user_id -> profiles.user_id
ALTER TABLE public.organization_members
  ADD CONSTRAINT organization_members_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- FK: properties.created_by -> profiles.user_id
ALTER TABLE public.properties
  ADD CONSTRAINT properties_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- FK: user_listings.added_by -> profiles.user_id
ALTER TABLE public.user_listings
  ADD CONSTRAINT user_listings_added_by_fkey
  FOREIGN KEY (added_by) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- FK: agent_publications.published_by -> profiles.user_id
ALTER TABLE public.agent_publications
  ADD CONSTRAINT agent_publications_published_by_fkey
  FOREIGN KEY (published_by) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- FK: property_reviews.user_id -> profiles.user_id
ALTER TABLE public.property_reviews
  ADD CONSTRAINT property_reviews_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- FK: family_comments.user_id -> profiles.user_id
ALTER TABLE public.family_comments
  ADD CONSTRAINT family_comments_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- FK: agency_comments.user_id -> profiles.user_id
ALTER TABLE public.agency_comments
  ADD CONSTRAINT agency_comments_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- FK: status_history_log.changed_by -> profiles.user_id
ALTER TABLE public.status_history_log
  ADD CONSTRAINT status_history_log_changed_by_fkey
  FOREIGN KEY (changed_by) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- FK: partner_leads.user_id -> profiles.user_id
ALTER TABLE public.partner_leads
  ADD CONSTRAINT partner_leads_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- FK: profiles.referred_by_id -> profiles.user_id (auto-referencia, SET NULL)
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_referred_by_id_fkey
  FOREIGN KEY (referred_by_id) REFERENCES public.profiles(user_id) ON DELETE SET NULL;
