
-- Add new enum values
ALTER TYPE public.user_listing_status ADD VALUE IF NOT EXISTS 'firme_candidato';
ALTER TYPE public.user_listing_status ADD VALUE IF NOT EXISTS 'posible_interes';

-- Property images bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('property-images', 'property-images', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Authenticated users can upload property images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'property-images');
CREATE POLICY "Anyone can view property images" ON storage.objects FOR SELECT TO public USING (bucket_id = 'property-images');
CREATE POLICY "Users can delete own property images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'property-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- user_listing_attachments table
CREATE TABLE IF NOT EXISTS public.user_listing_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_listing_id uuid NOT NULL REFERENCES public.user_listings(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  added_by uuid NOT NULL REFERENCES public.profiles(user_id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_user_listing_attachments_listing ON public.user_listing_attachments(user_listing_id);
ALTER TABLE public.user_listing_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members can view attachments" ON public.user_listing_attachments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.user_listings ul WHERE ul.id = user_listing_id AND (public.is_org_member(auth.uid(), ul.org_id) OR public.has_role(auth.uid(), 'admin'))));
CREATE POLICY "Org members can insert attachments" ON public.user_listing_attachments FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.user_listings ul WHERE ul.id = user_listing_id AND public.is_org_member(auth.uid(), ul.org_id)));
CREATE POLICY "Added by or admin can delete attachments" ON public.user_listing_attachments FOR DELETE TO authenticated USING (added_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- admin_keys table
CREATE TABLE public.admin_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cuenta text NOT NULL DEFAULT '',
  descripcion text NOT NULL DEFAULT '',
  texto text NOT NULL DEFAULT '',
  estado text NOT NULL DEFAULT 'valido',
  created_by uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  created_by_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  estado_updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage admin_keys" ON public.admin_keys FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_admin_keys_updated_at BEFORE UPDATE ON public.admin_keys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE FUNCTION public.update_estado_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$ BEGIN IF NEW.estado IS DISTINCT FROM OLD.estado THEN NEW.estado_updated_at = now(); END IF; RETURN NEW; END; $$;
CREATE TRIGGER update_admin_keys_estado_updated_at BEFORE UPDATE ON public.admin_keys FOR EACH ROW EXECUTE FUNCTION update_estado_updated_at();
ALTER TABLE public.admin_keys ADD COLUMN IF NOT EXISTS fecha date;

-- Updated handle_new_user_profile (agency creators get 'agent' role)
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_account_type text;
  v_display_name text;
  v_phone text;
  v_org_name text;
  v_org_id uuid;
  v_role public.org_role;
BEGIN
  v_account_type := NEW.raw_user_meta_data->>'account_type';
  v_display_name := COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '');
  v_phone := COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone, '');
  INSERT INTO public.profiles (user_id, display_name, phone, email, status)
  VALUES (NEW.id, v_display_name, v_phone, COALESCE(NEW.email, ''), CASE WHEN v_account_type = 'agency' THEN 'pending'::user_status ELSE 'active'::user_status END)
  ON CONFLICT (user_id) DO UPDATE SET
    display_name = CASE WHEN profiles.display_name = '' OR profiles.display_name IS NULL THEN EXCLUDED.display_name ELSE profiles.display_name END,
    phone = CASE WHEN profiles.phone = '' OR profiles.phone IS NULL THEN EXCLUDED.phone ELSE profiles.phone END,
    email = CASE WHEN profiles.email IS NULL OR profiles.email = '' THEN EXCLUDED.email ELSE profiles.email END;
  IF v_account_type = 'agency' THEN
    v_org_name := COALESCE(NEW.raw_user_meta_data->>'agency_name', v_display_name || ' Agency');
    INSERT INTO public.organizations (name, type, created_by, is_personal) VALUES (v_org_name, 'agency_team', NEW.id, false) RETURNING id INTO v_org_id;
    v_role := 'agent';
  ELSE
    INSERT INTO public.organizations (name, type, created_by, is_personal) VALUES (COALESCE(NULLIF(v_display_name, ''), 'Mi Familia'), 'family', NEW.id, true) RETURNING id INTO v_org_id;
    v_role := 'owner';
  END IF;
  INSERT INTO public.organization_members (org_id, user_id, role) VALUES (v_org_id, NEW.id, v_role);
  RETURN NEW;
END;
$function$;

