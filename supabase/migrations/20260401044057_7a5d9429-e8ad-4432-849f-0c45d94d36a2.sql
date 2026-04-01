CREATE OR REPLACE FUNCTION public.trg_validate_listing_quota()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_org_plan text;
  v_user_plan text;
  v_count integer;
  v_limit integer;
  v_limit_text text;
  v_includes_market text;
BEGIN
  SELECT plan_type INTO v_org_plan FROM public.organizations WHERE id = NEW.org_id;
  SELECT plan_type INTO v_user_plan FROM public.profiles WHERE user_id = NEW.added_by;

  IF COALESCE(v_user_plan, 'free') = 'premium' OR COALESCE(v_org_plan, 'free') = 'premium' THEN
    RETURN NEW;
  END IF;

  -- Si el listing viene del marketplace, verificar si la limitación incluye marketplace
  IF NEW.source_publication_id IS NOT NULL THEN
    SELECT value INTO v_includes_market FROM public.system_config WHERE key = 'limit_includes_marketplace';
    IF COALESCE(v_includes_market, 'true') = 'false' THEN
      RETURN NEW;  -- No aplicar límite a guardados del marketplace
    END IF;
  END IF;

  SELECT value INTO v_limit_text FROM public.system_config WHERE key = 'user_free_plan_save_limit';
  v_limit := COALESCE(v_limit_text::integer, 10);

  SELECT count(*) INTO v_count FROM public.user_listings WHERE org_id = NEW.org_id;

  IF v_count >= v_limit THEN
    RAISE EXCEPTION 'Límite del plan gratuito alcanzado (máx % propiedades).', v_limit;
  END IF;

  RETURN NEW;
END;
$function$;