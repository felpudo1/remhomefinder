
-- Trigger function: when a row is inserted into agencies, assign 'agency' role to the creator
CREATE OR REPLACE FUNCTION public.assign_agency_role_on_create()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.created_by, 'agency')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger on agencies table
DROP TRIGGER IF EXISTS trg_assign_agency_role ON public.agencies;
CREATE TRIGGER trg_assign_agency_role
  AFTER INSERT ON public.agencies
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_agency_role_on_create();
