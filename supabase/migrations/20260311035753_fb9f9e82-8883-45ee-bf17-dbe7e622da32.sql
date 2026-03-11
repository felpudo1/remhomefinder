
-- 1. Add referred_by_agent_id column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by_agent_id uuid;

-- 2. Create trigger for handle_new_user_profile (auto-create profile on signup)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_profile();

-- 3. Create trigger for handle_user_email_sync (sync email changes)
CREATE TRIGGER on_auth_user_email_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_email_sync();
