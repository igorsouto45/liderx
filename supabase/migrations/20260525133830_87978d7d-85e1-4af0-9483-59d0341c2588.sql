
-- Pin search_path on remaining functions
ALTER FUNCTION public.create_leadership_user(text, text, text) SET search_path = public;
ALTER FUNCTION public.handle_new_leadership_user() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.handle_updated_at() SET search_path = public;

-- Revoke direct execute from anon/authenticated on SECURITY DEFINER functions that should not be publicly callable.
-- has_role is used inside RLS policies; keep callable.
REVOKE EXECUTE ON FUNCTION public.create_leadership_user(text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_role() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_leadership_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_campaign_summary() FROM PUBLIC, anon;

-- Only admins should be able to call get_campaign_summary directly
GRANT EXECUTE ON FUNCTION public.get_campaign_summary() TO authenticated;
