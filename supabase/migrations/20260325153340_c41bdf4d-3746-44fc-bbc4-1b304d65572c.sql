
-- PASO 1: Limpiar todo el esquema viejo
DROP TABLE IF EXISTS public.agency_shared_properties CASCADE;
DROP TABLE IF EXISTS public.property_views_log CASCADE;
DROP TABLE IF EXISTS public.property_ratings CASCADE;
DROP TABLE IF EXISTS public.property_comments CASCADE;
DROP TABLE IF EXISTS public.agency_members CASCADE;
DROP TABLE IF EXISTS public.group_members CASCADE;
DROP TABLE IF EXISTS public.marketplace_properties CASCADE;
DROP TABLE IF EXISTS public.properties CASCADE;
DROP TABLE IF EXISTS public.agencies CASCADE;
DROP TABLE IF EXISTS public.groups CASCADE;
DROP TABLE IF EXISTS public.system_config CASCADE;
DROP TABLE IF EXISTS public.app_settings CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

DROP FUNCTION IF EXISTS public.has_role CASCADE;
DROP FUNCTION IF EXISTS public.is_group_member CASCADE;
DROP FUNCTION IF EXISTS public.is_group_owner CASCADE;
DROP FUNCTION IF EXISTS public.find_group_by_invite_code CASCADE;
DROP FUNCTION IF EXISTS public.admin_update_profile_status CASCADE;
DROP FUNCTION IF EXISTS public.admin_physical_delete_user CASCADE;
DROP FUNCTION IF EXISTS public.increment_property_views CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_profile CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_role CASCADE;
DROP FUNCTION IF EXISTS public.handle_user_email_sync CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column CASCADE;
DROP FUNCTION IF EXISTS public.sync_marketplace_to_properties CASCADE;
DROP FUNCTION IF EXISTS public.sync_marketplace_delete_to_properties CASCADE;
DROP FUNCTION IF EXISTS public.assign_agency_role_on_create CASCADE;
DROP FUNCTION IF EXISTS public.get_agency_dashboard_stats CASCADE;
DROP FUNCTION IF EXISTS public.get_agency_performance_detailed CASCADE;

DROP TYPE IF EXISTS public.app_role CASCADE;
DROP TYPE IF EXISTS public.user_status CASCADE;
DROP TYPE IF EXISTS public.listing_type CASCADE;
DROP TYPE IF EXISTS public.marketplace_property_status CASCADE;
DROP TYPE IF EXISTS public.property_status CASCADE;
DROP TYPE IF EXISTS public.agency_status CASCADE;

-- ENUMS
CREATE TYPE public.org_type AS ENUM ('family', 'agency_team');
CREATE TYPE public.org_role AS ENUM ('owner', 'agent', 'member', 'system_admin_delegate');
CREATE TYPE public.app_role AS ENUM ('admin', 'agency', 'user');
CREATE TYPE public.user_status AS ENUM ('active', 'pending', 'suspended', 'rejected');
CREATE TYPE public.listing_type AS ENUM ('rent', 'sale');
CREATE TYPE public.currency_code AS ENUM ('USD', 'ARS', 'UYU', 'CLP');
CREATE TYPE public.agent_pub_status AS ENUM ('disponible', 'reservado', 'vendido', 'alquilado', 'eliminado', 'pausado');
CREATE TYPE public.user_listing_status AS ENUM ('ingresado', 'contactado', 'visita_coordinada', 'visitado', 'a_analizar', 'descartado');