-- count_property_listing_users
CREATE OR REPLACE FUNCTION public.count_property_listing_users(_property_id uuid) RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT COUNT(DISTINCT ul.added_by)::integer FROM public.user_listings ul WHERE ul.property_id = _property_id; $$;
REVOKE ALL ON FUNCTION public.count_property_listing_users(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.count_property_listing_users(uuid) TO authenticated;

-- agencymember role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'agencymember';

-- Updated handle_new_user_role
CREATE OR REPLACE FUNCTION public.handle_new_user_role() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ DECLARE v_account_type text; BEGIN v_account_type := NEW.raw_user_meta_data->>'account_type'; IF v_account_type = 'agency' THEN INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'agencymember') ON CONFLICT DO NOTHING; ELSE INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING; END IF; RETURN NEW; END; $$;

-- Fixed increment_property_views
CREATE OR REPLACE FUNCTION public.increment_property_views(p_property_id uuid, p_publication_id uuid DEFAULT NULL) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN IF p_publication_id IS NOT NULL THEN UPDATE public.agent_publications SET views_count = COALESCE(views_count, 0) + 1 WHERE id = p_publication_id; END IF; INSERT INTO public.property_views_log (property_id) VALUES (p_property_id); END; $$;

-- Fix org member policies for creator
DROP POLICY IF EXISTS "Owners can manage members" ON public.organization_members;
DROP POLICY IF EXISTS "Owners can update members" ON public.organization_members;
CREATE POLICY "Owners can manage members" ON public.organization_members FOR DELETE TO authenticated USING (is_org_owner(auth.uid(), org_id) OR EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = organization_members.org_id AND o.created_by = auth.uid()) OR user_id = auth.uid() OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners can update members" ON public.organization_members FOR UPDATE TO authenticated USING (is_org_owner(auth.uid(), org_id) OR EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = organization_members.org_id AND o.created_by = auth.uid()) OR has_role(auth.uid(), 'admin')) WITH CHECK (is_org_owner(auth.uid(), org_id) OR EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = organization_members.org_id AND o.created_by = auth.uid()) OR has_role(auth.uid(), 'admin'));

-- get_marketplace_org_names
CREATE OR REPLACE FUNCTION public.get_marketplace_org_names(_org_ids uuid[]) RETURNS TABLE(id uuid, name text) LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$ SELECT o.id, o.name FROM public.organizations o WHERE o.id = ANY(_org_ids) AND EXISTS (SELECT 1 FROM public.agent_publications ap WHERE ap.org_id = o.id AND ap.status <> 'eliminado'); $$;
REVOKE ALL ON FUNCTION public.get_marketplace_org_names(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_marketplace_org_names(uuid[]) TO authenticated;

-- scrape_usage_log
CREATE TABLE IF NOT EXISTS public.scrape_usage_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NULL REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'agent')),
  scraper text NOT NULL CHECK (scraper IN ('firecrawl', 'zenrows', 'vision')),
  channel text NOT NULL CHECK (channel IN ('url', 'image')),
  success boolean NOT NULL DEFAULT false,
  token_charged boolean NOT NULL DEFAULT true,
  source_url text NULL,
  error_message text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_scrape_usage_log_user_id ON public.scrape_usage_log (user_id);
CREATE INDEX IF NOT EXISTS idx_scrape_usage_log_created_at ON public.scrape_usage_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scrape_usage_log_role ON public.scrape_usage_log (role);
ALTER TABLE public.scrape_usage_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view scrape usage log" ON public.scrape_usage_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE VIEW public.admin_scrape_usage_by_user AS
SELECT sul.user_id, COALESCE(p.display_name, p.email, 'Usuario sin nombre') AS user_name, p.email AS user_email, COUNT(*)::integer AS total_scrapes, COUNT(*) FILTER (WHERE sul.token_charged)::integer AS total_token_charged, COUNT(*) FILTER (WHERE sul.success)::integer AS total_success, COUNT(*) FILTER (WHERE NOT sul.success)::integer AS total_failed, COUNT(*) FILTER (WHERE sul.channel = 'url')::integer AS total_url_scrapes, COUNT(*) FILTER (WHERE sul.channel = 'image')::integer AS total_image_scrapes, MAX(sul.created_at) AS last_scrape_at FROM public.scrape_usage_log sul LEFT JOIN public.profiles p ON p.user_id = sul.user_id GROUP BY sul.user_id, p.display_name, p.email;

