
CREATE OR REPLACE FUNCTION public.trg_validate_agent_publish_quota()
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
BEGIN
  -- Check org plan
  SELECT plan_type INTO v_org_plan FROM public.organizations WHERE id = NEW.org_id;
  -- Check user plan
  SELECT plan_type INTO v_user_plan FROM public.profiles WHERE user_id = NEW.published_by;

  -- Premium users/orgs have no limit
  IF COALESCE(v_user_plan, 'free') = 'premium' OR COALESCE(v_org_plan, 'free') = 'premium' THEN
    RETURN NEW;
  END IF;

  -- Get configurable limit
  SELECT value INTO v_limit_text FROM public.system_config WHERE key = 'agent_free_plan_publish_limit';
  v_limit := COALESCE(v_limit_text::integer, 3);

  -- Count active publications for this org (exclude 'eliminado')
  SELECT count(*) INTO v_count
  FROM public.agent_publications
  WHERE org_id = NEW.org_id
    AND status <> 'eliminado';

  IF v_count >= v_limit THEN
    RAISE EXCEPTION 'Límite del plan gratuito alcanzado (máx % publicaciones).', v_limit;
  END IF;

  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_agent_pub_quota_check
  BEFORE INSERT ON public.agent_publications
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_validate_agent_publish_quota();