-- TABLES
CREATE TABLE public.profiles (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid UNIQUE NOT NULL, display_name text NOT NULL DEFAULT '', email text DEFAULT '', phone text NOT NULL DEFAULT '', avatar_url text NOT NULL DEFAULT '', status public.user_status NOT NULL DEFAULT 'active', plan_type text DEFAULT 'free', referred_by_id uuid, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.user_roles (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, role public.app_role NOT NULL DEFAULT 'user', created_at timestamptz NOT NULL DEFAULT now(), UNIQUE (user_id, role));
CREATE TABLE public.organizations (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, type public.org_type NOT NULL, description text NOT NULL DEFAULT '', parent_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL, plan_type text NOT NULL DEFAULT 'free', invite_code text NOT NULL DEFAULT encode(gen_random_bytes(6), 'hex'), created_by uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.organization_members (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE, user_id uuid NOT NULL, role public.org_role NOT NULL DEFAULT 'member', is_system_delegate boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE (org_id, user_id));
CREATE TABLE public.properties (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), source_url text UNIQUE, title text NOT NULL, address text NOT NULL DEFAULT '', neighborhood text NOT NULL DEFAULT '', city text NOT NULL DEFAULT '', lat numeric, lng numeric, m2_total numeric NOT NULL DEFAULT 0, rooms integer NOT NULL DEFAULT 1, images text[] NOT NULL DEFAULT '{}', currency public.currency_code NOT NULL DEFAULT 'USD', price_amount numeric NOT NULL DEFAULT 0, price_expenses numeric NOT NULL DEFAULT 0, total_cost numeric NOT NULL DEFAULT 0, raw_ai_data jsonb, ref text NOT NULL DEFAULT '', details text NOT NULL DEFAULT '', created_by uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.agent_publications (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE, org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE, status public.agent_pub_status NOT NULL DEFAULT 'disponible', listing_type public.listing_type NOT NULL DEFAULT 'rent', description text NOT NULL DEFAULT '', views_count integer NOT NULL DEFAULT 0, published_by uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.user_listings (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE, org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE, current_status public.user_listing_status NOT NULL DEFAULT 'ingresado', listing_type public.listing_type NOT NULL DEFAULT 'rent', source_publication_id uuid REFERENCES public.agent_publications(id) ON DELETE SET NULL, added_by uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.feedback_attributes (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL UNIQUE, active boolean NOT NULL DEFAULT true, display_order integer NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.status_history_log (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_listing_id uuid NOT NULL REFERENCES public.user_listings(id) ON DELETE CASCADE, old_status public.user_listing_status, new_status public.user_listing_status NOT NULL, changed_by uuid NOT NULL, event_metadata jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.attribute_scores (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), history_log_id uuid NOT NULL REFERENCES public.status_history_log(id) ON DELETE CASCADE, attribute_id uuid NOT NULL REFERENCES public.feedback_attributes(id) ON DELETE CASCADE, score integer NOT NULL CHECK (score >= 1 AND score <= 5));
CREATE TABLE public.property_reviews (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE, user_id uuid NOT NULL, org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE, rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5), created_at timestamptz NOT NULL DEFAULT now(), UNIQUE (property_id, user_id));
CREATE TABLE public.family_comments (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_listing_id uuid NOT NULL REFERENCES public.user_listings(id) ON DELETE CASCADE, user_id uuid NOT NULL, text text NOT NULL, author text NOT NULL DEFAULT '', avatar text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.agency_comments (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), agent_pub_id uuid NOT NULL REFERENCES public.agent_publications(id) ON DELETE CASCADE, user_id uuid NOT NULL, text text NOT NULL, author text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.partners (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, type text NOT NULL DEFAULT '', contact_info jsonb NOT NULL DEFAULT '{}', active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.partner_leads (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE, user_id uuid NOT NULL, user_listing_id uuid REFERENCES public.user_listings(id) ON DELETE SET NULL, status text NOT NULL DEFAULT 'pending', created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.system_config (key text PRIMARY KEY, value text NOT NULL);
CREATE TABLE public.app_settings (key text PRIMARY KEY, value text NOT NULL, description text, updated_by uuid, updated_at timestamptz DEFAULT now());
CREATE TABLE public.property_views_log (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE, created_at timestamptz DEFAULT now());

-- FUNCTIONS
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role); $$;
CREATE OR REPLACE FUNCTION public.is_org_member(_user_id uuid, _org_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT EXISTS (SELECT 1 FROM public.organization_members WHERE user_id = _user_id AND org_id = _org_id); $$;
CREATE OR REPLACE FUNCTION public.is_org_owner(_user_id uuid, _org_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT EXISTS (SELECT 1 FROM public.organization_members WHERE user_id = _user_id AND org_id = _org_id AND role = 'owner'); $$;
CREATE OR REPLACE FUNCTION public.is_system_delegate(_user_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT EXISTS (SELECT 1 FROM public.organization_members WHERE user_id = _user_id AND is_system_delegate = true); $$;
CREATE OR REPLACE FUNCTION public.find_org_by_invite_code(_code text) RETURNS TABLE(id uuid, name text, description text, type public.org_type) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT id, name, description, type FROM public.organizations WHERE invite_code = _code LIMIT 1; $$;
CREATE OR REPLACE FUNCTION public.admin_update_profile_status(_user_id uuid, _status public.user_status) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN IF NOT has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Unauthorized'; END IF; UPDATE public.profiles SET status = _status WHERE user_id = _user_id; END; $$;

-- TRIGGER FUNCTIONS
CREATE OR REPLACE FUNCTION public.trg_sync_listing_status() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN UPDATE public.user_listings SET current_status = NEW.new_status, updated_at = now() WHERE id = NEW.user_listing_id; RETURN NEW; END; $$;
CREATE OR REPLACE FUNCTION public.trg_validate_listing_quota() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ DECLARE v_plan text; v_count integer; BEGIN SELECT plan_type INTO v_plan FROM public.organizations WHERE id = NEW.org_id; IF v_plan = 'free' THEN SELECT count(*) INTO v_count FROM public.user_listings WHERE org_id = NEW.org_id; IF v_count >= 5 THEN RAISE EXCEPTION 'Límite del plan gratuito alcanzado (máx 5 propiedades).'; END IF; END IF; RETURN NEW; END; $$;
CREATE OR REPLACE FUNCTION public.trg_validate_sub_teams() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ DECLARE v_count integer; BEGIN IF NEW.parent_id IS NOT NULL THEN SELECT count(*) INTO v_count FROM public.organizations WHERE parent_id = NEW.parent_id; IF v_count >= 5 THEN RAISE EXCEPTION 'Máximo de 5 sub-equipos alcanzado.'; END IF; END IF; RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_account_type text;
  v_display_name text;
  v_phone text;
  v_org_name text;
  v_org_id uuid;
BEGIN
  v_account_type := NEW.raw_user_meta_data->>'account_type';
  v_display_name := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    ''
  );
  v_phone := COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone, '');

  INSERT INTO public.profiles (user_id, display_name, phone, email, status)
  VALUES (
    NEW.id,
    v_display_name,
    v_phone,
    COALESCE(NEW.email, ''),
    CASE WHEN v_account_type = 'agency' THEN 'pending'::user_status
         ELSE 'active'::user_status END
  )
  ON CONFLICT (user_id) DO UPDATE SET
    display_name = CASE WHEN profiles.display_name = '' OR profiles.display_name IS NULL
      THEN EXCLUDED.display_name ELSE profiles.display_name END,
    phone = CASE WHEN profiles.phone = '' OR profiles.phone IS NULL
      THEN EXCLUDED.phone ELSE profiles.phone END,
    email = CASE WHEN profiles.email IS NULL OR profiles.email = ''
      THEN EXCLUDED.email ELSE profiles.email END;

  IF v_account_type = 'agency' THEN
    v_org_name := COALESCE(NEW.raw_user_meta_data->>'agency_name', v_display_name || ' Agency');
    INSERT INTO public.organizations (name, type, created_by, is_personal)
    VALUES (v_org_name, 'agency_team', NEW.id, false)
    RETURNING id INTO v_org_id;
  ELSE
    INSERT INTO public.organizations (name, type, created_by, is_personal)
    VALUES (COALESCE(NULLIF(v_display_name, ''), 'Mi Familia'), 'family', NEW.id, true)
    RETURNING id INTO v_org_id;
  END IF;

  INSERT INTO public.organization_members (org_id, user_id, role)
  VALUES (v_org_id, NEW.id, 'owner');

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user_role() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ DECLARE v_account_type text; BEGIN v_account_type := NEW.raw_user_meta_data->>'account_type'; IF v_account_type = 'agency' THEN INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'agency') ON CONFLICT DO NOTHING; ELSE INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING; END IF; RETURN NEW; END; $$;
CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE OR REPLACE FUNCTION public.handle_user_email_sync() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN UPDATE public.profiles SET email = NEW.email WHERE user_id = NEW.id; RETURN NEW; END; $$;
CREATE OR REPLACE FUNCTION public.increment_property_views(p_property_id uuid, p_is_publication boolean DEFAULT false) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN IF p_is_publication THEN UPDATE public.agent_publications SET views_count = COALESCE(views_count, 0) + 1 WHERE id = p_property_id; END IF; INSERT INTO public.property_views_log (property_id) VALUES (p_property_id); END; $$;

-- TRIGGERS
CREATE TRIGGER on_status_history_insert AFTER INSERT ON public.status_history_log FOR EACH ROW EXECUTE FUNCTION public.trg_sync_listing_status();
CREATE TRIGGER before_insert_user_listing BEFORE INSERT ON public.user_listings FOR EACH ROW EXECUTE FUNCTION public.trg_validate_listing_quota();
CREATE TRIGGER before_insert_organization BEFORE INSERT ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.trg_validate_sub_teams();
CREATE TRIGGER set_updated_at_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_organizations BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_properties BEFORE UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_agent_publications BEFORE UPDATE ON public.agent_publications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_user_listings BEFORE UPDATE ON public.user_listings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- VIEWS
CREATE OR REPLACE VIEW public.public_global_rating AS SELECT property_id, count(*) AS total_votes, round(avg(rating)::numeric, 2) AS avg_rating FROM public.property_reviews GROUP BY property_id;
CREATE OR REPLACE VIEW public.family_private_rating AS SELECT pr.property_id, pr.org_id, count(*) AS total_votes, round(avg(pr.rating)::numeric, 2) AS avg_rating, json_agg(json_build_object('user_id', pr.user_id, 'rating', pr.rating)) AS votes_detail FROM public.property_reviews pr JOIN public.organizations o ON o.id = pr.org_id AND o.type = 'family' GROUP BY pr.property_id, pr.org_id;
CREATE OR REPLACE VIEW public.agent_deserter_insights AS SELECT ap.org_id AS agency_org_id, ap.id AS publication_id, p.title, slh.new_status, slh.event_metadata, count(*) AS discard_count FROM public.status_history_log slh JOIN public.user_listings ul ON ul.id = slh.user_listing_id JOIN public.agent_publications ap ON ap.id = ul.source_publication_id JOIN public.properties p ON p.id = ap.property_id WHERE slh.new_status = 'descartado' GROUP BY ap.org_id, ap.id, p.title, slh.new_status, slh.event_metadata;
CREATE OR REPLACE VIEW public.property_insights_summary AS SELECT p.id AS property_id, p.title, fa.name AS attribute_name, count(ats.id) AS total_scores, round(avg(ats.score)::numeric, 2) AS avg_score FROM public.attribute_scores ats JOIN public.feedback_attributes fa ON fa.id = ats.attribute_id JOIN public.status_history_log slh ON slh.id = ats.history_log_id JOIN public.user_listings ul ON ul.id = slh.user_listing_id JOIN public.properties p ON p.id = ul.property_id GROUP BY p.id, p.title, fa.name;

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_history_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attribute_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_views_log ENABLE ROW LEVEL SECURITY;

-- POLICIES
CREATE POLICY "Users can view own or org profiles" ON public.profiles FOR SELECT TO authenticated USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.organization_members om1 WHERE om1.user_id = auth.uid() AND om1.org_id IN (SELECT om2.org_id FROM public.organization_members om2 WHERE om2.user_id = profiles.user_id)));
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Members can view their orgs" ON public.organizations FOR SELECT TO authenticated USING (is_org_member(auth.uid(), id) OR created_by = auth.uid());
CREATE POLICY "Admins can view all orgs" ON public.organizations FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Auth users can create orgs" ON public.organizations FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "Owners can update orgs" ON public.organizations FOR UPDATE TO authenticated USING (is_org_owner(auth.uid(), id) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners can delete orgs" ON public.organizations FOR DELETE TO authenticated USING (is_org_owner(auth.uid(), id) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Members can view org members" ON public.organization_members FOR SELECT TO authenticated USING (is_org_member(auth.uid(), org_id) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can join orgs" ON public.organization_members FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND role = 'member' AND is_system_delegate = false);
CREATE POLICY "Owners can manage members" ON public.organization_members FOR DELETE TO authenticated USING (is_org_owner(auth.uid(), org_id) OR user_id = auth.uid() OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage all members" ON public.organization_members FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Auth users can create properties" ON public.properties FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "Creator can update properties" ON public.properties FOR UPDATE TO authenticated USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Auth users can view properties" ON public.properties FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anon can view properties" ON public.properties FOR SELECT TO anon USING (true);
CREATE POLICY "Admins can delete properties" ON public.properties FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Org members can insert publications" ON public.agent_publications FOR INSERT TO authenticated WITH CHECK (is_org_member(auth.uid(), org_id) OR is_system_delegate(auth.uid()));
CREATE POLICY "Org members can update publications" ON public.agent_publications FOR UPDATE TO authenticated USING (is_org_member(auth.uid(), org_id) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Org members can view own publications" ON public.agent_publications FOR SELECT TO authenticated USING (is_org_member(auth.uid(), org_id));
CREATE POLICY "Anyone can view non-deleted publications" ON public.agent_publications FOR SELECT TO authenticated USING (status <> 'eliminado');
CREATE POLICY "Org members can delete publications" ON public.agent_publications FOR DELETE TO authenticated USING (is_org_member(auth.uid(), org_id) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Org members can view listings" ON public.user_listings FOR SELECT TO authenticated USING (is_org_member(auth.uid(), org_id) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Org members can insert listings" ON public.user_listings FOR INSERT TO authenticated WITH CHECK (is_org_member(auth.uid(), org_id) AND added_by = auth.uid());
CREATE POLICY "Org members can update listings" ON public.user_listings FOR UPDATE TO authenticated USING (is_org_member(auth.uid(), org_id) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Org members can delete listings" ON public.user_listings FOR DELETE TO authenticated USING (is_org_member(auth.uid(), org_id) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Org members can view history" ON public.status_history_log FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM user_listings ul WHERE ul.id = user_listing_id AND is_org_member(auth.uid(), ul.org_id)) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Org members can insert history" ON public.status_history_log FOR INSERT TO authenticated WITH CHECK (changed_by = auth.uid() AND EXISTS (SELECT 1 FROM user_listings ul WHERE ul.id = user_listing_id AND is_org_member(auth.uid(), ul.org_id)));
CREATE POLICY "Org members can view scores" ON public.attribute_scores FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM status_history_log slh JOIN user_listings ul ON ul.id = slh.user_listing_id WHERE slh.id = history_log_id AND is_org_member(auth.uid(), ul.org_id)) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Org members can insert scores" ON public.attribute_scores FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM status_history_log slh JOIN user_listings ul ON ul.id = slh.user_listing_id WHERE slh.id = history_log_id AND is_org_member(auth.uid(), ul.org_id)));
CREATE POLICY "Auth users can view attributes" ON public.feedback_attributes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage attributes" ON public.feedback_attributes FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Org members can view reviews" ON public.property_reviews FOR SELECT TO authenticated USING (is_org_member(auth.uid(), org_id) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert reviews" ON public.property_reviews FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND is_org_member(auth.uid(), org_id));
CREATE POLICY "Users can update own reviews" ON public.property_reviews FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Org members can view family comments" ON public.family_comments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM user_listings ul WHERE ul.id = user_listing_id AND is_org_member(auth.uid(), ul.org_id)));
CREATE POLICY "Org members can insert family comments" ON public.family_comments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM user_listings ul WHERE ul.id = user_listing_id AND is_org_member(auth.uid(), ul.org_id)));
CREATE POLICY "Users can delete own comments" ON public.family_comments FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Org members can view agency comments" ON public.agency_comments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM agent_publications ap WHERE ap.id = agent_pub_id AND is_org_member(auth.uid(), ap.org_id)));
CREATE POLICY "Org members can insert agency comments" ON public.agency_comments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM agent_publications ap WHERE ap.id = agent_pub_id AND is_org_member(auth.uid(), ap.org_id)));
CREATE POLICY "Auth users can view partners" ON public.partners FOR SELECT TO authenticated USING (active = true);
CREATE POLICY "Admins can manage partners" ON public.partners FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert leads" ON public.partner_leads FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can view own leads" ON public.partner_leads FOR SELECT TO authenticated USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Auth users can read system_config" ON public.system_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anon can read video config" ON public.system_config FOR SELECT TO anon USING (key = 'show_auth_video');
CREATE POLICY "Admins can manage system_config" ON public.system_config FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage app_settings" ON public.app_settings FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can insert views" ON public.property_views_log FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read views" ON public.property_views_log FOR SELECT USING (true);

-- SEED DATA
INSERT INTO public.feedback_attributes (name, display_order) VALUES ('Estado General', 1), ('Seguridad', 2), ('Humedad', 3), ('Precio', 4), ('Entorno', 5), ('Luminosidad', 6), ('Ruido', 7);

-- FKs
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
ALTER TABLE public.organization_members ADD CONSTRAINT organization_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
ALTER TABLE public.properties ADD CONSTRAINT properties_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
ALTER TABLE public.user_listings ADD CONSTRAINT user_listings_added_by_fkey FOREIGN KEY (added_by) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
ALTER TABLE public.agent_publications ADD CONSTRAINT agent_publications_published_by_fkey FOREIGN KEY (published_by) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
ALTER TABLE public.property_reviews ADD CONSTRAINT property_reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
ALTER TABLE public.family_comments ADD CONSTRAINT family_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
ALTER TABLE public.agency_comments ADD CONSTRAINT agency_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
ALTER TABLE public.status_history_log ADD CONSTRAINT status_history_log_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
ALTER TABLE public.partner_leads ADD CONSTRAINT partner_leads_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_referred_by_id_fkey FOREIGN KEY (referred_by_id) REFERENCES public.profiles(user_id) ON DELETE SET NULL;
ALTER TABLE public.app_settings ADD CONSTRAINT app_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.profiles(user_id) ON DELETE SET NULL;

-- is_personal column
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS is_personal BOOLEAN NOT NULL DEFAULT false;

-- sub_team type
ALTER TYPE public.org_type ADD VALUE IF NOT EXISTS 'sub_team';