-- Config seed
INSERT INTO public.system_config (key, value) VALUES ('marketplace_contact_tip_interval', '3') ON CONFLICT (key) DO NOTHING;

-- Fix listing quota for premium users
CREATE OR REPLACE FUNCTION public.trg_validate_listing_quota() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ DECLARE v_org_plan text; v_user_plan text; v_count integer; BEGIN SELECT plan_type INTO v_org_plan FROM public.organizations WHERE id = NEW.org_id; SELECT plan_type INTO v_user_plan FROM public.profiles WHERE user_id = NEW.added_by; IF COALESCE(v_user_plan, 'free') = 'premium' OR COALESCE(v_org_plan, 'free') = 'premium' THEN RETURN NEW; END IF; SELECT count(*) INTO v_count FROM public.user_listings WHERE org_id = NEW.org_id; IF v_count >= 5 THEN RAISE EXCEPTION 'Límite del plan gratuito alcanzado (máx 5 propiedades).'; END IF; RETURN NEW; END; $$;

-- get_marketplace_publication_contacts
CREATE OR REPLACE FUNCTION public.get_marketplace_publication_contacts(_publication_ids uuid[]) RETURNS TABLE (publication_id uuid, agent_name text, agent_phone text) LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$ SELECT ap.id AS publication_id, NULLIF(COALESCE(pr.display_name, pr.email, ''), '') AS agent_name, NULLIF(pr.phone, '') AS agent_phone FROM public.agent_publications ap JOIN public.profiles pr ON pr.user_id = ap.published_by WHERE ap.id = ANY(_publication_ids) AND ap.status <> 'eliminado'; $$;

-- meta_conseguida status
ALTER TYPE public.user_listing_status ADD VALUE IF NOT EXISTS 'meta_conseguida';

-- Anon read public system_config
DROP POLICY IF EXISTS "Anon can read video config" ON public.system_config;
CREATE POLICY "Anon can read public system_config" ON public.system_config FOR SELECT TO anon USING (key IN ('show_auth_video', 'app_brand_name', 'support_email', 'support_phone'));

-- get_publications_save_counts
CREATE OR REPLACE FUNCTION public.get_publications_save_counts(_publication_ids uuid[]) RETURNS TABLE(publication_id uuid, save_count integer) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT source_publication_id as publication_id, count(*)::integer as save_count FROM public.user_listings WHERE source_publication_id = ANY(_publication_ids) GROUP BY source_publication_id; $$;
REVOKE ALL ON FUNCTION public.get_publications_save_counts(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_publications_save_counts(uuid[]) TO authenticated;

-- Agent visibility RLS
DROP POLICY IF EXISTS "Agents can view listings for their publications" ON public.user_listings;
CREATE POLICY "Agents can view listings for their publications" ON public.user_listings FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.agent_publications ap WHERE ap.id = source_publication_id AND is_org_member(auth.uid(), ap.org_id)));
DROP POLICY IF EXISTS "Agents can view history for their publications" ON public.status_history_log;
CREATE POLICY "Agents can view history for their publications" ON public.status_history_log FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.user_listings ul JOIN public.agent_publications ap ON ap.id = ul.source_publication_id WHERE ul.id = user_listing_id AND is_org_member(auth.uid(), ap.org_id)));
DROP POLICY IF EXISTS "Agents can view attribute scores for their publications" ON public.attribute_scores;
CREATE POLICY "Agents can view attribute scores for their publications" ON public.attribute_scores FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.status_history_log slh JOIN public.user_listings ul ON ul.id = slh.user_listing_id JOIN public.agent_publications ap ON ap.id = ul.source_publication_id WHERE slh.id = history_log_id AND is_org_member(auth.uid(), ap.org_id)));
DROP POLICY IF EXISTS "Agents can view profiles for their publications" ON public.profiles;
CREATE POLICY "Agents can view profiles for their publications" ON public.profiles FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.user_listings ul JOIN public.agent_publications ap ON ap.id = ul.source_publication_id WHERE ul.added_by = profiles.user_id AND is_org_member(auth.uid(), ap.org_id)));
DROP POLICY IF EXISTS "Agents can view reviews for their publications" ON public.property_reviews;
CREATE POLICY "Agents can view reviews for their publications" ON public.property_reviews FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.agent_publications ap WHERE ap.property_id = property_reviews.property_id AND is_org_member(auth.uid(), ap.org_id)));
