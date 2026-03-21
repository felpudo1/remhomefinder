-- 1. Listados (user_listings)
DROP POLICY IF EXISTS "Agents can view listings for their publications" ON public.user_listings;
CREATE POLICY "Agents can view listings for their publications"
ON public.user_listings FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.agent_publications ap
    WHERE ap.id = source_publication_id
    AND is_org_member(auth.uid(), ap.org_id)
  )
);

-- 2. Historial (status_history_log)
DROP POLICY IF EXISTS "Agents can view history for their publications" ON public.status_history_log;
CREATE POLICY "Agents can view history for their publications"
ON public.status_history_log FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_listings ul
    JOIN public.agent_publications ap ON ap.id = ul.source_publication_id
    WHERE ul.id = user_listing_id
    AND is_org_member(auth.uid(), ap.org_id)
  )
);

-- 3. Atributos (attribute_scores)
DROP POLICY IF EXISTS "Agents can view attribute scores for their publications" ON public.attribute_scores;
CREATE POLICY "Agents can view attribute scores for their publications"
ON public.attribute_scores FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.status_history_log slh
    JOIN public.user_listings ul ON ul.id = slh.user_listing_id
    JOIN public.agent_publications ap ON ap.id = ul.source_publication_id
    WHERE slh.id = history_log_id
    AND is_org_member(auth.uid(), ap.org_id)
  )
);

-- 4. Perfiles (profiles) - CORREGIDO: use ul.added_by en lugar de user_id
DROP POLICY IF EXISTS "Agents can view profiles for their publications" ON public.profiles;
CREATE POLICY "Agents can view profiles for their publications"
ON public.profiles FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_listings ul
    JOIN public.agent_publications ap ON ap.id = ul.source_publication_id
    WHERE ul.added_by = profiles.user_id
    AND is_org_member(auth.uid(), ap.org_id)
  )
);

-- 5. Reseñas (property_reviews)
DROP POLICY IF EXISTS "Agents can view reviews for their publications" ON public.property_reviews;
CREATE POLICY "Agents can view reviews for their publications"
ON public.property_reviews FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.agent_publications ap
    WHERE ap.property_id = property_reviews.property_id
    AND is_org_member(auth.uid(), ap.org_id)
  )
);
