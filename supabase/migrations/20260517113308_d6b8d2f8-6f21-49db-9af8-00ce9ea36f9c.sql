-- Revoke execute from public/anon/authenticated roles for the new trigger function
REVOKE EXECUTE ON FUNCTION public.handle_new_user_role() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_role() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_role() FROM authenticated;
