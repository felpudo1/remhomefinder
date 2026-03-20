-- Fix: permitir guardar user_listings cuando el usuario es premium,
-- incluso si la organización todavía figura como free.
CREATE OR REPLACE FUNCTION public.trg_validate_listing_quota()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_plan   text;
  v_user_plan  text;
  v_count      integer;
BEGIN
  SELECT plan_type INTO v_org_plan
  FROM public.organizations
  WHERE id = NEW.org_id;

  SELECT plan_type INTO v_user_plan
  FROM public.profiles
  WHERE user_id = NEW.added_by;

  -- Si el usuario es premium o la organización es premium, no aplica cupo.
  IF COALESCE(v_user_plan, 'free') = 'premium'
     OR COALESCE(v_org_plan, 'free') = 'premium' THEN
    RETURN NEW;
  END IF;

  -- Plan free: mantener límite histórico de 5.
  SELECT count(*) INTO v_count
  FROM public.user_listings
  WHERE org_id = NEW.org_id;

  IF v_count >= 5 THEN
    RAISE EXCEPTION 'Límite del plan gratuito alcanzado (máx 5 propiedades).';
  END IF;

  RETURN NEW;
END;
$$;
